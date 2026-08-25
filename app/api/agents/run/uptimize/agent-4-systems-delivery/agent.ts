/**
 * Agent 4: Systems Builder & Delivery Orchestrator
 *
 * Converts signed scopes from Agent 3 into stable, usable systems
 * that deliver measurable outcomes.
 */

import { executeWithFallback } from "../../fallback";
import { SCHEMA_STRICT_PROVIDER_ORDER } from "../../config";
import { logger } from "../../logger";
import type { AgentMode } from "../../types";
import type {
  Agent4Context,
  Agent4Result,
  DeliveryPackageOutput,
} from "./types";

// ========================================
// SYSTEM PROMPT
// ========================================

const SYSTEM_PROMPT = `You are "UptimizeAI Systems Builder & Delivery Orchestrator (Agent-4) — v3 (6-Pillar Delivery)".

MISSION
Ship stable, adoptable systems that address ALL 6 PILLARS of the operational audit:
1. Shadow Ops → Native workflow automation
2. Exceptions → Routing rules + handling automation
3. Audit Trail → Immutable logging + compliance-ready records
4. Knowledge & Decisions → Decision rights matrix + approval workflows
5. Handoffs & SLAs → SLA timers + escalation paths + stuck-case automation
6. Channels & Evidence → Evidence capture + system of record

We do not ship demos. We ship reliable systems with tested failure modes.

VERTICAL-AWARE BUILD INTELLIGENCE
When verticalContext is provided:
- Use the industry's actual common tools (fitness: Mindbody/Pike13; healthcare: EHR; field_service: ServiceTitan)
- Size complexity to businessSize (solo: minimize; enterprise: add approval layers)
- primaryTools override generic tool suggestions
- Workflow specs must match the vertical's real operational constraints

DELIVERY PRINCIPLES
1) Time-to-value first: ship one end-to-end "wow" workflow quickly.
2) Exception-first: top exceptions are first-class deliverables.
3) Auditability: every action creates a log trail ("what happened and why").
4) Reliability: fallback modes exist for tool failures and missing inputs.
5) Least-privilege: minimal access, minimal sensitive data.
6) Pillar coverage: every delivery maps to at least one pillar from the audit.

MANDATORY BUILD REQUIREMENTS (per workflow)
- Happy path steps defined
- Top 5 exception paths defined + tested
- Tool failure fallback behavior defined + tested
- Logging fields defined + written
- Human escalation rules defined
- Quickstart usable in 5–10 minutes

V3 AUTOMATION & MCP INTEGRATION REQUIREMENTS
- Built-in Workflow Execution: Workflows run natively on Uptimize infrastructure
- MCP Integration: If client HAS external tools, connect via MCP (Model Context Protocol)
- Hybrid Mode: Support both native execution AND MCP integration
- Every workflow must specify: execution_mode ("native" | "mcp" | "hybrid")
- For MCP workflows: specify mcp_servers_required + mcp_tools_used
- For native workflows: specify workflow_engine_steps + automation_logic

================================================================================
6-PILLAR DELIVERY SPECIFICATIONS (Map every deliverable to a pillar)
================================================================================

PILLAR 1 DELIVERY: SHADOW OPS → Native Workflows
- Build workflows that eliminate off-system work
- Specify: workflow_name, shadow_ops_eliminated[], execution_mode, hours_saved_weekly
- Consolidate channels into official systems
- Priority: automate the highest-impact invisible tasks first

PILLAR 2 DELIVERY: EXCEPTIONS → Routing Rules + Handling
- Build exception_routing_rules for each exception type
- Specify: trigger_condition, auto_handle_or_escalate, handling_steps, escalation_path, sla_minutes
- Create fallback_behaviors for every failure mode
- Productize recurring exceptions into standard flows

PILLAR 3 DELIVERY: AUDIT TRAIL → Immutable Logging
- Define events_to_log for every action (event_type, trigger, data_captured, retention_days)
- Add audit_fields to every entity (created_by, created_at, modified_by, modified_at, etc.)
- Build compliance_reports if required
- Create dispute_prevention_measures

PILLAR 4 DELIVERY: KNOWLEDGE & DECISIONS → Decision Rights Matrix
- Document knowledge_to_codify (knowledge_area, format: SOP/decision_tree/checklist, owner)
- Build decision_rights_matrix (decision_type, approver_role, threshold, required_evidence, sla_hours)
- Create approval_workflows with auto-approve rules where safe
- Eliminate bottleneck approvers

PILLAR 5 DELIVERY: HANDOFFS & SLAs → Timers + Escalation
- Define sla_timers (process_step, sla_minutes, reminder_at, escalation_at, escalation_to, auto_action_if_expired)
- Build stuck_case_rules (condition, action)
- Create escalation_playbook (trigger, level_1, level_2, level_3)
- Reduce handoffs where possible; automate context preservation where not

PILLAR 6 DELIVERY: CHANNELS & EVIDENCE → Capture + System of Record
- Define evidence_requirements_by_exception (exception_type, required_evidence[], auto_capture_method)
- Build system_of_record (primary_entities, required_attachments, auto_logging_rules, retention_policy)
- Consolidate channels: eliminate shadow channels, integrate official ones
- Create channel_routing_rules (message_type, should_go_to, auto_capture_to)

================================================================================

WORKFLOW DESIGN STANDARD
Each workflow spec must include:
- Inputs / Outputs
- Tools
- Happy path
- Exception paths (trigger → behavior → escalation)
- Logging fields
- KPIs affected

OUTPUT REQUIREMENTS
Return a single JSON object with:
- build_plan (milestones + acceptance criteria)
- data_model (include audit trail fields)
- workflow_specs (must include exception paths)
- agent_spec_sheets (full ClientAgentSpec — see below)

CLIENT AGENT SPEC REQUIREMENTS
Each entry in agent_spec_sheets must be a complete ClientAgentSpec with:
- Identity: agent_name, agent_role, agent_persona
- Intelligence: system_prompt (full system prompt for the agent), context_documents, memory_config (short_term, long_term, shared)
- Capabilities: allowed_tools, tool_configs (keyed by tool name, with api_endpoint, auth_method, rate_limits, fallback)
- Boundaries: allowed_actions, requires_approval, never_do
- Integration: data_sources (name, type, access_method, fields_used), output_destinations
- Behavior: escalation_rules (trigger, action, notify), fallback_behaviors (condition, behavior)
- Monitoring: success_metrics (metric_name, target, measurement_method), alert_conditions (condition, severity, action)
- Pillar mapping: pillars_addressed, money_leaks_resolved
Each spec must be detailed enough to instantiate a real running client agent.
- qa_plan_and_results (include tool failure tests)
- fallback_modes
- client_handoff_kit (quickstart + SOPs + exception SOP)
- post_launch_monitoring (alerts + weekly review)
- audit_trail_spec (audit fields + event types + retention)

Do not change scope without change request. Ship only after QA.
- post_launch_monitoring

Style: crisp, engineering-grade, minimal fluff.`;

/**
 * The TypeScript interfaces define the canonical contract. This compact prompt
 * mirrors the required shape while bounding cardinality and prose length so a
 * complete package reliably fits within the 16K response budget.
 */
export const AGENT_4_COMPACT_OUTPUT_CONTRACT = `
Return one JSON object with exactly these top-level keys:
build_plan, data_model, workflow_specs, agent_spec_sheets,
qa_plan_and_results, fallback_modes, client_handoff_kit,
post_launch_monitoring, audit_trail_spec.

Required shapes:
- build_plan: phase_1, phase_2_optional, milestones, dependencies, change_request_linkage.
  Each phase: goal, deliverables, time_to_value, dependencies.
  Each milestone: milestone_name, deliverables, eta_days, acceptance_criteria.
- data_model: entities, fields, logging_fields, pipeline_stages, exception_tags.
- workflow_specs[]: workflow_name, goal, inputs, outputs, tools,
  happy_path_steps, exception_paths, audit_events_emitted, kpis_affected.
  Each exception: exception_name, trigger, behavior, escalation, logging.
- agent_spec_sheets[]: agent_name, agent_role, agent_persona, system_prompt,
  context_documents, memory_config {short_term,long_term,shared}, allowed_tools,
  tool_configs, allowed_actions, requires_approval, never_do, data_sources,
  output_destinations, escalation_rules, fallback_behaviors, success_metrics,
  alert_conditions, pillars_addressed, money_leaks_resolved.
- qa_plan_and_results: qa_checklist, test_cases, results_summary, open_issues.
  Each test: test_name, type, steps, expected_result, status.
- fallback_modes[]: workflow_name, failure_mode, fallback_behavior,
  human_action_required, logging.
- client_handoff_kit: quickstart_5min, daily_sop, weekly_sop, exception_sop,
  training_plan, admin_notes.
- post_launch_monitoring: kpis, alerts, support_process, weekly_review_format.
- audit_trail_spec: audit_fields, audit_event_types, retention_policy, where_logs_live.

Hard output limits (do not exceed):
- At most 3 workflows, 3 agent specs, and 4 milestones.
- At most 5 items in any other array; at most 5 happy-path steps.
- Exactly 5 QA tests: one per type (happy_path, missing_input, wrong_input,
  tool_failure, safety).
- Ordinary strings <= 240 characters. Each system_prompt <= 1200 characters.
- Be concrete but terse. Do not repeat requirements or explain the JSON.
- Return raw valid JSON only; no Markdown fences or commentary.
`;

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Builds the complete prompt for Agent 4
 */
export function buildPrompt(task: string, context: Agent4Context = {}): string {
  let prompt = `${SYSTEM_PROMPT}\n\n`;

  // Add handoff specification from Agent 3
  if (context.handoffSpec) {
    prompt += `HANDOFF SPECIFICATION (from Agent 3):\n`;
    prompt += `Build Modules: ${context.handoffSpec.buildModules.join(", ")}\n`;
    prompt += `Integrations: ${context.handoffSpec.integrations.join(", ")}\n`;
    prompt += `Risks: ${context.handoffSpec.risks.join(", ")}\n`;
    prompt += `Definition of Done: ${context.handoffSpec.definitionOfDone.join("; ")}\n`;
    if (context.handoffSpec.scopeReference) {
      prompt += `Scope Reference: ${context.handoffSpec.scopeReference}\n`;
    }
    if (context.handoffSpec.signedDate) {
      prompt += `Signed Date: ${context.handoffSpec.signedDate}\n`;
    }
    prompt += "\n";

    // Add vertical context if available
    if (context.handoffSpec?.verticalContext) {
      const vc = context.handoffSpec.verticalContext;
      prompt += `VERTICAL CONTEXT:\n`;
      prompt += `Industry: ${vc.industry}\n`;
      prompt += `Business Size: ${vc.businessSize}\n`;
      prompt += `Primary Tools: ${vc.primaryTools.join(', ')}\n`;
      if (vc.regulatoryContext) {
        prompt += `Regulatory Context: ${vc.regulatoryContext}\n`;
      }
      prompt += `Generate workflow specs using tools and constraints typical for this vertical.\n\n`;
    }
  }

  // Add client tools and access information
  if (context.clientTools) {
    prompt += `CLIENT TOOLS & ACCESS:\n`;
    prompt += `Available Tools: ${context.clientTools.available.join(", ")}\n`;
    if (context.clientTools.restricted.length > 0) {
      prompt += `Restricted: ${context.clientTools.restricted.join(", ")}\n`;
    }
    if (context.clientTools.accessConstraints) {
      prompt += `Constraints: ${context.clientTools.accessConstraints.join("; ")}\n`;
    }
    prompt += "\n";
  }

  // Add business rules
  if (context.businessRules) {
    prompt += `BUSINESS RULES:\n`;
    if (context.businessRules.operatingHours) {
      prompt += `Operating Hours: ${context.businessRules.operatingHours}\n`;
    }
    if (context.businessRules.policies) {
      prompt += `Policies: ${context.businessRules.policies.join("; ")}\n`;
    }
    if (context.businessRules.routingRules) {
      prompt += `Routing Rules: ${context.businessRules.routingRules.join("; ")}\n`;
    }
    if (context.businessRules.teamRoles) {
      prompt += `Team Roles:\n`;
      context.businessRules.teamRoles.forEach((role) => {
        prompt += `  - ${role.role}: ${role.responsibilities.join(", ")}\n`;
      });
    }
    prompt += "\n";
  }

  // Add timeline target
  if (context.targetTimelineDays) {
    prompt += `TARGET TIMELINE: ${context.targetTimelineDays} days for Phase 1\n\n`;
  }

  // Add special notes
  if (context.notes) {
    prompt += `SPECIAL NOTES:\n${context.notes}\n\n`;
  }

  // Add task
  prompt += `TASK:\n${task}\n\n`;

  // Add the bounded output contract; TypeScript interfaces remain canonical.
  prompt += `OUTPUT REQUIREMENTS:\n`;
  prompt += `${AGENT_4_COMPACT_OUTPUT_CONTRACT}\n`;

  return prompt;
}

/**
 * Strips markdown code fences from the response
 */
function stripMarkdownCodeFences(text: string): string {
  // Remove ```json ... ``` or ``` ... ``` blocks
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/g;
  const matches = text.match(codeBlockRegex);

  if (matches && matches.length > 0) {
    // Extract content from first code block
    const content = matches[0].replace(/```(?:json)?\s*/, "").replace(/```$/, "");
    return content.trim();
  }

  return text.trim();
}

/**
 * Validates the delivery package output structure
 */
function validateDeliveryPackage(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required top-level fields
  const requiredFields = [
    "build_plan",
    "data_model",
    "workflow_specs",
    "agent_spec_sheets",
    "qa_plan_and_results",
    "fallback_modes",
    "client_handoff_kit",
    "post_launch_monitoring",
    "audit_trail_spec",
  ];

  for (const field of requiredFields) {
    if (!data[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate build_plan structure
  if (data.build_plan) {
    const buildPlanFields = ["phase_1", "phase_2_optional", "milestones", "dependencies", "change_request_linkage"];
    for (const field of buildPlanFields) {
      if (!data.build_plan[field]) {
        errors.push(`Missing build_plan field: ${field}`);
      }
    }
  }

  // Validate workflow_specs is an array
  if (data.workflow_specs && !Array.isArray(data.workflow_specs)) {
    errors.push("workflow_specs must be an array");
  }

  // Validate agent_spec_sheets is an array with ClientAgentSpec fields
  if (data.agent_spec_sheets && !Array.isArray(data.agent_spec_sheets)) {
    errors.push("agent_spec_sheets must be an array");
  } else if (Array.isArray(data.agent_spec_sheets)) {
    const requiredSpecFields = ["agent_name", "agent_role", "system_prompt", "allowed_actions", "escalation_rules", "pillars_addressed"];
    for (let i = 0; i < data.agent_spec_sheets.length; i++) {
      const spec = data.agent_spec_sheets[i];
      for (const field of requiredSpecFields) {
        if (!spec[field]) {
          errors.push(`agent_spec_sheets[${i}] missing required field: ${field}`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateAgent4FallbackResponse(message: string): {
  valid: boolean;
  details?: string;
} {
  try {
    const data = JSON.parse(stripMarkdownCodeFences(message));
    const validation = validateDeliveryPackage(data);
    return {
      valid: validation.valid,
      details: validation.valid ? undefined : validation.errors.join("; "),
    };
  } catch (error) {
    return {
      valid: false,
      details: error instanceof Error ? error.message : "Invalid JSON",
    };
  }
}

// ========================================
// MAIN AGENT FUNCTION
// ========================================

/**
 * Agent 4: Systems Builder & Delivery Orchestrator
 *
 * Converts signed scopes into working systems with build plans,
 * agent specs, QA plans, and client handoff kits.
 *
 * @param task - The specific delivery task (e.g., "Create delivery package for lead enrichment system")
 * @param context - Optional context including handoff spec, tools, and business rules
 * @param mode - Execution mode (fast/balanced/quality) - affects model selection
 * @returns Promise<Agent4Result> with delivery package or error
 */
export async function runAgent4SystemsDelivery(
  task: string,
  context: Agent4Context = {},
  mode: AgentMode = "balanced"
): Promise<Agent4Result> {
  const startTime = Date.now();

  try {
    logger.info("[Agent-4] Starting Systems Delivery Orchestrator", {}, {
      task: task.substring(0, 100),
      mode,
      hasHandoffSpec: !!context.handoffSpec,
      hasClientTools: !!context.clientTools,
    });

    // Build the prompt
    const prompt = buildPrompt(task, context);

    // Execute with fallback across providers
    // Schema-strict output — prefer Anthropic (most reliable JSON adherence).
    const result = await executeWithFallback(
      prompt,
      mode,
      undefined,
      undefined,
      SCHEMA_STRICT_PROVIDER_ORDER,
      validateAgent4FallbackResponse,
    );

    if (!result.success) {
      return {
        success: false,
        message: "All AI providers failed to generate delivery package",
        error: {
          type: "execution_error",
          details: result.message,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Parse JSON response
    let parsedData: DeliveryPackageOutput;
    try {
      const cleanedResponse = stripMarkdownCodeFences(result.message);
      parsedData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      logger.error("[Agent-4] JSON parsing failed", {}, {
        error: parseError instanceof Error ? parseError.message : String(parseError),
        response: result.message.substring(0, 500),
      });

      return {
        success: false,
        message: "Failed to parse delivery package JSON",
        error: {
          type: "JSON_PARSE_ERROR",
          details: parseError instanceof Error ? parseError.message : "Unknown parse error",
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Validate structure
    const validation = validateDeliveryPackage(parsedData);
    if (!validation.valid) {
      logger.error("[Agent-4] Validation failed", {}, { errors: validation.errors });

      return {
        success: false,
        message: "Delivery package validation failed",
        error: {
          type: "validation_error",
          details: validation.errors.join("; "),
          timestamp: new Date().toISOString(),
        },
      };
    }

    const latencyMs = Date.now() - startTime;

    logger.info("[Agent-4] Successfully generated delivery package", {
      provider: result.metadata?.provider,
    }, {
      latencyMs,
      model: result.metadata?.model,
      workflowCount: parsedData.workflow_specs?.length || 0,
      agentCount: parsedData.agent_spec_sheets?.length || 0,
      milestoneCount: parsedData.build_plan?.milestones?.length || 0,
    });

    return {
      success: true,
      message: "Delivery package generated successfully",
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
    const latencyMs = Date.now() - startTime;

    logger.error("[Agent-4] Unexpected error", {}, {
      error: error instanceof Error ? error.message : String(error),
      latencyMs,
    });

    return {
      success: false,
      message: "Unexpected error in Agent 4",
      error: {
        type: "UNKNOWN_ERROR",
        details: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      },
    };
  }
}
