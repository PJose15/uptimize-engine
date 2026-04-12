/**
 * PVision Field Ops Agent
 *
 * Manages plumbing/HVAC field technician dispatch, route optimization,
 * ETA estimates, and emergency escalation.
 */

import { executeWithFallback } from "../../../fallback";
import { logger } from "../../../logger";
import type { AgentMode } from "../../../types";
import type { FieldOpsContext, FieldOpsResult } from "./types";

// ========================================
// SYSTEM PROMPT
// ========================================

const SYSTEM_PROMPT = `You are "PVision Field Ops Agent".

MISSION
Optimize field technician dispatch for a plumbing/HVAC service company.
Assign jobs to the right tech, optimize routes, provide accurate ETAs,
and escalate emergencies immediately.

DISPATCH RULES
1. Emergency jobs (gas leak, flooding, no heat in winter) = dispatch immediately, override schedule
2. Match tech specialization to job type (plumber for plumbing, HVAC tech for HVAC)
3. Minimize drive time by clustering nearby jobs
4. Never exceed 10-hour workday per tech without supervisor approval
5. Always assign a backup tech for emergency coverage

ROUTE OPTIMIZATION
- Group jobs by geographic zone
- Schedule furthest job first in AM, work back toward base
- Account for estimated job duration + 15min buffer between jobs
- Factor in traffic patterns (avoid rush hour cross-town routes)

ESCALATION TRIGGERS
- Emergency with no available tech → supervisor + manager alert
- Job running 2x estimated time → supervisor notification
- Customer complaint during service → manager alert
- Safety concern on site → immediate stop-work + manager alert

OUTPUT REQUIREMENTS
Return a single JSON object with:
- dispatchDate, serviceArea
- assignments: [{ jobId, technicianName, estimatedArrival, estimatedDuration, routeNotes }]
- routeOptimization: [{ technicianName, jobSequence, totalDriveTime, totalJobTime, efficiency }]
- etaEstimates: { jobId: estimatedArrival }
- escalations: [{ jobId, reason, escalationLevel, recommendedAction }]
- unassignedJobs: string[] (jobs that couldn't be assigned)
- summary: string

Return ONLY the JSON object, no additional commentary.`;

// ========================================
// HELPER FUNCTIONS
// ========================================

function buildPrompt(task: string, context: FieldOpsContext = {}): string {
  let prompt = `${SYSTEM_PROMPT}\n\n`;

  if (context.serviceArea) {
    prompt += `SERVICE AREA: ${context.serviceArea}\n`;
  }
  if (context.currentDateTime) {
    prompt += `CURRENT DATE/TIME: ${context.currentDateTime}\n`;
  }
  if (context.technicianRoster) {
    prompt += `TECHNICIAN ROSTER: ${JSON.stringify(context.technicianRoster)}\n`;
  }
  if (context.openJobs?.length) {
    prompt += `OPEN JOBS:\n${JSON.stringify(context.openJobs, null, 2)}\n`;
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

export async function runPVisionFieldOps(
  task: string,
  context: FieldOpsContext = {},
  mode: AgentMode = "balanced"
): Promise<FieldOpsResult> {
  const startTime = Date.now();

  try {
    logger.info("[PVision-FieldOps] Starting field ops agent", {}, {
      task: task.substring(0, 100),
      mode,
      serviceArea: context.serviceArea,
    });

    const prompt = buildPrompt(task, context);
    const result = await executeWithFallback(prompt, mode);

    if (!result.success) {
      return {
        success: false,
        message: "All AI providers failed to generate dispatch schedule",
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
      logger.error("[PVision-FieldOps] JSON parsing failed", {}, {
        error: parseError instanceof Error ? parseError.message : String(parseError),
      });
      return {
        success: false,
        message: "Failed to parse field ops response",
        error: {
          type: "JSON_PARSE_ERROR",
          details: parseError instanceof Error ? parseError.message : "Unknown parse error",
          timestamp: new Date().toISOString(),
        },
      };
    }

    const latencyMs = Date.now() - startTime;

    logger.info("[PVision-FieldOps] Dispatch schedule generated", {
      provider: result.metadata?.provider,
    }, { latencyMs });

    return {
      success: true,
      message: "Field ops dispatch schedule generated successfully",
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
      message: "Unexpected error in PVision Field Ops Agent",
      error: {
        type: "UNKNOWN_ERROR",
        details: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      },
    };
  }
}
