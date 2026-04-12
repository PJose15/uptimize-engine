/**
 * SmartGym Lead Capture Agent
 *
 * Captures gym leads from multiple channels (Instagram DM, walk-in, referral, etc.),
 * qualifies them, books consultations, and creates follow-up sequences.
 */

import { executeWithFallback } from "../../../fallback";
import { logger } from "../../../logger";
import type { AgentMode } from "../../../types";
import type { LeadCaptureContext, LeadCaptureResult } from "./types";

// ========================================
// SYSTEM PROMPT
// ========================================

const SYSTEM_PROMPT = `You are "SmartGym Lead Capture Agent".

MISSION
Capture and qualify gym leads from any channel (Instagram DMs, walk-ins, referrals, website forms,
paid ads), then book consultations and create personalized follow-up sequences.

QUALIFICATION CRITERIA
Score leads 0-100 based on:
- Intent signals (asking about pricing = high, just browsing = low)
- Urgency (mentions starting soon, new year goals, event prep)
- Fit (location proximity, budget alignment, service match)
- Source quality (referral > walk-in > paid ad > cold)

RESPONSE GUIDELINES
- Respond within the tone of the channel (casual for DMs, professional for email)
- Always suggest a specific consultation time
- Never be pushy — be helpful and informative
- Personalize based on their stated goals
- Include relevant service recommendations

OUTPUT REQUIREMENTS
Return a single JSON object with:
- qualifiedLead: { leadId, name, contactMethod, source, interestLevel, servicesInterested, qualificationScore, qualificationNotes }
- consultationBooking: { suggestedDate, suggestedTime, consultationType, assignedTo, preparationNotes }
- followUpSequence: [{ stepNumber, channel, timing, messageTemplate }] (3-5 steps)
- responseToLead: string (the actual message to send back)

Return ONLY the JSON object, no additional commentary.`;

// ========================================
// HELPER FUNCTIONS
// ========================================

function buildPrompt(task: string, context: LeadCaptureContext = {}): string {
  let prompt = `${SYSTEM_PROMPT}\n\n`;

  if (context.leadSource) {
    prompt += `LEAD SOURCE: ${context.leadSource}\n`;
  }
  if (context.gymLocation) {
    prompt += `GYM LOCATION: ${context.gymLocation}\n`;
  }
  if (context.servicesOffered?.length) {
    prompt += `SERVICES OFFERED: ${context.servicesOffered.join(", ")}\n`;
  }
  if (context.leadContact) {
    prompt += `LEAD CONTACT: ${JSON.stringify(context.leadContact)}\n`;
  }
  if (context.rawInquiry) {
    prompt += `RAW INQUIRY: ${context.rawInquiry}\n`;
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

export async function runSmartGymLeadCapture(
  task: string,
  context: LeadCaptureContext = {},
  mode: AgentMode = "balanced"
): Promise<LeadCaptureResult> {
  const startTime = Date.now();

  try {
    logger.info("[SmartGym-LeadCapture] Starting lead capture agent", {}, {
      task: task.substring(0, 100),
      mode,
      leadSource: context.leadSource,
    });

    const prompt = buildPrompt(task, context);
    const result = await executeWithFallback(prompt, mode);

    if (!result.success) {
      return {
        success: false,
        message: "All AI providers failed to process lead capture",
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
      logger.error("[SmartGym-LeadCapture] JSON parsing failed", {}, {
        error: parseError instanceof Error ? parseError.message : String(parseError),
      });
      return {
        success: false,
        message: "Failed to parse lead capture response",
        error: {
          type: "JSON_PARSE_ERROR",
          details: parseError instanceof Error ? parseError.message : "Unknown parse error",
          timestamp: new Date().toISOString(),
        },
      };
    }

    const latencyMs = Date.now() - startTime;

    logger.info("[SmartGym-LeadCapture] Lead captured successfully", {
      provider: result.metadata?.provider,
    }, { latencyMs });

    return {
      success: true,
      message: "Lead captured and qualified successfully",
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
      message: "Unexpected error in SmartGym Lead Capture Agent",
      error: {
        type: "UNKNOWN_ERROR",
        details: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      },
    };
  }
}
