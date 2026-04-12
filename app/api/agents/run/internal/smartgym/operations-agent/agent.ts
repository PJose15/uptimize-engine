/**
 * SmartGym Operations Agent
 *
 * Tracks class schedules, equipment maintenance, staff operations,
 * and produces actionable ops dashboards with recommendations.
 */

import { executeWithFallback } from "../../../fallback";
import { logger } from "../../../logger";
import type { AgentMode } from "../../../types";
import type { OperationsContext, OperationsResult } from "./types";

// ========================================
// SYSTEM PROMPT
// ========================================

const SYSTEM_PROMPT = `You are "SmartGym Operations Agent".

MISSION
Produce actionable operations dashboards for gym managers, covering utilization,
equipment maintenance, staffing gaps, and class performance optimization.

ANALYSIS AREAS
1. UTILIZATION: Calculate overall gym usage, identify peak/off-peak patterns,
   flag underused spaces and equipment.
2. MAINTENANCE: Track equipment service schedules, flag overdue or urgent
   maintenance, estimate costs, and prevent downtime.
3. STAFFING: Identify shift gaps, certification expirations, trainer-to-member
   ratios, and recommend coverage adjustments.
4. CLASS OPTIMIZATION: Analyze class attendance vs. capacity, recommend
   additions/removals/reschedules based on demand patterns.

DECISION FRAMEWORK
- Safety first: any equipment issue that could cause injury = urgent alert
- Revenue impact: prioritize actions that improve member experience + retention
- Cost efficiency: balance maintenance spend vs. replacement costs
- Staff wellbeing: avoid overloading trainers, flag burnout risk

OUTPUT REQUIREMENTS
Return a single JSON object with:
- reportDate, gymLocation
- utilization: { overallUtilization, peakHours, offPeakHours, spaceUtilization, equipmentUtilization }
- maintenanceAlerts: [{ equipmentName, alertType, description, estimatedCost, scheduledDate }]
- staffingGaps: [{ timeSlot, role, severity, recommendation }]
- classRecommendations: [{ action, className, reason, expectedImpact }]
- actionItems: string[] (prioritized list)
- summary: string (executive summary paragraph)

Return ONLY the JSON object, no additional commentary.`;

// ========================================
// HELPER FUNCTIONS
// ========================================

function buildPrompt(task: string, context: OperationsContext = {}): string {
  let prompt = `${SYSTEM_PROMPT}\n\n`;

  if (context.gymLocation) {
    prompt += `GYM LOCATION: ${context.gymLocation}\n`;
  }
  if (context.reportPeriod) {
    prompt += `REPORT PERIOD: ${context.reportPeriod}\n`;
  }
  if (context.classSchedule) {
    prompt += `CLASS SCHEDULE: ${JSON.stringify(context.classSchedule)}\n`;
  }
  if (context.equipmentInventory) {
    prompt += `EQUIPMENT INVENTORY: ${JSON.stringify(context.equipmentInventory)}\n`;
  }
  if (context.staffRoster) {
    prompt += `STAFF ROSTER: ${JSON.stringify(context.staffRoster)}\n`;
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

export async function runSmartGymOperations(
  task: string,
  context: OperationsContext = {},
  mode: AgentMode = "balanced"
): Promise<OperationsResult> {
  const startTime = Date.now();

  try {
    logger.info("[SmartGym-Ops] Starting operations agent", {}, {
      task: task.substring(0, 100),
      mode,
      gymLocation: context.gymLocation,
    });

    const prompt = buildPrompt(task, context);
    const result = await executeWithFallback(prompt, mode);

    if (!result.success) {
      return {
        success: false,
        message: "All AI providers failed to generate operations report",
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
      logger.error("[SmartGym-Ops] JSON parsing failed", {}, {
        error: parseError instanceof Error ? parseError.message : String(parseError),
      });
      return {
        success: false,
        message: "Failed to parse operations report response",
        error: {
          type: "JSON_PARSE_ERROR",
          details: parseError instanceof Error ? parseError.message : "Unknown parse error",
          timestamp: new Date().toISOString(),
        },
      };
    }

    const latencyMs = Date.now() - startTime;

    logger.info("[SmartGym-Ops] Operations report generated", {
      provider: result.metadata?.provider,
    }, { latencyMs });

    return {
      success: true,
      message: "Operations dashboard generated successfully",
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
      message: "Unexpected error in SmartGym Operations Agent",
      error: {
        type: "UNKNOWN_ERROR",
        details: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      },
    };
  }
}
