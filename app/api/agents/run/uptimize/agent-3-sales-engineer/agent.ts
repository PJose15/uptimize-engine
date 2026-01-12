/**
 * UptimizeAI Agent 3: Sales Engineer & Offer Architect (Weaponized v1)
 *
 * Mission: Convert qualified calls into signed deals by running structured discovery,
 * diagnosing operational leaks, quantifying value, and producing proposals with clear scope control.
 */

import { executeWithFallback } from "../../fallback";
import { AgentMode } from "../../types";
import { Agent3Context, Agent3Result, Agent3Output } from "./types";

/**
 * System prompt for Agent 3
 */
const SYSTEM_PROMPT = `You are "UptimizeAI Sales Engineer & Offer Architect (Agent-3)".

MISSION
Convert qualified calls into signed deals by:
- running a structured discovery
- diagnosing operational leaks
- quantifying value (time/$)
- proposing a phased solution (Phase 1 fast-win → Phase 2 scale)
- producing a clean proposal/SOW + close plan
- preventing scope creep with clear boundaries

INPUTS YOU RECEIVE
- Qualified Lead Brief from Agent-2 (problem, impact, urgency, authority, stack, timeline, tags)
- Notes from the call (or transcript summary)
- Current offer catalog (packages + pricing ranges, if available)

YOU DO
1) Pre-call preparation: hypotheses, questions, and target outcome
2) Discovery OS: follow the call flow (map → leak → impact → success criteria → constraints)
3) Value quantification: produce conservative ROI/time-saved estimates
4) Offer architecture: choose "Good/Better/Best" or "Phase 1/2/3"
5) Create proposal/SOW: deliverables, timeline, responsibilities, assumptions/exclusions
6) Create close plan: next steps, objection handling, follow-up schedule
7) Produce a build-ready spec handoff to Agent-4 (delivery)

YOU DO NOT
- Do not promise guaranteed outcomes
- Do not quote firm pricing without scoped deliverables
- Do not propose complex builds before defining Phase 1 "time-to-value"
- Do not accept vague goals; always convert to measurable success criteria

DEFAULT PRICING BEHAVIOR
If pricing is not specified:
- provide ranges only after scoping (or ask 1–2 scoping questions first)
- always offer a Phase 1 low-friction option
- present pricing as tied to outcomes, scope, and delivery time

SCOPE CONTROL
Every proposal MUST include:
- what is included
- what is excluded
- change request process (how additions are handled)
- client responsibilities (access, approvals, point-of-contact)
- acceptance criteria ("Definition of Done")

OUTPUT REQUIREMENTS
Return a single JSON object with:
- pre_call_brief
- discovery_notes_structured
- value_calc
- solution_blueprint
- proposal_sow (ready to send)
- close_plan
- handoff_to_agent4_spec

Writing style: operator-grade, crisp, no fluff.

DISCOVERY OS (CALL FLOW)
This is the exact structure to follow:

1) Context + Goal (2–3 min)
   - "What made you take this call?"
   - "If this works, what changes in 30 days?"

2) Process Map (5–10 min)
   Map the flow from intake → completion:
   - Where does work enter? (DM/email/forms/calls)
   - Who touches it?
   - Where is it tracked?
   - Where does it die?

3) Leak Identification (5–10 min)
   Pick the top 1–3 leaks:
   - Follow-up leakage
   - No-show leakage
   - Inbox overload
   - CRM mess
   - No visibility / manual reporting
   - Fulfillment bottlenecks
   - Community ops burden

4) Impact Quantification (5 min)
   Convert pain into numbers:
   - "How many leads/tasks per week?"
   - "What % slips?"
   - "What's average value per win?"
   - "How much time do you spend manually?"

5) Success Criteria (3–5 min)
   Hard numbers:
   - Response time target (e.g., < 5 min)
   - Follow-up completion (e.g., 95%+)
   - No-show reduction (e.g., 30–50% improvement)
   - KPI dashboard + weekly report

6) Constraints + Risk (2–5 min)
   - Tool permissions
   - Security concerns
   - Team bandwidth
   - Timeline
   - Stakeholders

7) Decision Process (2–3 min)
   - Who decides?
   - Budget range?
   - Timeline?
   - Procurement?

8) Close the call (2 min)
   - Summarize leaks + value
   - Offer Phase 1 + next step
   - "If I send a 1-page plan + options today, can you review by {day}?"

VALUE CALCULATOR (CONSERVATIVE MATH)
Inputs:
- Hours saved/week
- $/hour assumption
- Leads recovered/week × value per lead (if relevant)

Formula:
Monthly value = (hours_saved_per_week × 4 × $/hour) + recovered_revenue_monthly

Safe "$ per hour" defaults (if unknown):
- Solo operator: $50–$100/hr
- SMB team: $75–$150/hr
- Private group operator/VC ops: $100–$200/hr

Always label as assumption.

PROPOSAL MODULES (LEGO BLOCKS)
Core modules you can mix:
1. Lead Intake + Routing Module (forms/DM/email → structured intake)
2. Follow-up Automation Module (sequences + tagging + exception handling)
3. Scheduling + No-show Module (confirmations + reminders + reschedule logic)
4. CRM Hygiene Module (pipeline stages + fields + auto-logging)
5. Ops Dashboard Module (KPIs + weekly win report)
6. Agent Guardrails Module (allowed actions, disallowed actions, QA)

Proposal structure:
- Phase 1 = Modules 2 + 3 (fast-win)
- Phase 2 = Modules 1 + 4 + 5
- Phase 3 = microSaaS or advanced multi-agent orchestration

SCOPE-CONTROL CLAUSES (NON-NEGOTIABLES)
Every SOW must include:

1) Included vs Excluded
   - Included: items listed in Deliverables
   - Excluded: anything not explicitly listed

2) Change Request Process
   - "Any work outside scope requires a written change request with price + timeline adjustment."

3) Client Responsibilities
   - Provide access, point-of-contact, approvals within X days
   - Provide brand voice, policies, business hours (if relevant)

4) Acceptance Criteria (Definition of Done)
   - "Delivered modules run through QA checklist"
   - "Training + quickstart delivered"
   - "KPIs defined + baseline captured"

5) Assumptions
   - "Assumes access to tools is provided"
   - "Assumes timely responses"
   - "Results depend on adoption and lead volume"

CLOSE PLAN ENGINE
Every deal gets:
1) Expected objections (from Agent 2 tags)
2) Response scripts (short)
3) Next steps (clear ask)
4) Follow-up schedule (Day 0, 2, 4, 7, 10)

Follow-up message pattern:
- Re-state pain
- Re-state Phase 1 win
- Ask for decision or a single blocker

PRICING WITHOUT LOCKING YOURSELF SCRIPT
When they ask pricing too early:
"Pricing depends on scope. If we're fixing follow-ups + scheduling first, it's usually a smaller Phase 1. If we're building full ops visibility and multi-agent workflows, it's bigger. Tell me which outcome matters most, and I'll give you a realistic range."`;

/**
 * JSON Schema reference (for documentation)
 * This matches the structure defined in types.ts
 */
const JSON_SCHEMA_SPEC = `
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "UptimizeAI_Agent3_SalesEngineer",
  "type": "object",
  "required": [
    "pre_call_brief",
    "discovery_notes_structured",
    "value_calc",
    "solution_blueprint",
    "proposal_sow",
    "close_plan",
    "handoff_to_agent4_spec"
  ],
  "properties": {
    "pre_call_brief": {
      "type": "object",
      "required": ["lead_id", "hypotheses", "must_answer_questions", "meeting_goal"],
      "properties": {
        "lead_id": { "type": "string" },
        "hypotheses": { "type": "array", "items": { "type": "string" } },
        "must_answer_questions": { "type": "array", "items": { "type": "string" } },
        "meeting_goal": { "type": "string" }
      }
    },
    "discovery_notes_structured": {
      "type": "object",
      "required": ["current_process_map", "leaks", "impact", "success_criteria", "constraints", "decision_process"],
      "properties": {
        "current_process_map": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Steps from lead/task intake to completion"
        },
        "leaks": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["leak_name", "where_it_happens", "symptoms", "root_cause_guess"],
            "properties": {
              "leak_name": { "type": "string" },
              "where_it_happens": { "type": "string" },
              "symptoms": { "type": "string" },
              "root_cause_guess": { "type": "string" }
            }
          }
        },
        "impact": {
          "type": "object",
          "required": ["time_cost", "revenue_cost", "quality_cost"],
          "properties": {
            "time_cost": { "type": "string" },
            "revenue_cost": { "type": "string" },
            "quality_cost": { "type": "string" }
          }
        },
        "success_criteria": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Measurable outcomes"
        },
        "constraints": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Tools, security, approvals, timeline, team limits"
        },
        "decision_process": {
          "type": "object",
          "required": ["decision_maker", "stakeholders", "budget_range_known", "timeline", "procurement_notes"],
          "properties": {
            "decision_maker": { "type": "string" },
            "stakeholders": { "type": "array", "items": { "type": "string" } },
            "budget_range_known": { "type": "boolean" },
            "timeline": { "type": "string" },
            "procurement_notes": { "type": "string" }
          }
        }
      }
    },
    "value_calc": {
      "type": "object",
      "required": ["assumptions", "time_saved_per_week_hours", "cost_per_hour_assumption", "monthly_value_estimate", "notes"],
      "properties": {
        "assumptions": { "type": "array", "items": { "type": "string" } },
        "time_saved_per_week_hours": { "type": "number" },
        "cost_per_hour_assumption": { "type": "number" },
        "monthly_value_estimate": { "type": "number" },
        "notes": { "type": "string" }
      }
    },
    "solution_blueprint": {
      "type": "object",
      "required": ["phase_1", "phase_2", "phase_3_optional", "kpis_to_track"],
      "properties": {
        "phase_1": { "$ref": "#/definitions/phase_block" },
        "phase_2": { "$ref": "#/definitions/phase_block" },
        "phase_3_optional": { "$ref": "#/definitions/phase_block" },
        "kpis_to_track": { "type": "array", "items": { "type": "string" } }
      }
    },
    "proposal_sow": {
      "type": "object",
      "required": ["summary", "deliverables", "timeline", "pricing_options", "client_responsibilities", "assumptions_exclusions", "change_request_process", "acceptance_criteria"],
      "properties": {
        "summary": { "type": "string" },
        "deliverables": { "type": "array", "items": { "type": "string" } },
        "timeline": { "type": "string" },
        "pricing_options": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["option_name", "price", "what_included", "best_for"],
            "properties": {
              "option_name": { "type": "string" },
              "price": { "type": "string" },
              "what_included": { "type": "array", "items": { "type": "string" } },
              "best_for": { "type": "string" }
            }
          }
        },
        "client_responsibilities": { "type": "array", "items": { "type": "string" } },
        "assumptions_exclusions": { "type": "array", "items": { "type": "string" } },
        "change_request_process": { "type": "string" },
        "acceptance_criteria": { "type": "array", "items": { "type": "string" } }
      }
    },
    "close_plan": {
      "type": "object",
      "required": ["primary_objections_expected", "responses", "next_steps", "follow_up_schedule"],
      "properties": {
        "primary_objections_expected": { "type": "array", "items": { "type": "string" } },
        "responses": { "type": "array", "items": { "type": "string" } },
        "next_steps": { "type": "array", "items": { "type": "string" } },
        "follow_up_schedule": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["day_offset", "message"],
            "properties": {
              "day_offset": { "type": "integer" },
              "message": { "type": "string" }
            }
          }
        }
      }
    },
    "handoff_to_agent4_spec": {
      "type": "object",
      "required": ["build_modules", "integrations", "agent_specs_needed", "risks", "definition_of_done"],
      "properties": {
        "build_modules": { "type": "array", "items": { "type": "string" } },
        "integrations": { "type": "array", "items": { "type": "string" } },
        "agent_specs_needed": { "type": "array", "items": { "type": "string" } },
        "risks": { "type": "array", "items": { "type": "string" } },
        "definition_of_done": { "type": "array", "items": { "type": "string" } }
      }
    }
  },
  "definitions": {
    "phase_block": {
      "type": "object",
      "required": ["goal", "deliverables", "time_to_value", "dependencies"],
      "properties": {
        "goal": { "type": "string" },
        "deliverables": { "type": "array", "items": { "type": "string" } },
        "time_to_value": { "type": "string" },
        "dependencies": { "type": "array", "items": { "type": "string" } }
      }
    }
  }
}`;

/**
 * Templates for reference (embedded in prompts when needed)
 */
const TEMPLATES = {
  discoveryCallAgenda: `
Discovery Call Agenda (25–35 min):
1. Context + outcomes (3 min)
2. Current process map (10 min)
3. Leak + impact quantification (10 min)
4. Success criteria + constraints (7 min)
5. Next steps (3 min)
`,

  questionScript: `
Question Script:
A) Context + Outcomes
   - "What made you take this call right now?"
   - "If this is solved in 30 days, what changes the most?"
   - "What happens if you don't solve it?"

B) Process Map (force clarity)
   - "Where does work/leads enter today?"
   - "What's the exact path from intake → done?"
   - "Who touches it and where is it tracked?"
   - "Where does it usually break or get delayed?"

C) Leak Identification (pick top 1–3)
   - "Which of these hurts most: follow-ups, scheduling/no-shows, visibility/reporting, team handoffs?"
   - "What's the #1 leak you'd fix first if you could snap your fingers?"

D) Impact Quantification (numbers)
   - "How many leads/tasks per week are we talking?"
   - "About what % slips, gets missed, or is late?"
   - "What's a win worth (avg) or what's the cost of delay?"
   - "How many hours/week do you (or team) spend manually on this?"

E) Success Criteria (measurable)
   - "What does 'working' look like—response time, follow-up completion, no-show rate, reporting?"
   - "What KPI do you want to see weekly to feel confident?"

F) Constraints + Risk
   - "What tools are you using today?"
   - "Any security/access limitations?"
   - "Who needs to approve this?"
   - "What's the timeline—when do you want Phase 1 live?"

G) Close the call (decision path)
   - "If I send a 1-page plan + 2–3 options today, can you review by {day}?"
   - "Is the main blocker usually budget, timing, or trust?"
`,

  followUpMessages: {
    day0: `Sent the 1-page plan + options. The fastest win is Phase 1 (stops {leak}). If you tell me Good/Better/Best, I'll lock the kickoff and ship the first workflow fast.`,
    day2: `Quick check—what's the main thing to get comfortable with: scope, timing, or budget? Reply with one word and I'll address it directly.`,
    day4: `Based on what you shared, Phase 1 should reduce {manual time/leak} and improve {KPI}. Even conservatively that's worth ~{value} monthly. Want me to start with Phase 1 next week?`,
    day7: `If timing's the issue, we can do either: A) Ship Phase 1 in {X days} B) Do an async mini-audit first and start the following week. Which one fits?`,
    day10: `No worries if now isn't the right time. Should I: (A) close this out, or (B) follow up around {date/window} when {trigger} hits?`
  }
};

/**
 * Build the full prompt for Agent 3
 */
function buildPrompt(task: string, context: Agent3Context): string {
  const mode = context.mode || "discovery_execution";
  const skipPricing = context.skip_pricing || false;

  let prompt = `${SYSTEM_PROMPT}

TASK: ${task}

CONTEXT:
- Mode: ${mode}
- Skip pricing: ${skipPricing ? "yes" : "no"}
`;

  // Add qualified lead brief if available
  if (context.qualified_lead_brief) {
    const brief = context.qualified_lead_brief;
    prompt += `
QUALIFIED LEAD BRIEF (from Agent-2):
- Lead ID: ${brief.lead_id || "unknown"}
- Problem: ${brief.problem || "not specified"}
- Impact: ${brief.impact || "not specified"}
- Urgency: ${brief.urgency || "not specified"}
- Authority: ${brief.authority || "not specified"}
- Stack: ${brief.stack?.join(", ") || "unknown"}
- Timeline: ${brief.timeline || "unknown"}
- Tags: ${brief.tags?.join(", ") || "none"}
- Notes: ${brief.notes || "none"}
`;
  }

  // Add call context if available
  if (context.call_context) {
    const call = context.call_context;
    prompt += `
CALL CONTEXT:
- Transcript summary: ${call.call_transcript_summary || "not provided"}
- Notes: ${call.call_notes || "not provided"}
- Duration: ${call.call_duration_minutes ? call.call_duration_minutes + " minutes" : "unknown"}
- Attendees: ${call.attendees?.join(", ") || "not specified"}
`;
  }

  // Add offer catalog if available
  if (context.offer_catalog) {
    const catalog = context.offer_catalog;
    prompt += `
OFFER CATALOG:
- Pricing philosophy: ${catalog.pricing_philosophy || "value-based, phased approach"}
`;
    if (catalog.packages && catalog.packages.length > 0) {
      prompt += `\nAvailable packages:\n${catalog.packages.map(p =>
        `  - ${p.name}: ${p.description} (${p.pricing_range || "pricing varies"})`
      ).join('\n')}`;
    }
  }

  // Add custom constraints if any
  if (context.custom_constraints && context.custom_constraints.length > 0) {
    prompt += `
CUSTOM CONSTRAINTS:
${context.custom_constraints.map(c => `- ${c}`).join('\n')}
`;
  }

  // Add mode-specific instructions
  if (mode === "pre_call_prep") {
    prompt += `
MODE-SPECIFIC INSTRUCTIONS:
You are preparing for a discovery call. Focus on:
- Building hypotheses about their operational leaks
- Crafting must-answer questions
- Setting a clear meeting goal
- Anticipating constraints and objections
`;
  } else if (mode === "proposal_generation") {
    prompt += `
MODE-SPECIFIC INSTRUCTIONS:
You are generating a formal proposal/SOW. Focus on:
- Creating clear, specific deliverables
- Providing Good/Better/Best pricing options
- Including comprehensive scope control clauses
- Making the proposal "send-ready"
`;
  } else if (mode === "close_plan_only") {
    prompt += `
MODE-SPECIFIC INSTRUCTIONS:
You are creating a close plan only. Focus on:
- Identifying expected objections
- Crafting responses
- Defining next steps
- Building a follow-up schedule (Day 0, 2, 4, 7, 10)
`;
  }

  prompt += `

OUTPUT REQUIREMENTS
Return a single JSON object following this exact structure:

${JSON_SCHEMA_SPEC}

CRITICAL REQUIREMENTS:
1. Return ONLY valid JSON. No markdown code fences. No trailing commas. No comments.
2. All required fields must be present and properly typed.
3. Pricing should be ranges or "TBD after scoping" if not enough information is provided.
4. Every proposal must include scope control clauses.
5. Value calculations must show conservative assumptions.
6. Phase 1 should always be a "fast win" (7-14 days to value).
7. Close plan must include follow-up messages for Day 0, 2, 4, 7, and 10.
8. Writing style: operator-grade, crisp, no fluff.

CRITICAL: Return ONLY valid JSON. No markdown code fences. No trailing commas. Check your JSON validity before outputting.`;

  return prompt;
}

/**
 * Main function to run Agent 3
 */
export async function runAgent3SalesEngineer(
  task: string,
  context: Agent3Context = {},
  mode: AgentMode = "balanced"
): Promise<Agent3Result> {
  const startTime = Date.now();

  try {
    // Build the prompt
    const prompt = buildPrompt(task, context);

    // Execute with fallback system
    const result = await executeWithFallback(prompt, mode);

    // If the request failed, return the error
    if (!result.success) {
      return {
        success: false,
        message: result.message,
        error: {
          type: result.error?.type || "UNKNOWN_ERROR",
          details: result.error?.details || "Unknown error",
          timestamp: new Date().toISOString(),
        },
        metadata: {
          provider: result.metadata?.provider || "unknown",
          model: result.metadata?.model || "unknown",
          tokensUsed: result.metadata?.tokensUsed,
          timestamp: new Date().toISOString(),
          latencyMs: Date.now() - startTime,
        },
      };
    }

    // Extract and validate JSON from the response
    let rawResponse = result.message.trim();

    // Strip markdown code fences if present
    const patterns = [
      /```json\s*\n([\s\S]*?)\n```/,
      /```\s*\n([\s\S]*?)\n```/,
      /```json([\s\S]*?)```/,
      /```([\s\S]*?)```/
    ];

    for (const pattern of patterns) {
      const match = rawResponse.match(pattern);
      if (match) {
        rawResponse = match[1].trim();
        break;
      }
    }

    // Try to parse the JSON
    const parsed: Agent3Output = JSON.parse(rawResponse);

    // Validate basic structure
    if (!parsed.pre_call_brief ||
        !parsed.discovery_notes_structured ||
        !parsed.value_calc ||
        !parsed.solution_blueprint ||
        !parsed.proposal_sow ||
        !parsed.close_plan ||
        !parsed.handoff_to_agent4_spec) {
      throw new Error("Missing required fields in output");
    }

    // Return success
    return {
      success: true,
      message: "Sales engineering output generated successfully",
      data: parsed,
      metadata: {
        provider: result.metadata?.provider || "unknown",
        model: result.metadata?.model || "unknown",
        tokensUsed: result.metadata?.tokensUsed,
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startTime,
      },
    };
  } catch (jsonError) {
    // If JSON parsing fails, return an error
    const errorMessage = jsonError instanceof Error ? jsonError.message : String(jsonError);

    return {
      success: false,
      message: "Failed to parse Agent 3 response as JSON",
      error: {
        type: "JSON_PARSE_ERROR",
        details: `JSON parse error: ${errorMessage}`,
        timestamp: new Date().toISOString(),
      },
      metadata: {
        provider: "unknown",
        model: "unknown",
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startTime,
      },
    };
  }
}
