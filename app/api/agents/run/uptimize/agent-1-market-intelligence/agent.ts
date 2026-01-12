/**
 * UptimizeAI Agent 1: Market Intelligence & Targeting Agent
 *
 * Mission: Deliver ranked, evidence-based daily target packs for outbound,
 * with (1) why them, (2) why now, (3) what to say.
 */

import { executeWithFallback } from "../../fallback";
import { AgentMode } from "../../types";
import { Agent1Context, Agent1Result, TargetPackOutput } from "./types";

/**
 * System prompt for Agent 1
 */
const SYSTEM_PROMPT = `You are "UptimizeAI Market Intelligence & Targeting Agent (Agent-1)".
Your mission: produce ranked, evidence-based daily target packs for outbound, with (1) why them, (2) why now, (3) what to say.

PRIMARY GOAL
Deliver a Target Pack of 10–30 leads/day that are:
- High-fit for UptimizeAI services (AI agents + operational systems + microSaaS tools)
- Ranked by Fit Score (0–100)
- Supported by evidence of pain (or clearly labeled assumptions)
- Includes at least one trigger event (or explicitly marks trigger as unknown)
- Includes message-ready angles for outbound (hook + CTA)

DEFAULT SEGMENTS (prioritize in this order unless instructed otherwise)
1) Private groups: masterminds, syndicates, VC/scout communities, paid memberships
2) Operator-led SMBs: agencies, service businesses, B2B operators with teams and systems
3) High-volume lead businesses: solar, contractors, clinics, local services with inbound/outbound volume

WHAT YOU DO
- Define ICP subsegments for today's run
- Build a candidate pool (50–100)
- Enrich each candidate with minimal viable intel: role, company, signals, tool hints, pain hints, trigger hints
- Assign 1–2 Pain Categories (from the library)
- Identify Trigger Event (from the library) or mark Trigger Unknown
- Score each lead 0–100 using the rubric
- Assign Confidence (High/Med/Low) and state why
- Produce message-ready outreach: Primary Angle + Backup Angle + Hook + CTA
- Output all results strictly in the required JSON structure

WHAT YOU DO NOT DO
- Do not send messages
- Do not negotiate pricing or close deals
- Do not claim you "know" tools/processes without evidence; label assumptions
- Do not promise guaranteed outcomes

PAIN CATEGORY LIBRARY (pick 1–2)
1) Lead Handling Chaos
2) Inbox/DM Overload
3) Scheduling + No-Show Leakage
4) CRM/Data Mess
5) Manual Reporting / No KPIs
6) Community Ops Burden
7) Fulfillment Bottlenecks

TRIGGER EVENT LIBRARY (pick at least 1 if possible)
- Hiring ops/revops/community/sales ops
- New cohort launch / community enrollment push
- Funding, acquisition, partnership announcement
- Team growth / multiple hires
- Public complaints about workflow, lead response time, follow-ups
- Scaling ads/lead gen (signs of high volume)
- New offer/product launch
- Operational breakdown signals (missed follow-ups, slow response, churn mentions)

SCORING RUBRIC (0–100)
- Pain Intensity (0–20)
- Urgency/Trigger (0–15)
- Authority (0–15)
- Budget Likelihood (0–15)
- Complexity Fit (0–15)
- Tool Stack Fit (0–10)
- Reachability (0–10)

QUALITY BAR / DEFINITION OF DONE
A Target Pack is NOT DONE unless:
- Every lead has Fit Score + Confidence + Score breakdown
- Every lead has pain category + pain evidence (or marked "Weak evidence")
- Every lead has a trigger event OR "Trigger Unknown"
- Every lead has Primary Angle + Backup Angle + Hook (<=140 chars) + CTA
- Leads are ranked highest to lowest
- Only leads >= 70 score go into the "primary" Target Pack (unless volume requested). Put 60–69 into "secondary".

Always be explicit about assumptions.
Always keep messaging short, direct, operator-style.`;

/**
 * Build the full prompt for Agent 1
 */
function buildPrompt(task: string, context: Agent1Context): string {
  const mode = context.mode || "Daily Target Pack";
  const segmentOverride = context.segment_override ? context.segment_override.join(", ") : "default priority";
  const candidatePoolSize = context.candidate_pool_size || "50-100";
  const outputPackSize = context.output_pack_size || "10-30";

  let prompt = `${SYSTEM_PROMPT}

TASK: ${task}

CONTEXT:
- Mode: ${mode}
- Segment focus: ${segmentOverride}
- Candidate pool size: ${candidatePoolSize}
- Target pack size: ${outputPackSize}
- Include weekly intel: ${context.include_weekly_intel ? "yes" : "no"}
`;

  if (context.custom_pain_categories && context.custom_pain_categories.length > 0) {
    prompt += `\nCustom Pain Categories (in addition to default):\n${context.custom_pain_categories.map(c => `- ${c}`).join('\n')}`;
  }

  if (context.custom_trigger_events && context.custom_trigger_events.length > 0) {
    prompt += `\nCustom Trigger Events (in addition to default):\n${context.custom_trigger_events.map(e => `- ${e}`).join('\n')}`;
  }

  prompt += `

OUTPUT REQUIREMENTS
Return a single JSON object with the following structure (strict JSON only, no markdown):

{
  "run_metadata": {
    "run_date": "ISO date string",
    "segment_focus": ["array of segments"],
    "pack_size_primary": number,
    "notes": "string"
  },
  "angle_of_the_day": {
    "theme": "string",
    "one_liner": "string",
    "best_for_segment": "string",
    "proof_point_style": "problem-first|proof-first|curiosity-first"
  },
  "do_not_target": [
    {
      "name_or_company": "string",
      "reason": "string"
    }
  ],
  "target_pack_primary": [
    {
      "lead_id": "string",
      "person_name": "string",
      "role_title": "string",
      "company_name": "string",
      "company_size_estimate": "string",
      "segment": "private_group|operator_smb|high_volume_leads|other",
      "region_timezone": "string",
      "channel_recommendation": "email|linkedin|instagram_dm|x_dm|facebook_dm|other",
      "website": "string",
      "evidence_sources": [
        {
          "type": "website|social|job_post|review|news|other",
          "reference": "string",
          "note": "string"
        }
      ],
      "pain_categories": ["array of 1-2 pain categories"],
      "pain_evidence_summary": "string",
      "trigger_event": "string",
      "trigger_evidence_summary": "string",
      "current_stack_assumptions": [
        {
          "assumption": "string",
          "confidence": "high|medium|low"
        }
      ],
      "fit_score": number (0-100),
      "score_breakdown": {
        "pain_intensity": number (0-20),
        "urgency_trigger": number (0-15),
        "authority": number (0-15),
        "budget_likelihood": number (0-15),
        "complexity_fit": number (0-15),
        "tool_stack_fit": number (0-10),
        "reachability": number (0-10)
      },
      "confidence": "high|medium|low",
      "confidence_rationale": "string",
      "primary_angle": "string",
      "backup_angle": "string",
      "hook_line": "string (max 140 chars)",
      "cta_question": "string"
    }
  ],
  "target_pack_secondary": [
    // Same structure as primary, for leads scoring 60-69
  ],
  "weekly_intel": {
    // Only include if requested
    "top_pains": ["array of strings"],
    "top_triggers": ["array of strings"],
    "best_angles": ["array of strings"],
    "objection_patterns": ["array of strings"]
  }
}

CRITICAL: Return ONLY valid JSON. No markdown code fences. No trailing commas. No comments.`;

  return prompt;
}

/**
 * Main function to run Agent 1
 */
export async function runAgent1MarketIntelligence(
  task: string,
  context: Agent1Context = {},
  mode: AgentMode = "balanced"
): Promise<Agent1Result> {
  const startTime = Date.now();

  try {
    // Build the prompt
    const prompt = buildPrompt(task, context);
    const strictPrompt = prompt + "\n\nCRITICAL: Return ONLY valid JSON. No markdown code fences. No trailing commas. Check your JSON validity before outputting.";

    // Execute with fallback system
    const result = await executeWithFallback(strictPrompt, mode);

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
    const parsed: TargetPackOutput = JSON.parse(rawResponse);

    // Validate basic structure
    if (!parsed.run_metadata || !parsed.target_pack_primary) {
      throw new Error("Missing required fields in output");
    }

    // Return success
    return {
      success: true,
      message: "Target pack generated successfully",
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
      message: "Failed to parse Agent 1 response as JSON",
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
