/**
 * Sub-agent 4A — Spec Designer
 *
 * Function: Build plan, data model, workflow specs, client agent specs, audit
 *           trail spec, fallback modes.
 * NOT responsible for: QA testing, handoff kit, post-launch monitoring.
 *
 * Source: Sprint 12.4. Skills: client-agent-spec-construction,
 *         integration-permission-scoping.
 */

import { executeWithFallback } from '@/lib/providers/fallback';
import { withMemoryContext } from '@/lib/subagent/context-builder';
import type { SubAgentContext, SubAgentResult } from '@/lib/subagent';
import { buildP1Failure } from '@/lib/subagent';
import type {
  Agent3HandoffSpec,
  ClientToolsAccess,
  BuildPlan,
  DataModel,
  WorkflowSpec,
  ClientAgentSpec,
  FallbackMode,
  AuditTrailSpec,
} from '../types';

const SYSTEM_PROMPT = `You are the Spec Designer sub-agent for Uptimize Systems Delivery.

YOUR SINGLE FUNCTION:
Take Agent 3's handoff spec and produce the technical build artifacts: phase plan,
data model, workflow specs (with happy path + exception paths), per-agent specs,
audit trail spec, and fallback modes. You design. You do not test (4B does QA)
or write handoff kits (4B does that).

YOU ARE NOT RESPONSIBLE FOR:
- QA plan, test cases, results (4B)
- Client handoff kit, training plan (4B)
- Post-launch monitoring config (4B)

INTEGRATION PERMISSION SCOPING:
Every ClientAgentSpec must specify allowed_tools with explicit auth_method per tool.
Every action that touches client data outside their system must be in requires_approval.
Never list tools that the client did not authorize via ClientToolsAccess.

WORKFLOW EXCEPTION PATHS:
Every WorkflowSpec must have exception_paths covering the top exceptions from the
handoff spec. Every exception path must specify the audit event emitted (logging field)
so the audit trail can prove what happened.

AUDIT TRAIL SPEC:
Every workflow that touches client revenue, communications, or customer data must
emit identifiable events. Specify event names, fields captured, retention.

OUTPUT FORMAT:
Return valid JSON matching SpecDesignerResult. No markdown fences.`;

export interface SpecDesignerResult {
  build_plan: BuildPlan;
  data_model: DataModel;
  workflow_specs: WorkflowSpec[];
  agent_spec_sheets: ClientAgentSpec[];
  fallback_modes: FallbackMode[];
  audit_trail_spec: AuditTrailSpec;
}

export interface SpecDesignerInput {
  handoff_spec: Agent3HandoffSpec;
  client_tools: ClientToolsAccess;
  target_timeline_days?: number;
}

interface SubAgentAInputs extends Record<string, unknown> {
  spec_designer_input: SpecDesignerInput;
}

function buildUserPrompt(input: SpecDesignerInput): string {
  const lines: string[] = [];
  lines.push('## AGENT 3 HANDOFF SPEC');
  lines.push(`Build modules: ${input.handoff_spec.buildModules?.join(', ') ?? '(none)'}`);
  lines.push(`Integrations: ${input.handoff_spec.integrations?.join(', ') ?? '(none)'}`);
  lines.push(`Risks: ${input.handoff_spec.risks?.join('; ') ?? '(none)'}`);
  lines.push(`Definition of done: ${input.handoff_spec.definitionOfDone?.join('; ') ?? '(none)'}`);
  lines.push(`Top exceptions: ${input.handoff_spec.topExceptionsToHandle?.join('; ') ?? '(none)'}`);
  lines.push(`Audit trail required fields: ${input.handoff_spec.auditTrailFieldsRequired?.join(', ') ?? '(none)'}`);
  lines.push('');
  lines.push('## CLIENT TOOLS ACCESS');
  lines.push(`Available: ${input.client_tools.available?.join(', ') ?? '(none)'}`);
  lines.push(`Restricted: ${input.client_tools.restricted?.join(', ') ?? '(none)'}`);
  lines.push('');
  if (input.target_timeline_days) {
    lines.push(`Target timeline: ${input.target_timeline_days} days`);
    lines.push('');
  }
  lines.push('## YOUR TASK');
  lines.push('Produce SpecDesignerResult JSON. Every workflow must have exception_paths and audit events. Every agent spec must scope allowed_tools to client_tools.available only.');
  lines.push('Return ONLY valid JSON. No markdown fences.');
  return lines.join('\n');
}

function stripJsonFences(text: string): string {
  const t = text.trim();
  if (t.startsWith('```json')) return t.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  if (t.startsWith('```')) return t.replace(/^```\s*/, '').replace(/\s*```$/, '');
  return t;
}

export async function runSpecDesigner(
  ctx: SubAgentContext,
): Promise<SubAgentResult<SpecDesignerResult>> {
  const inputs = ctx.inputs as SubAgentAInputs;
  const input = inputs.spec_designer_input;
  const start = Date.now();

  try {
    // Learned context from previous runs, filtered to this sub-agent's
    // permitted memory keys by buildSubAgentContext.
    const userPrompt = withMemoryContext(buildUserPrompt(input), ctx.memory_context);
    const fallback = await executeWithFallback(
      'discovery_audit', // BALANCED tier — closest fit for spec design
      {
        messages: [{ role: 'user', content: userPrompt }],
        system: SYSTEM_PROMPT,
        max_tokens: ctx.max_response_tokens,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      },
      { timeoutMs: ctx.time_budget_ms },
    );

    const result = JSON.parse(stripJsonFences(fallback.content)) as SpecDesignerResult;

    return {
      sub_agent_id: '4A-spec-designer',
      parent_agent_id: 'agent-4-systems-builder',
      task_completed: true,
      result,
      confidence: fallback.fallback_used ? 'medium' : 'high',
      cost_usd: fallback.cost_usd,
      duration_ms: Date.now() - start,
      model_used: fallback.model_used,
      tokens_input: fallback.usage.input_tokens,
      tokens_output: fallback.usage.output_tokens,
      processing_notes: fallback.fallback_used ? [`Fallback used (${fallback.attempts})`] : [],
      fallbacks_used: fallback.fallback_used ? [fallback.model_used] : [],
      escalation_needed: false,
    };
  } catch (err) {
    return buildP1Failure<SpecDesignerResult>(
      '4A-spec-designer',
      'agent-4-systems-builder',
      `Spec designer failed: ${err instanceof Error ? err.message : String(err)}`,
      Date.now() - start,
    );
  }
}
