/**
 * PVision Billing Agent
 *
 * Tracks job completion, generates invoice drafts,
 * manages payment follow-up sequences, and escalates collections.
 */

import { executeWithFallback } from "../../../fallback";
import { logger } from "../../../logger";
import type { AgentMode } from "../../../types";
import type { BillingContext, BillingResult } from "./types";

// ========================================
// SYSTEM PROMPT
// ========================================

const SYSTEM_PROMPT = `You are "PVision Billing Agent".

MISSION
Generate accurate invoices from completed plumbing/HVAC jobs, create payment
follow-up sequences, and manage collection escalation to minimize bad debt.

INVOICING RULES
1. Parts markup: cost + 30% standard, cost + 50% for emergency/after-hours
2. Labor rate: standard hourly rate, 1.5x for overtime, 2x for holidays
3. Minimum charge: 1 hour for any service call
4. Travel charge: included within primary service area, $1/mile beyond
5. Warranty work: $0 for parts and labor within warranty period
6. Payment terms: Net 30 for residential, Net 45 for commercial

FOLLOW-UP SEQUENCE
- Day 0: Invoice sent (email + text confirmation)
- Day 7: Friendly payment reminder
- Day 14: Second reminder with payment link
- Day 21: Phone call from office
- Day 30: Final notice (14-day grace period)
- Day 45: Collections agency referral

COLLECTION ESCALATION
- Amounts < $500: internal collection only (3 attempts)
- Amounts $500-$2000: collections agency at Day 45
- Amounts > $2000: collections agency + potential legal review at Day 60
- Repeat offenders: require payment upfront for future services

OUTPUT REQUIREMENTS
Return a single JSON object with:
- jobId
- invoice: { invoiceNumber, customerName, jobReference, lineItems, subtotal, tax, total, dueDate, paymentTerms, notes }
- paymentFollowUpSequence: [{ stepNumber, daysAfterInvoice, channel, action, messageTemplate }]
- collectionEscalation: [{ triggerCondition, escalationLevel, action, timeline }]
- customerRiskAssessment: string
- summary: string

Return ONLY the JSON object, no additional commentary.`;

// ========================================
// HELPER FUNCTIONS
// ========================================

function buildPrompt(task: string, context: BillingContext = {}): string {
  let prompt = `${SYSTEM_PROMPT}\n\n`;

  if (context.completedJob) {
    prompt += `COMPLETED JOB: ${JSON.stringify(context.completedJob)}\n`;
  }
  if (context.partsUsed?.length) {
    prompt += `PARTS USED:\n${JSON.stringify(context.partsUsed, null, 2)}\n`;
  }
  if (context.labor) {
    prompt += `LABOR: ${JSON.stringify(context.labor)}\n`;
  }
  if (context.paymentHistory) {
    prompt += `PAYMENT HISTORY: ${JSON.stringify(context.paymentHistory)}\n`;
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

export async function runPVisionBilling(
  task: string,
  context: BillingContext = {},
  mode: AgentMode = "balanced"
): Promise<BillingResult> {
  const startTime = Date.now();

  try {
    logger.info("[PVision-Billing] Starting billing agent", {}, {
      task: task.substring(0, 100),
      mode,
      jobId: context.completedJob?.jobId,
    });

    const prompt = buildPrompt(task, context);
    const result = await executeWithFallback(prompt, mode);

    if (!result.success) {
      return {
        success: false,
        message: "All AI providers failed to generate billing output",
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
      logger.error("[PVision-Billing] JSON parsing failed", {}, {
        error: parseError instanceof Error ? parseError.message : String(parseError),
      });
      return {
        success: false,
        message: "Failed to parse billing response",
        error: {
          type: "JSON_PARSE_ERROR",
          details: parseError instanceof Error ? parseError.message : "Unknown parse error",
          timestamp: new Date().toISOString(),
        },
      };
    }

    const latencyMs = Date.now() - startTime;

    logger.info("[PVision-Billing] Invoice generated", {
      provider: result.metadata?.provider,
    }, { latencyMs });

    return {
      success: true,
      message: "Invoice and billing sequence generated successfully",
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
      message: "Unexpected error in PVision Billing Agent",
      error: {
        type: "UNKNOWN_ERROR",
        details: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      },
    };
  }
}
