/**
 * PVision Lead Routing Agent
 *
 * Qualifies inbound plumbing/HVAC service requests, scores them,
 * routes to the right technician, and generates auto-reply templates.
 */

import { executeWithFallback } from "../../../fallback";
import { logger } from "../../../logger";
import type { AgentMode } from "../../../types";
import type { LeadRoutingContext, LeadRoutingResult } from "./types";

// ========================================
// SYSTEM PROMPT
// ========================================

const SYSTEM_PROMPT = `You are "PVision Lead Routing Agent".

MISSION
Qualify and route inbound plumbing/HVAC service requests to the right technician
with the right priority, and send professional auto-replies to keep customers informed.

QUALIFICATION SCORING (0-100)
- Urgency (0-30): Emergency = 30, urgent = 20, this week = 10, flexible = 5
- Job Value (0-25): Large installs = 25, repairs = 15, maintenance = 10, estimates = 5
- Customer History (0-20): Repeat customer = 20, referral = 15, new = 10
- Service Area (0-15): In primary zone = 15, secondary = 10, edge = 5
- Readiness (0-10): Ready now = 10, needs estimate first = 5, just browsing = 2

ROUTING LOGIC
1. Emergency → nearest available tech with right specialization, no delay
2. Urgent → next available slot today, prioritize over standard jobs
3. Standard → schedule within 1-3 business days based on tech availability
4. Match specialization: plumbing jobs to plumbers, HVAC to HVAC techs
5. Balance workload: don't overload one tech if others are available

AUTO-REPLY GUIDELINES
- Acknowledge within 5 minutes (automated)
- Include expected response time
- If emergency: confirm dispatch is in progress
- Be professional but warm — these customers have a problem they need solved
- Include company hours and emergency line

OUTPUT REQUIREMENTS
Return a single JSON object with:
- requestId
- qualification: { qualificationScore, urgencyLevel, serviceCategory, estimatedJobValue, qualificationNotes }
- routing: { assignedTechnician, priority, reason, estimatedResponseTime, backupTechnician }
- autoReply: { channel, subject, messageBody, includeEstimate, followUpTime }
- internalNotes: string

Return ONLY the JSON object, no additional commentary.`;

// ========================================
// HELPER FUNCTIONS
// ========================================

function buildPrompt(task: string, context: LeadRoutingContext = {}): string {
  let prompt = `${SYSTEM_PROMPT}\n\n`;

  if (context.inboundRequest) {
    prompt += `INBOUND REQUEST: ${JSON.stringify(context.inboundRequest)}\n`;
  }
  if (context.serviceType) {
    prompt += `SERVICE TYPE: ${context.serviceType}\n`;
  }
  if (context.urgency) {
    prompt += `URGENCY: ${context.urgency}\n`;
  }
  if (context.location) {
    prompt += `LOCATION: ${context.location}\n`;
  }
  if (context.availableTechs?.length) {
    prompt += `AVAILABLE TECHNICIANS:\n${JSON.stringify(context.availableTechs, null, 2)}\n`;
  }
  if (context.notes) {
    prompt += `NOTES: ${context.notes}\n`;
  }

  prompt += `\nTASK:\n${task}\n`;
  return prompt;
}

function stripMarkdownCodeFences(text: string): string {
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/g;
  const matches = text.match(codeBlockRegex);
  if (matches && matches.length > 0) {
    return matches[0].replace(/```(?:json)?\s*/, "").replace(/```$/, "").trim();
  }
  return text.trim();
}

// ========================================
// MAIN AGENT FUNCTION
// ========================================

export async function runPVisionLeadRouting(
  task: string,
  context: LeadRoutingContext = {},
  mode: AgentMode = "balanced"
): Promise<LeadRoutingResult> {
  const startTime = Date.now();

  try {
    logger.info("[PVision-LeadRouting] Starting lead routing agent", {}, {
      task: task.substring(0, 100),
      mode,
      channel: context.inboundRequest?.channel,
    });

    const prompt = buildPrompt(task, context);
    const result = await executeWithFallback(prompt, mode);

    if (!result.success) {
      return {
        success: false,
        message: "All AI providers failed to process lead routing",
        error: {
          type: "execution_error",
          details: result.message,
          timestamp: new Date().toISOString(),
        },
      };
    }

    let parsedData;
    try {
      const cleaned = stripMarkdownCodeFences(result.message);
      parsedData = JSON.parse(cleaned);
    } catch (parseError) {
      logger.error("[PVision-LeadRouting] JSON parsing failed", {}, {
        error: parseError instanceof Error ? parseError.message : String(parseError),
      });
      return {
        success: false,
        message: "Failed to parse lead routing response",
        error: {
          type: "JSON_PARSE_ERROR",
          details: parseError instanceof Error ? parseError.message : "Unknown parse error",
          timestamp: new Date().toISOString(),
        },
      };
    }

    const latencyMs = Date.now() - startTime;

    logger.info("[PVision-LeadRouting] Lead routed successfully", {
      provider: result.metadata?.provider,
    }, { latencyMs });

    return {
      success: true,
      message: "Lead qualified and routed successfully",
      data: parsedData,
      metadata: {
        provider: result.metadata?.provider || "unknown",
        model: result.metadata?.model || "unknown",
        tokensUsed: result.metadata?.tokensUsed,
        timestamp: new Date().toISOString(),
        latencyMs,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Unexpected error in PVision Lead Routing Agent",
      error: {
        type: "UNKNOWN_ERROR",
        details: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      },
    };
  }
}
