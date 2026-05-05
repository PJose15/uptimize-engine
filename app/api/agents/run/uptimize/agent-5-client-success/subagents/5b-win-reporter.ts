/**
 * Sub-agent 5B — Win Reporter
 *
 * Function: Onboarding plan, weekly win narrative, tickets, optimization,
 *           expansion map, and proof asset pipeline.
 * NOT responsible for: scoring health, six-pillar metrics (5A's domain).
 *
 * Source: derived from monolithic Agent 5 prompt per Sprint 12.2 split.
 */

import { executeWithFallback } from '@/lib/providers/fallback';
import type { SubAgentContext, SubAgentResult } from '@/lib/subagent';
import { buildP1Failure } from '@/lib/subagent';
import type {
  Agent5Input,
  OnboardingPlan,
  WeeklyWinReport,
  Ticket,
  OptimizationItem,
  ExpansionMap,
  ProofAssetPipeline,
} from '../types';
import type { HealthAnalystResult } from './5a-health-analyst';

const SYSTEM_PROMPT = `You are the Win Reporter sub-agent for the Uptimize Client Success system.

YOUR SINGLE FUNCTION:
Produce the client-facing narrative components: onboarding plan (FVi7), weekly
win report, ticket triage, optimization backlog, expansion map, and proof asset
pipeline. You communicate. You do not score health metrics — Sub-agent 5A
already produced that analysis.

YOU ARE NOT RESPONSIBLE FOR:
- Health scoring (5A)
- Six-pillar progress metrics (5A)
- Adoption dashboard (5A)
- Shadow ops reduction report (5A)

YOUR OUTPUTS — REQUIRED FIELDS:

onboarding_plan (FVi7 — First Value in 7 Days protocol):
  day_1: list of activities for day 1
  day_3: list for day 3
  day_7: list for day 7 (must include the FVi7 measurable win)
  training_sessions: 2-4 sessions with name, duration_minutes, agenda

weekly_win_report:
  week_of (ISO date)
  wins (3-5 specific wins from the week)
  metrics_snapshot (3-5 metric snapshots, e.g. "Lead response: 4h → 22m")
  what_broke (honest list — exceptions, missed SLAs, friction)
  next_actions (3-5 specific actions for next week)

issues_and_tickets: Each ticket has:
  ticket_id, severity (P1/P2/P3), issue, exception_tag, status (open/in_progress/blocked/resolved),
  owner (agent4/agent5/client/you), next_step

optimization_backlog: Prioritized items with:
  item, impact (high/medium/low), effort (high/medium/low), priority (1-10)

expansion_map:
  phase_2_recommendations (next-tier ops)
  phase_3_optional (nice-to-have)
  upsell_triggers (signals that would move to expansion conversation)
  expansion_proposal? (one-paragraph soft pitch — only if proof_ready)

proof_asset_pipeline:
  testimonial_request_plan (when + how)
  case_study_draft_outline (5-7 bullet outline)
  roi_snapshot_points (3-5 quantified before/after points)
  proof_angles_to_market (3-5 hooks for marketing)

USE 5A's output as fact: when 5A says quick_win_this_week is X, weekly_win_report.next_actions
should reference X. When 5A's proof_ready is true, generate expansion_proposal.

OUTPUT FORMAT:
Return valid JSON matching the WinReporterResult type. No markdown fences.`;

export interface WinReporterResult {
  onboarding_plan: OnboardingPlan;
  weekly_win_report: WeeklyWinReport;
  issues_and_tickets: Ticket[];
  optimization_backlog: OptimizationItem[];
  expansion_map: ExpansionMap;
  proof_asset_pipeline: ProofAssetPipeline;
}

interface SubAgentBInputs extends Record<string, unknown> {
  agent5_input: Agent5Input;
  sub_agent_a_result?: HealthAnalystResult;
}

function buildUserPrompt(input: Agent5Input, healthResult: HealthAnalystResult | undefined): string {
  const lines: string[] = [];
  lines.push('## CLIENT HANDOFF KIT (from Agent 4)');
  lines.push(`Client: ${input.handoff_kit.client_name}`);
  lines.push(`Quickstart 5min: ${input.handoff_kit.quickstart_5min.join('; ')}`);
  lines.push(`Daily SOP: ${input.handoff_kit.daily_sop.join('; ')}`);
  lines.push(`Weekly SOP: ${input.handoff_kit.weekly_sop.join('; ')}`);
  lines.push(`Exception SOP: ${input.handoff_kit.exception_sop.join('; ')}`);
  lines.push(`Training plan baseline: ${input.handoff_kit.training_plan.join('; ')}`);
  lines.push('');
  lines.push('Workflows delivered:');
  for (const w of input.handoff_kit.workflows_delivered) {
    lines.push(`  - ${w.workflow_name}: ${w.goal}`);
    lines.push(`    KPIs: ${w.kpis_affected.join(', ')}`);
    lines.push(`    Top exceptions: ${w.exception_paths_top5.join(', ')}`);
  }
  lines.push('');
  lines.push(`Week of: ${input.current_week_of}`);
  lines.push('');

  if (input.client_feedback) {
    lines.push(`## CLIENT FEEDBACK\n${input.client_feedback}\n`);
  }

  if (input.open_tickets && input.open_tickets.length > 0) {
    lines.push('## OPEN TICKETS (existing)');
    for (const t of input.open_tickets) {
      lines.push(`- [${t.severity}] ${t.ticket_id}: ${t.issue} (created ${t.created_at})`);
    }
    lines.push('');
  }

  if (healthResult) {
    lines.push('## SUB-AGENT 5A HEALTH ANALYSIS (use as fact)');
    lines.push(`Score: ${healthResult.client_health_score.score_0_100}/100 — risk: ${healthResult.client_health_score.risk_level}`);
    lines.push(`Drivers: ${healthResult.client_health_score.drivers.join('; ')}`);
    lines.push(`Quick win this week (per 5A): ${healthResult.client_health_score.quick_win_this_week}`);
    lines.push(`Proof ready: ${healthResult.client_health_score.proof_ready}`);
    lines.push(`Shadow ops before: ${healthResult.shadow_ops_reduction_report.before_list.join('; ')}`);
    lines.push(`Shadow ops after:  ${healthResult.shadow_ops_reduction_report.after_list.join('; ')}`);
    lines.push(`Shadow ops delta: ${healthResult.shadow_ops_reduction_report.delta_summary}`);
    lines.push('');
  }

  lines.push('## YOUR TASK');
  lines.push('Produce a WinReporterResult JSON. The weekly_win_report.next_actions MUST include 5A\'s quick_win_this_week. Generate expansion_proposal only if 5A.proof_ready is true.');

  return lines.join('\n');
}

function stripJsonFences(text: string): string {
  const t = text.trim();
  if (t.startsWith('```json')) return t.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  if (t.startsWith('```')) return t.replace(/^```\s*/, '').replace(/\s*```$/, '');
  return t;
}

function parseResult(text: string): WinReporterResult {
  const cleaned = stripJsonFences(text);
  return JSON.parse(cleaned) as WinReporterResult;
}

export async function runWinReporter(
  ctx: SubAgentContext,
  healthResult: HealthAnalystResult,
): Promise<SubAgentResult<WinReporterResult>> {
  const inputs = ctx.inputs as SubAgentBInputs;
  const agent5Input = inputs.agent5_input;
  const start = Date.now();

  try {
    const userPrompt = buildUserPrompt(agent5Input, healthResult);
    const fallback = await executeWithFallback(
      'win_report',
      {
        messages: [{ role: 'user', content: userPrompt }],
        system: SYSTEM_PROMPT,
        max_tokens: ctx.max_response_tokens,
        temperature: 0.4,
        response_format: { type: 'json_object' },
      },
      { timeoutMs: ctx.time_budget_ms },
    );

    const result = parseResult(fallback.content);

    return {
      sub_agent_id: '5B-win-reporter',
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
        ? [`Fallback used (${fallback.attempts} attempts)`]
        : [],
      fallbacks_used: fallback.fallback_used ? [fallback.model_used] : [],
      escalation_needed: false,
    };
  } catch (err) {
    return buildP1Failure<WinReporterResult>(
      '5B-win-reporter',
      'agent-5-client-success',
      `Win reporter failed: ${err instanceof Error ? err.message : String(err)}`,
      Date.now() - start,
    );
  }
}
