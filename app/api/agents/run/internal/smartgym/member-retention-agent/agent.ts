/**
 * SmartGym Member Retention Agent
 *
 * Health-scores members, flags churn risk, and recommends
 * retention actions and win-back offers.
 */

import { executeWithFallback } from "../../../fallback";
import { logger } from "../../../logger";
import type { AgentMode } from "../../../types";
import type { MemberRetentionContext, MemberRetentionResult } from "./types";

// ========================================
// SYSTEM PROMPT
// ========================================

const SYSTEM_PROMPT = `You are "SmartGym Member Retention Agent".

MISSION
Analyze member health signals to predict churn, assign risk tiers, and recommend
targeted retention actions before members cancel.

HEALTH SCORE MODEL (0-100)
- Attendance Score (0-25): Based on visit frequency vs. plan type expectations
- Engagement Score (0-25): Class variety, app usage, social interactions, referrals
- Billing Score (0-25): Payment consistency, failed payments, plan changes
- Tenure Score (0-25): Longer tenure = higher score, with decay if disengaged

CHURN RISK TIERS
- Critical (0-20): Likely to cancel within 7 days — immediate intervention required
- High (21-40): Disengaging — needs personal outreach this week
- Medium (41-60): Showing early warning signs — proactive touch this month
- Low (61-80): Engaged but monitor — standard retention activities
- Healthy (81-100): Highly engaged — referral candidate

RETENTION PLAYBOOK
- Critical: Manager call + free PT session + flexible freeze option
- High: Trainer check-in + class recommendation + loyalty perk
- Medium: Automated re-engagement email + challenge invite
- Low: Standard newsletter + milestone celebrations
- Healthy: Referral incentive + ambassador program invite

OUTPUT REQUIREMENTS
Return a single JSON object with:
- memberId, healthScore (with breakdown), churnRiskTier, churnProbability
- riskFactors: string[]
- retentionActions: [{ actionType, priority, description, assignedTo, expectedImpact }]
- winBackOffers: [{ offerName, offerDetails, validDays, estimatedConversionRate }]
- personalizedMessage: string (message to send to the member)

Return ONLY the JSON object, no additional commentary.`;

// ========================================
// HELPER FUNCTIONS
// ========================================

function buildPrompt(task: string, context: MemberRetentionContext = {}): string {
  let prompt = `${SYSTEM_PROMPT}\n\n`;

  if (context.memberProfile) {
    prompt += `MEMBER PROFILE: ${JSON.stringify(context.memberProfile)}\n`;
  }
  if (context.attendanceHistory) {
    prompt += `ATTENDANCE HISTORY: ${JSON.stringify(context.attendanceHistory)}\n`;
  }
  if (context.billingStatus) {
    prompt += `BILLING STATUS: ${JSON.stringify(context.billingStatus)}\n`;
  }
  if (context.engagementSignals?.length) {
    prompt += `ENGAGEMENT SIGNALS: ${context.engagementSignals.join(", ")}\n`;
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

export async function runSmartGymMemberRetention(
  task: string,
  context: MemberRetentionContext = {},
  mode: AgentMode = "balanced"
): Promise<MemberRetentionResult> {
  const startTime = Date.now();

  try {
    logger.info("[SmartGym-Retention] Starting member retention agent", {}, {
      task: task.substring(0, 100),
      mode,
      memberId: context.memberProfile?.memberId,
    });

    const prompt = buildPrompt(task, context);
    const result = await executeWithFallback(prompt, mode);

    if (!result.success) {
      return {
        success: false,
        message: "All AI providers failed to analyze member retention",
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
      logger.error("[SmartGym-Retention] JSON parsing failed", {}, {
        error: parseError instanceof Error ? parseError.message : String(parseError),
      });
      return {
        success: false,
        message: "Failed to parse retention analysis response",
        error: {
          type: "JSON_PARSE_ERROR",
          details: parseError instanceof Error ? parseError.message : "Unknown parse error",
          timestamp: new Date().toISOString(),
        },
      };
    }

    const latencyMs = Date.now() - startTime;

    logger.info("[SmartGym-Retention] Retention analysis complete", {
      provider: result.metadata?.provider,
    }, { latencyMs });

    return {
      success: true,
      message: "Member retention analysis generated successfully",
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
      message: "Unexpected error in SmartGym Member Retention Agent",
      error: {
        type: "UNKNOWN_ERROR",
        details: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      },
    };
  }
}
