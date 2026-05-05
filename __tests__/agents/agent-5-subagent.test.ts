// @vitest-environment node
/**
 * Sprint 12.2 — Agent 5 sub-agent orchestrator tests
 *
 * Tests the NEW runAgent5SubAgent path. Does NOT replace agent-5.test.ts
 * (which tests the legacy single-call class with live LLM).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/providers/fallback', () => ({
  executeWithFallback: vi.fn(),
}));

import { executeWithFallback } from '@/lib/providers/fallback';
import {
  runAgent5SubAgent,
  type Agent5Input,
  type HealthAnalystResult,
  type WinReporterResult,
} from '../../app/api/agents/run/uptimize/agent-5-client-success';

const mockedExecute = vi.mocked(executeWithFallback);

const MOCK_INPUT: Agent5Input = {
  handoff_kit: {
    project_id: 'proj-1',
    account_id: 'client-1',
    client_name: 'Test Studio',
    quickstart_5min: ['Log in', 'Open dashboard', 'Check alerts'],
    daily_sop: ['Review alerts', 'Triage tickets'],
    weekly_sop: ['Run report', 'Review SLAs'],
    exception_sop: ['Escalate VIP misses'],
    training_plan: ['Day 1: Dashboard', 'Day 3: Exceptions'],
    admin_notes: [],
    baseline_kpis: [
      { kpi_name: 'Lead response', baseline_value: '4h', target_value: '15m', measurement_method: 'CRM' },
    ],
    workflows_delivered: [
      { workflow_id: 'wf1', workflow_name: 'Lead intake', goal: 'Auto-capture', exception_paths_top5: ['VIP missed'], kpis_affected: ['Lead response'] },
    ],
    shadow_ops_baseline: ['Manual routing'],
    exception_library: [],
  },
  current_week_of: '2026-05-04',
};

const MOCK_HEALTH: HealthAnalystResult = {
  adoption_dashboard: {
    kpis: ['Lead response: 4h → 22m'],
    usage_signals: ['12 active users', '147 workflows executed'],
    exception_metrics: { exceptions_count_week: 8, top_exceptions: ['VIP missed'], avg_time_to_resolution: '1.5h' },
    auditability_metrics: { audit_trail_completeness: '94%', missing_log_events: ['Manual reschedules'] },
    trend_notes: 'Steady upward adoption. Audit gap traced to manual reschedules.',
  },
  six_pillar_progress: {
    shadow_ops: {
      hours_saved: { baseline: 0, current: 14, trend: 'up' },
      tasks_automated: { baseline: 0, current: 8, trend: 'up' },
      incidents_detected: 1,
    },
    exceptions: {
      count: { baseline: 22, current: 8, trend: 'down' },
      auto_handle_rate: { baseline: '0%', current: '60%', trend: 'up' },
      avg_resolution_hours: { baseline: 6, current: 1.5, trend: 'down' },
    },
    audit_trail: {
      completeness_pct: { baseline: '40%', current: '94%', trend: 'up' },
      disputes_won: 1,
      compliance_score: { baseline: 'low', current: 'high', trend: 'up' },
    },
    knowledge_decisions: {
      documented_pct: { baseline: '20%', current: '70%', trend: 'up' },
      avg_approval_hours: { baseline: 18, current: 4, trend: 'down' },
      escalations: 0,
    },
    handoffs_slas: {
      sla_hit_rate: { baseline: '60%', current: '92%', trend: 'up' },
      avg_handoff_minutes: { baseline: 45, current: 8, trend: 'down' },
      stuck_cases: { baseline: 5, current: 0, trend: 'down' },
    },
    channels_evidence: {
      capture_rate: { baseline: '50%', current: '95%', trend: 'up' },
      shadow_incidents: 1,
      findability_score: { baseline: 'low', current: 'high', trend: 'up' },
    },
  },
  client_health_score: {
    score_0_100: 84,
    risk_level: 'healthy',
    drivers: ['Strong adoption', 'Audit completeness up'],
    interventions: ['Address manual-reschedule gap'],
    quick_win_this_week: 'Wire reschedule events into the audit log',
    proof_ready: true,
    per_pillar_health: [
      { pillar: 1, name: 'Shadow Ops', score: 88, note: 'Strong reduction' },
      { pillar: 2, name: 'Exceptions', score: 80, note: 'Auto-handle gains' },
      { pillar: 3, name: 'Audit Trail', score: 78, note: 'Reschedule gap remains' },
      { pillar: 4, name: 'Knowledge', score: 82, note: 'SOPs documented' },
      { pillar: 5, name: 'Handoffs', score: 92, note: 'SLAs hit' },
      { pillar: 6, name: 'Channels', score: 90, note: 'Consolidated' },
    ],
  },
  shadow_ops_reduction_report: {
    before_list: ['Manual lead routing', 'WhatsApp coordination'],
    after_list: ['Automated routing', 'CRM channel consolidated'],
    delta_summary: 'Eliminated 14 hrs/week of manual coordination.',
    new_shadow_ops_detected: ['Manual reschedules — bypass automation'],
  },
};

const MOCK_REPORTS: WinReporterResult = {
  onboarding_plan: {
    day_1: ['Walk through dashboard', 'Confirm credentials'],
    day_3: ['Review first alerts', 'Tune routing rules'],
    day_7: ['FVi7: Confirm $X measurable lift in lead response time'],
    training_sessions: [
      { session_name: 'Dashboard fundamentals', duration_minutes: 30, agenda: ['Tour', 'Filters', 'Reports'] },
      { session_name: 'Exception handling', duration_minutes: 45, agenda: ['Triage rules', 'Escalation'] },
    ],
  },
  weekly_win_report: {
    week_of: '2026-05-04',
    wins: ['Lead response 4h → 22m', '14 hrs/week saved on manual ops'],
    metrics_snapshot: ['Audit completeness 40% → 94%', 'SLA hit rate 60% → 92%'],
    what_broke: ['Manual reschedules bypassing the audit log'],
    next_actions: ['Wire reschedule events into the audit log'], // matches 5A's quick_win
  },
  issues_and_tickets: [
    { ticket_id: 'T-001', severity: 'P2', issue: 'Reschedule audit gap', exception_tag: 'audit', status: 'in_progress', owner: 'agent4', next_step: 'Add webhook' },
  ],
  optimization_backlog: [
    { item: 'Add SMS confirmations for VIP leads', impact: 'high', effort: 'medium', priority: 8 },
  ],
  expansion_map: {
    phase_2_recommendations: ['Voice agent for after-hours'],
    phase_3_optional: ['Multi-location rollout'],
    upsell_triggers: ['VIP no-show rate > 5%'],
    expansion_proposal: 'Now that adoption is strong and the studio is a proof case, the after-hours voice agent fits the next quarter.',
  },
  proof_asset_pipeline: {
    testimonial_request_plan: ['Send request after week 8 — proof_ready already true'],
    case_study_draft_outline: ['Background', 'Pain', 'Solution', 'Metrics', 'Testimonial', 'Lessons'],
    roi_snapshot_points: ['$4,800/mo recovered', '14 hrs/week saved'],
    proof_angles_to_market: ['Operations recovery', 'Audit-trail compliance'],
  },
};

function fakeFallback(content: unknown) {
  return {
    content: JSON.stringify(content),
    model_used: 'claude-sonnet-4-20250514',
    provider: 'anthropic' as const,
    usage: { input_tokens: 800, output_tokens: 600, total_tokens: 1400 },
    cost_usd: 0.04,
    latency_ms: 1500,
    fallback_used: false,
    primary_provider: 'anthropic' as const,
    attempts: 1,
  };
}

describe('Sprint 12.2 — Agent 5 sub-agent orchestrator', () => {
  beforeEach(() => mockedExecute.mockReset());

  it('produces a complete Agent5ClientSuccessPackage from 5A + 5B', async () => {
    mockedExecute
      .mockResolvedValueOnce(fakeFallback(MOCK_HEALTH))
      .mockResolvedValueOnce(fakeFallback(MOCK_REPORTS));

    const result = await runAgent5SubAgent(MOCK_INPUT);

    expect(result.agent_id).toBe('agent-5-client-success');
    expect(result.final_output.client_health_score.score_0_100).toBe(84);
    expect(result.final_output.client_health_score.risk_level).toBe('healthy');
    expect(result.final_output.weekly_win_report.next_actions[0]).toContain('reschedule');
    expect(result.final_output.expansion_map.expansion_proposal).toBeTruthy();
    expect(result.final_output.shadow_ops_reduction_report.delta_summary).toContain('14');
    expect(result.sub_agent_results).toHaveLength(2);
    expect(result.sub_agent_results[0].sub_agent_id).toBe('5A-health-analyst');
    expect(result.sub_agent_results[1].sub_agent_id).toBe('5B-win-reporter');
  });

  it('rolls up cost from both sub-agents', async () => {
    mockedExecute
      .mockResolvedValueOnce(fakeFallback(MOCK_HEALTH))
      .mockResolvedValueOnce(fakeFallback(MOCK_REPORTS));

    const result = await runAgent5SubAgent(MOCK_INPUT);
    expect(result.total_cost_usd).toBeCloseTo(0.08, 5);
  });

  it('returns a degraded but valid package if 5A fails', async () => {
    mockedExecute.mockRejectedValueOnce(new Error('5A LLM down'));

    const result = await runAgent5SubAgent(MOCK_INPUT);
    expect(result.requires_human_attention).toBe(true);
    expect(result.sub_agent_results[0].task_completed).toBe(false);
    // Output structure remains valid (not undefined fields)
    expect(result.final_output.client_health_score).toBeDefined();
    expect(result.final_output.weekly_win_report).toBeDefined();
  });

  it('legacy runAgent5 is still exported (backward compat)', async () => {
    // Import the legacy export and assert its presence.
    const mod = await import('../../app/api/agents/run/uptimize/agent-5-client-success');
    expect(typeof mod.runAgent5).toBe('function');
    expect(typeof mod.runAgent5Orchestrated).toBe('function');
    expect(typeof mod.runAgent5SubAgent).toBe('function');
    expect(typeof mod.Agent5ClientSuccess).toBe('function');
  });
});
