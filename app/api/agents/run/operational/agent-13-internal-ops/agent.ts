/**
 * Agent 13 — Internal Operations & Scheduling (Parallel: 13A ∥ 13B)
 *
 * Runs daily at 6:30 AM PR time + on-demand. Pedro's morning briefing.
 *
 * Source: UPTIMIZE_OPERATIONAL_AGENTS_COMPLETE.md (Agent 13)
 */

import { runParallel, buildSubAgentContext } from '@/lib/subagent';
import { loadAgentMemory, commitAgentMemory } from '@/lib/learning/memory';
import type { AgentSynthesisResult, SubAgentResult } from '@/lib/subagent';
import { runCalendarIntelligence } from './subagents/13a-calendar-intelligence';
import { runDeliverableTracker } from './subagents/13b-deliverable-tracker';
import type {
  Agent13Input,
  InternalOpsOutput,
  CalendarIntelligenceResult,
  DeliverableTrackerResult,
  DailyBriefSection,
  CommitmentView,
} from './types';

export const AGENT_13_SYSTEM_PROMPT = `You are the Internal Operations & Scheduling Agent for Uptimize AI.

YOUR MISSION:
Produce Pedro's daily briefing at 6:30 AM PR time. Track every commitment.
Surface what needs attention today, this week, this month — in priority order.

DAILY BRIEFING STRUCTURE (5-minute read):
1. TODAY'S PRIORITY (one item)
2. TODAY'S CALLS (with prep brief for each)
3. OPEN COMMITMENTS (due today + overdue, max 5)
4. QUICK ALERTS (revenue / compliance / BD / content)
5. THIS WEEK (30-second view)

WHAT YOU NEVER DO:
- Never schedule a client call without a prep brief.
- Never let "I'll get back to you" go untracked.
- Never present > 5 P1/P2 commitments without flagging overload.
- Never bury the most urgent item.`;

const TOTAL_TIMEOUT_MS = 60_000;
const TIME_SHARED_BUDGET = 0.85;

export interface Agent13Config {
  mode?: 'fast' | 'balanced' | 'quality';
  pipelineRunId?: string;
}

export async function runAgent13InternalOperations(
  input: Agent13Input,
  config: Agent13Config = {},
): Promise<AgentSynthesisResult<InternalOpsOutput>> {
  const mode = config.mode ?? 'balanced';

  // Learnings distributed to this agent, delivered into sub-agent memory.
  const memory = await loadAgentMemory('agent-13-internal-ops');

  const baseCtx = buildSubAgentContext({
    parentAgentId: 'agent-13-internal-ops',
    subAgentId: '13A-calendar-intelligence',
    clientId: 'system',
    pipelineRunId: config.pipelineRunId,
    task: 'Produce daily briefing — calendar prep + commitment triage',
    taskProfile: 'calendar_intelligence',
    mode,
    timeBudgetMs: TOTAL_TIMEOUT_MS,
    inputs: { agent13_input: input },
    memoryEntries: memory.entries,
    maxResponseTokens: 5000,
    confidenceRequired: 'high',
  });

  const { output, resultA, resultB } = await runParallel<
    CalendarIntelligenceResult,
    DeliverableTrackerResult,
    InternalOpsOutput
  >(baseCtx, {
    pattern: 'parallel',
    totalTimeoutMs: TOTAL_TIMEOUT_MS,
    timeSharedBudget: TIME_SHARED_BUDGET,
    runA: (ctx) => runCalendarIntelligence({ ...ctx, sub_agent_id: '13A-calendar-intelligence', task_profile: 'calendar_intelligence' }),
    runB: (ctx) => runDeliverableTracker({ ...ctx, sub_agent_id: '13B-deliverable-tracker', task_profile: 'commitment_capture' }),
    synthesize: (a, b) => synthesize(input, a, b),
  });

  const subAgentResults: SubAgentResult<unknown>[] = [resultA, resultB];

  // A failed run leaves its notices pending rather than burning them.
  if (subAgentResults.some(r => r.task_completed)) {
    await commitAgentMemory(memory, { clientId: 'system', agentId: 'agent-13-internal-ops' });
  }
  const totalCost = subAgentResults.reduce((s, r) => s + r.cost_usd, 0);
  const totalDuration = Math.max(...subAgentResults.map(r => r.duration_ms));
  const requiresHumanAttention = subAgentResults.some(r => r.escalation_needed);

  return {
    agent_id: 'agent-13-internal-ops',
    final_output: output,
    sub_agent_results: subAgentResults,
    total_cost_usd: totalCost,
    total_duration_ms: totalDuration,
    synthesis_notes: [
      `Calls today: ${output.calendar.calendar_summary.calls_today_count}`,
      `Open commitments: ${output.deliverables.open_commitments.length}`,
      output.daily_brief.is_overloaded ? 'OVERLOADED — triage required' : 'Manageable load',
    ],
    overall_confidence: subAgentResults.some(r => r.confidence === 'low')
      ? 'low' : subAgentResults.some(r => r.confidence === 'medium') ? 'medium' : 'high',
    requires_human_attention: requiresHumanAttention,
    human_attention_reason: requiresHumanAttention
      ? subAgentResults.filter(r => r.escalation_needed).map(r => r.escalation_reason).filter(Boolean).join('; ') || undefined
      : undefined,
  };
}

function synthesize(
  input: Agent13Input,
  a: SubAgentResult<CalendarIntelligenceResult>,
  b: SubAgentResult<DeliverableTrackerResult>,
): InternalOpsOutput {
  const calendar = a.result ?? {
    client_call_prep_briefs: [], bd_call_prep_briefs: [],
    calendar_summary: { calls_today_count: 0, calls_today_names: [], calls_this_week_count: 0, prep_briefs_ready: 0, prep_briefs_missing: [] },
  };
  const deliverables = b.result ?? {
    open_commitments: [], due_today: [], overdue: [], this_week: [],
    daily_focus_list: [],
    overload_triage: { is_overloaded: false, overdue_or_today_count: 0, must_happen_today: [], can_be_deferred: [] },
  };

  const todays_priority = pickTodaysPriority(calendar, deliverables);

  // Top 5 commitments due today/overdue, with recommended_action
  const dueOrOverdueIds = new Set([...deliverables.due_today, ...deliverables.overdue]);
  const topCommitments = deliverables.open_commitments
    .filter(c => dueOrOverdueIds.has(c.id))
    .slice(0, 5)
    .map(c => ({ ...c, recommended_action: c.recommended_action }));

  const dailyBrief: DailyBriefSection = {
    todays_priority,
    todays_calls: calendar.client_call_prep_briefs,
    todays_bd_calls: calendar.bd_call_prep_briefs,
    open_commitments_summary: topCommitments,
    quick_alerts: {
      revenue: input.external_alerts.revenue?.notes ?? [],
      compliance: input.external_alerts.compliance?.notes ?? [],
      bd: input.external_alerts.bd?.notes ?? [],
      content: input.external_alerts.content
        ? [`${input.external_alerts.content.pending_approval} content items pending approval`]
        : [],
    },
    this_week_view: buildWeekView(calendar, deliverables),
    is_overloaded: deliverables.overload_triage.is_overloaded,
    overload_triage_recommendation: deliverables.overload_triage.is_overloaded
      ? `Triage: focus on ${deliverables.overload_triage.must_happen_today.length} items. Defer ${deliverables.overload_triage.can_be_deferred.length} with communication.`
      : undefined,
  };

  return {
    date: input.date,
    daily_brief: dailyBrief,
    calendar,
    deliverables,
    generated_at: new Date().toISOString(),
  };
}

function pickTodaysPriority(
  calendar: CalendarIntelligenceResult,
  deliverables: DeliverableTrackerResult,
): string {
  // Priority order: overdue → due today → most important call → "Plan the week"
  if (deliverables.overdue.length > 0) {
    const first = deliverables.open_commitments.find(c => deliverables.overdue.includes(c.id));
    if (first) return `Resolve overdue: ${first.description} (committed to ${first.committed_to})`;
  }
  if (deliverables.daily_focus_list.length > 0) {
    return deliverables.daily_focus_list[0].action;
  }
  if (calendar.client_call_prep_briefs.length > 0) {
    const c = calendar.client_call_prep_briefs[0];
    return `Lead today's call with ${c.client_name}: ${c.three_key_talking_points[0] ?? 'check health score'}`;
  }
  return 'Plan the week — no urgent items today';
}

function buildWeekView(
  calendar: CalendarIntelligenceResult,
  deliverables: DeliverableTrackerResult,
): string[] {
  const view: string[] = [];
  if (calendar.calendar_summary.calls_this_week_count > 0) {
    view.push(`${calendar.calendar_summary.calls_this_week_count} calls scheduled this week`);
  }
  if (deliverables.this_week.length > 0) {
    view.push(`${deliverables.this_week.length} commitments due this week`);
  }
  return view;
}
