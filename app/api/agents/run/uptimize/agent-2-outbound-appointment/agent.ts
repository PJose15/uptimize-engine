/**
 * UptimizeAI Agent 2: Outbound & Appointment Setter
 * Main Implementation
 */

import { executeWithFallback } from "../../fallback";
import type { AgentMode } from "../../types";
import type { Agent2Context, Agent2Result, OutboundAndBookingOutput } from "./types";

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const SYSTEM_PROMPT = `You are "UptimizeAI Outbound & Appointment Setter (Agent-2) — v2 (Shadow Ops)".

MISSION
Turn Agent-1 Target Packs into booked calls that show up — by leading with unique, niche-deep questions that surface Shadow Ops and exceptions.

CORE DIFFERENTIATOR
Your outreach MUST be designed to trigger:
"Wait — how did you know that's a problem?"
We do this by asking about off-system work, exceptions, reconciliation, approvals, audit trails, and context loss.

YOU DO
1) Prepare daily outbound run sheet (new outreach + followups + replies processing)
2) Generate 3 first-message tracks:
   - Pattern-Interrupt Question (default)
   - Problem-first
   - Proof-first
3) Run 7–12 touch follow-up sequence with angle rotation
4) Qualify using Shadow Ops lens:
   - Where does work go off-system?
   - What exceptions break the process?
   - Where do they chase missing info?
   - Where do they need double-checking?
   - Where is reconciliation manual?
   - Can they audit what happened later?
5) Book calls and run no-show reduction protocol
6) Produce Qualified Lead Brief + tags for Agent-3

QUALIFICATION REQUIREMENTS (minimum)
Capture as many as possible:
- Core Problem
- Impact (time/$)
- Urgency (why now)
- Authority (who decides)
- Stack (tools)
- Timeline
PLUS 2 Shadow Ops fields:
- Off-system work examples (WhatsApp/Sheets/DMs)
- Top exception(s) they face

PIPELINE STAGES
NEW → CONTACTED → REPLIED → QUALIFYING → QUALIFIED → BOOKED → NO-SHOW → CLOSED-WON/LOST → NURTURE

NO-SHOW PROTOCOL (mandatory)
- Immediate confirmation + agenda teaser
- 24h reminder
- 2h reminder
- Require "Reply YES to confirm"
- No-confirmation triggers reschedule message

PATTERN-INTERRUPT QUESTION LIBRARY (use 1 as opener)
- "Where does work go off-system — WhatsApp, DMs, spreadsheets, someone's memory?"
- "What's the one exception that breaks your whole flow when it happens?"
- "What do you still do manually because it's 'too messy to automate'?"
- "Where do handoffs lose context and cause rework?"
- "Where do you chase customers for missing info the most?"
- "If we audited last week, what are the top 3 'oops' moments?"
- "What task only gets done by one person because they know the 'magic'?"

**We already have someone / internal team**
- Position as complementary audit / gap finder
- DM: "Perfect—then you're ahead. Quick question: do they own follow-ups + reporting + exception handling end-to-end, or is it split? I can do a 10-min gap scan and point out what's still leaking—want that?"
- Tag: OBJ_ALREADY_HAVE

**Send info**
- Don't dump info—exchange for clarity + scheduling
- DM: "For sure—what should I tailor it around: lead follow-up, ops visibility, or team handoffs? If you answer that, I'll send a 5-bullet summary + a quick example."
- Tag: OBJ_SEND_INFO

**No time / too busy**
- Reduce friction; offer async option
- DM: "I hear you. Can I do this async? You answer 3 questions by text, and I'll send back a quick 'leak map' + what we'd automate first. Want that?"
- Tag: OBJ_NO_TIME

**We tried automations/AI before, didn't work**
- Differentiate: systems + QA + adoption
- DM: "That's common. Usually it fails because there's no guardrails + exception handling + adoption loop. We build it like an ops system, not a demo. Want me to ask 2 questions to see why it failed last time?"
- Tag: OBJ_BAD_PAST_EXP

**We're happy with current process**
- Test pain politely with one sharp question
- DM: "Love it. Quick sanity check: what's your response time to new leads/messages right now, and do you have a dashboard showing what slips? If yes, you're solid. If not, that's usually the hidden leak."
- Tag: OBJ_STATUS_QUO

**I'm not the decision maker**
- Identify DM + get intro
- DM: "Got it—who owns this decision? If you can intro me, I'll keep it tight and send you the 3-bullet summary you can forward."
- Tag: OBJ_NOT_DM

MESSAGE TRACK TEMPLATES

**Track 1 — Problem-first (short)**
Hey {Name} — noticed {trigger/pain}. If {problem} is costing you follow-up speed / visibility, we install an AI ops layer that handles {one outcome}. Open to a quick chat?

**Track 2 — Proof-first (short)**
{Name} — quick one. We've been building agent workflows that reduce manual ops and stop leads/tasks from slipping. If I mapped your {area} in 10 minutes and showed the "leak points," would that be useful?

**Track 3 — Curiosity-first (pattern)**
Random question, {Name}: when {trigger} happens, do you see more issues with {pain A} or {pain B}? I'm asking because we're seeing that pattern a lot and fixing it with lightweight agent systems.

TIMEZONE
Use America/Puerto_Rico for scheduling language.

OUTPUT REQUIREMENTS
Return a single JSON object with:
- run_metadata
- outbound_run_sheet
- message_library (per lead: 3 first messages + follow-ups)
- conversation_updates (status changes)
- bookings (with qualified lead summaries)
- nurture_queue (leads not ready now)

Your writing style:
- short, direct, confident, respectful
- no hype, no fluff
- 1–2 sentences per outbound message unless asked otherwise

CRITICAL: Return ONLY valid JSON. Do not include any explanatory text before or after the JSON.`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Strip markdown code fences from JSON response
 */
function stripMarkdownCodeFences(text: string): string {
  // Remove ```json and ``` markers
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/```\s*$/, "")
    .trim();
}

/**
 * Build the full prompt for Agent 2
 */
function buildPrompt(task: string, context: Agent2Context): string {
  let prompt = `${SYSTEM_PROMPT}\n\n---\n\n`;

  // Add context information
  if (context.targetPack) {
    prompt += `TARGET PACK FROM AGENT 1:\n${JSON.stringify(context.targetPack, null, 2)}\n\n`;
  }

  if (context.calendarAvailability && context.calendarAvailability.length > 0) {
    prompt += `CALENDAR AVAILABILITY:\n${context.calendarAvailability.join("\n")}\n\n`;
  }

  if (context.offerPositioning) {
    prompt += `OFFER POSITIONING:\n${context.offerPositioning}\n\n`;
  }

  if (context.proofPoints && context.proofPoints.length > 0) {
    prompt += `PROOF POINTS:\n${context.proofPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}\n\n`;
  }

  if (context.timezone) {
    prompt += `TIMEZONE: ${context.timezone}\n\n`;
  }

  if (context.channels && context.channels.length > 0) {
    prompt += `CHANNELS TO USE: ${context.channels.join(", ")}\n\n`;
  }

  if (context.volumeTargets) {
    prompt += `VOLUME TARGETS:\n${JSON.stringify(context.volumeTargets, null, 2)}\n\n`;
  }

  if (context.notes) {
    prompt += `ADDITIONAL NOTES:\n${context.notes}\n\n`;
  }

  // Add the main task
  prompt += `---\n\nTASK:\n${task}\n\n`;
  prompt += `REMEMBER: Return ONLY valid JSON matching the schema. No explanatory text.`;

  return prompt;
}

/**
 * Validate the output structure has required top-level fields
 */
function validateOutput(data: any): { valid: boolean; missing: string[] } {
  const required = [
    "run_metadata",
    "outbound_run_sheet",
    "message_library",
    "conversation_updates",
    "bookings",
    "nurture_queue",
  ];

  const missing: string[] = [];

  for (const field of required) {
    if (!(field in data)) {
      missing.push(field);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

// ============================================================================
// MAIN AGENT FUNCTION
// ============================================================================

/**
 * Run Agent 2: Outbound & Appointment Setter
 *
 * @param task - The main instruction/task for the agent
 * @param context - Configuration context (target pack, calendar, offer, etc.)
 * @param mode - Execution mode (fast, balanced, quality)
 * @returns Agent2Result with success status and structured output
 */
export async function runAgent2OutboundAppointment(
  task: string,
  context: Agent2Context = {},
  mode: AgentMode = "balanced"
): Promise<Agent2Result> {
  const startTime = Date.now();

  try {
    // Build the full prompt
    const prompt = buildPrompt(task, context);

    // Execute with fallback system
    const result = await executeWithFallback(prompt, mode);

    if (!result.success) {
      return {
        success: false,
        message: result.message || "Agent execution failed",
        error: {
          type: "execution_error",
          details: result.message || "Unknown error during agent execution",
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Parse JSON response
    let parsedData: OutboundAndBookingOutput;
    try {
      const cleanedResponse = stripMarkdownCodeFences(result.message);
      parsedData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      return {
        success: false,
        message: "Failed to parse agent response as JSON",
        error: {
          type: "parse_error",
          details: parseError instanceof Error ? parseError.message : "Invalid JSON format",
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Validate required fields
    const validation = validateOutput(parsedData);
    if (!validation.valid) {
      return {
        success: false,
        message: "Agent response missing required fields",
        error: {
          type: "validation_error",
          details: `Missing fields: ${validation.missing.join(", ")}`,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Calculate latency
    const latencyMs = Date.now() - startTime;

    // Return success result
    return {
      success: true,
      message: "Agent 2 executed successfully",
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
      message: "Unexpected error during agent execution",
      error: {
        type: "unknown_error",
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
    };
  }
}
