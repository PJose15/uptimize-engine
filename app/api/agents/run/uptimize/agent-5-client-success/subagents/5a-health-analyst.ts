/**
 * Sub-agent 5A — Health Analyst
 *
 * Function: Analyze adoption + six-pillar progress + client health score.
 * NOT responsible for: weekly reports, onboarding plans, expansion narrative.
 *
 * Source: derived from monolithic Agent 5 prompt (UPTIMIZE_AGENT_PROMPTS.md)
 *         per Sprint 12.2 split: health-focused vs reporting-focused
 */

import { executeWithFallback } from '@/lib/providers/fallback';
import type { SubAgentContext, SubAgentResult } from '@/lib/subagent';
import { buildP1Failure } from '@/lib/subagent';
import type {
  Agent5Input,
  AdoptionDashboard,
  SixPillarProgress,
  ClientHealthScore,
  ShadowOpsReductionReport,
} from '../types';

const SYSTEM_PROMPT = `You are the Health Analyst sub-agent for the Uptimize Client Success system.

YOUR SINGLE FUNCTION:
Produce a quantitative health analysis of the client across the six pillars.
You measure. You score. You identify drivers and interventions. You do not write
narrative reports — that is Sub-agent 5B's function.

YOU ARE NOT RESPONSIBLE FOR:
- Onboarding plans (5B)
- Weekly win reports (5B)
- Tickets, optimization backlog, expansion map, proof assets (5B)

YOUR OUTPUTS — REQUIRED FIELDS:
adoption_dashboard:
  kpis (general)
  usage_signals (active users, workflows executed, logins)
  exception_metrics (count, top exceptions, avg resolution time)
  auditability_metrics (audit trail completeness %, missing logs)
  trend_notes (one paragraph)

six_pillar_progress: For ALL six pillars (shadow_ops, exceptions, audit_trail,
  knowledge_decisions, handoffs_slas, channels_evidence) report baseline → current
  → trend for the metrics specified in the SixPillarProgress type. Each pillar has
  its own metric set — populate every required field.

client_health_score:
  score_0_100 (composite of adoption_score 0-30 + kpi_trend_score 0-25 +
    responsiveness_score 0-20 + friction_score 0-15 + expansion_readiness_score 0-10)
  risk_level ('healthy' if 80+, 'watch' if 60-79, 'at_risk' if <60)
  drivers (top 3-5 reasons the score is what it is)
  interventions (concrete actions to raise the score next week)
  quick_win_this_week (single specific intervention with measurable target)
  proof_ready (boolean — is this client ready to be a proof case?)
  per_pillar_health (array of 6, one per pillar with score 0-100 and 1-line note)

shadow_ops_reduction_report:
  before_list (manual processes baseline)
  after_list (what got automated)
  delta_summary (one sentence on the change)
  new_shadow_ops_detected (any new shadow ops detected this week)

OUTPUT FORMAT:
Return valid JSON matching the HealthAnalystResult type. No markdown fences.`;

export interface HealthAnalystResult {
  adoption_dashboard: AdoptionDashboard;
  six_pillar_progress: SixPillarProgress;
  client_health_score: ClientHealthScore;
  shadow_ops_reduction_report: ShadowOpsReductionReport;
}

interface SubAgentAInputs extends Record<string, unknown> {
  agent5_input: Agent5Input;
}

function buildUserPrompt(input: Agent5Input): string {
  const lines: string[] = [];
  lines.push('## CLIENT HANDOFF KIT (from Agent 4)');
  lines.push(`Client: ${input.handoff_kit.client_name} (project ${input.handoff_kit.project_id})`);
  lines.push(`Workflows delivered: ${input.handoff_kit.workflows_delivered.length}`);
  lines.push('');
  lines.push('Baseline KPIs:');
  for (const k of input.handoff_kit.baseline_kpis) {
    lines.push(`  - ${k.kpi_name}: ${k.baseline_value} → target ${k.target_value} (${k.measurement_method})`);
  }
  lines.push('');
  lines.push('Shadow ops baseline:');
  for (const s of input.handoff_kit.shadow_ops_baseline) lines.push(`  - ${s}`);
  lines.push('');
  lines.push('Exception library:');
  for (const e of input.handoff_kit.exception_library) {
    lines.push(`  - ${e.exception_name} (${e.frequency}, ${e.impact}): ${e.current_handling}`);
  }
  lines.push('');
  lines.push(`Week of: ${input.current_week_of}`);
  lines.push('');

  if (input.usage_data) {
    lines.push('## USAGE DATA THIS WEEK');
    lines.push(`Workflows executed: ${input.usage_data.workflows_executed_this_week}`);
    lines.push(`Active users: ${input.usage_data.active_users_this_week}`);
    lines.push(`Exceptions triggered: ${input.usage_data.exceptions_triggered_this_week}`);
    lines.push(`Avg exception resolution: ${input.usage_data.avg_exception_resolution_hours}h`);
    lines.push('');
  }

  if (input.client_feedback) {
    lines.push(`## CLIENT FEEDBACK\n${input.client_feedback}\n`);
  }

  if (input.open_tickets && input.open_tickets.length > 0) {
    lines.push('## OPEN TICKETS');
    for (const t of input.open_tickets) {
      lines.push(`- [${t.severity}] ${t.ticket_id}: ${t.issue} (created ${t.created_at})`);
    }
    lines.push('');
  }

  lines.push('## YOUR TASK');
  lines.push('Produce a HealthAnalystResult JSON object. Score across all six pillars. Quantify the health score 0-100 with explicit drivers. Identify the single quick win for this week.');

  return lines.join('\n');
}

function stripJsonFences(text: string): string {
  const t = text.trim();
  if (t.startsWith('```json')) return t.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  if (t.startsWith('```')) return t.replace(/^```\s*/, '').replace(/\s*```$/, '');
  return t;
}

function parseResult(text: string): HealthAnalystResult {
  const cleaned = stripJsonFences(text);
  return JSON.parse(cleaned) as HealthAnalystResult;
}

export async function runHealthAnalyst(
  ctx: SubAgentContext,
): Promise<SubAgentResult<HealthAnalystResult>> {
  const inputs = ctx.inputs as SubAgentAInputs;
  const agent5Input = inputs.agent5_input;
  const start = Date.now();

  try {
    const userPrompt = buildUserPrompt(agent5Input);
    const fallback = await executeWithFallback(
      'health_analysis',
      {
        messages: [{ role: 'user', content: userPrompt }],
        system: SYSTEM_PROMPT,
        max_tokens: ctx.max_response_tokens,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      },
      { timeoutMs: ctx.time_budget_ms },
    );

    const result = parseResult(fallback.content);

    return {
      sub_agent_id: '5A-health-analyst',
      parent_agent_id: 'agent-5-client-success',
      task_completed: true,
      result,
      confidence: fallback.fallback_used ? 'medium' : 'high',
      cost_usd: fallback.cost_usd,
      duration_ms: Date.now() - start,
      model_used: fallback.model_used,
      tokens_input: fallback.usage.input_tokens,
      tokens_output: fallback.usage.output_tokens,
      processing_notes: fallback.fallback_used
        ? [`Fallback chain used (${fallback.attempts} attempts)`]
        : [],
      fallbacks_used: fallback.fallback_used ? [fallback.model_used] : [],
      escalation_needed: false,
    };
  } catch (err) {
    return buildP1Failure<HealthAnalystResult>(
      '5A-health-analyst',
      'agent-5-client-success',
      `Health analyst failed: ${err instanceof Error ? err.message : String(err)}`,
      Date.now() - start,
    );
  }
}
