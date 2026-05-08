// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/providers/fallback', () => ({
  executeWithFallback: vi.fn(),
}));
vi.mock('@/lib/learning/collectors/from-agent3', () => ({
  collectFromAgent3: vi.fn().mockResolvedValue([]),
}));

import { executeWithFallback } from '@/lib/providers/fallback';
import { collectFromAgent3 } from '@/lib/learning/collectors/from-agent3';
import {
  runAgent3SubAgent,
  type DiscoveryConductorInput,
} from '../../app/api/agents/run/uptimize/agent-3-sales-engineer';

const mockedExecute = vi.mocked(executeWithFallback);
const mockedCollect = vi.mocked(collectFromAgent3);

const DISCOVERY = {
  pre_call_brief: {
    lead_id: 'lead-1',
    hypotheses: ['Operations burnout'],
    must_answer_questions: ['How many leads/week?'],
    meeting_goal: 'Confirm pillar 1+5 leak',
  },
  discovery_notes_structured: {
    current_process_map: ['Form → WhatsApp → Spreadsheet → CRM'],
    leaks: [{ leak_name: 'Manual reschedule', where_it_happens: 'WhatsApp', symptoms: 'Lost confirmations', root_cause_guess: 'No system of record' }],
    impact: { time_cost: '14h/wk', revenue_cost: '$2,400/mo', quality_cost: 'Member NPS drop' },
    success_criteria: ['<15min response'],
    constraints: ['Single admin'],
    decision_process: { decision_maker: 'Owner', stakeholders: ['Coach lead'], budget_range_known: true, timeline: 'This quarter', procurement_notes: '' },
  },
  shadow_ops_map: {
    top_invisible_tasks_ranked: [{ task: 'WhatsApp confirmations', estimated_weekly_hours: 8, frequency: 'daily', impact: 'high', why_it_exists: 'No automation' }],
    off_system_channels: ['WhatsApp'],
    context_loss_points: ['Reschedule chain'],
    audit_gaps: ['No log of reschedules'],
  },
  exception_library: {
    top_exceptions_ranked: [{ exception_name: 'Double-booking', frequency: 'weekly', impact: 'high', current_handling: 'Manual call', desired_handling: 'Auto-detect + offer' }],
    exception_metrics_assumptions: ['~3/week'],
    exceptions_to_productize: ['Reschedule flow'],
  },
  vertical: 'fitness',
  pillar_findings: [
    { pillar: 'shadow_ops', estimated_usd: 2400 },
    { pillar: 'audit_trail', estimated_usd: 800 },
  ],
  new_exceptions: [{ type: 'reschedule_chain', severity: 'medium', resolution: 'auto-flow' }],
};

const PROPOSAL = {
  value_calc: {
    dollar_value_summary: '$3,200/month total recovery',
    assumptions: ['8h/wk @ $30/h'],
    time_saved_per_week_hours: 8,
    cost_per_hour_assumption: 30,
    monthly_value_estimate: 3200,
    notes: 'Conservative estimate',
  },
  solution_blueprint: {
    phase_1: { goal: 'Lead intake + audit trail', deliverables: ['Webhook', 'Audit log'], leaks_addressed: ['shadow_ops', 'audit_trail'], time_to_value: '7 days', dependencies: [] },
    phase_2: { goal: 'Auto-rescheduler', deliverables: ['Reschedule flow'], leaks_addressed: ['shadow_ops'], time_to_value: '21 days', dependencies: ['phase_1'] },
    phase_3_optional: { goal: 'Voice agent', deliverables: ['After-hours'], leaks_addressed: [], time_to_value: '60 days', dependencies: ['phase_2'] },
    kpis_to_track: ['Response time', 'Audit completeness'],
  },
  proposal_sow: {
    summary: 'Three-tier proposal',
    deliverables: ['Webhook', 'Audit log', 'Reschedule'],
    timeline: '21 days',
    pricing_options: [
      { option_name: 'Starter', price: '$1,200/mo', what_included: ['Phase 1'], best_for: 'Solo owner' },
      { option_name: 'Growth', price: '$2,400/mo', what_included: ['Phase 1+2'], best_for: 'Active studio' },
      { option_name: 'Full', price: '$4,000/mo', what_included: ['All phases'], best_for: 'Multi-location' },
    ],
    client_responsibilities: ['Provide HubSpot access'],
    assumptions_exclusions: ['No custom mobile app'],
    change_request_process: 'Written approval',
    acceptance_criteria: ['<15min response demonstrated'],
    exception_paths_committed: ['Reschedule flow'],
    audit_trail_commitment: ['7-year retention'],
  },
  close_plan: {
    primary_objections_expected: ['Price', 'Training time'],
    responses: ['Reframe with leak comparison', 'FVi7 protocol'],
    next_steps: ['Sign Growth tier', 'Provide credentials'],
    follow_up_schedule: [{ day_offset: 1, message: 'Recap + SOW' }, { day_offset: 3, message: 'Check-in' }],
  },
  handoff_to_agent4_spec: {
    build_modules: ['Lead intake', 'Audit log', 'Reschedule'],
    integrations: ['HubSpot', 'WhatsApp Business'],
    agent_specs_needed: ['Lead Intake Agent', 'Audit Agent'],
    risks: ['HubSpot API limits'],
    definition_of_done: ['<15min response demonstrated'],
    top_exceptions_to_handle: ['Double-booking', 'Reschedule chain'],
    audit_trail_fields_required: ['actor', 'ts', 'action'],
  },
};

function fakeFallback(content: unknown) {
  return {
    content: JSON.stringify(content),
    model_used: 'gpt-4o',
    provider: 'openai' as const,
    usage: { input_tokens: 1500, output_tokens: 1200, total_tokens: 2700 },
    cost_usd: 0.06,
    latency_ms: 2200,
    fallback_used: false,
    primary_provider: 'openai' as const,
    attempts: 1,
  };
}

const INPUT: DiscoveryConductorInput = {
  qualified_lead_brief: {
    lead_id: 'lead-1',
    problem: 'Lost confirmations + manual reschedules',
    impact: 'Member churn',
    urgency: 'High',
    authority: 'Owner',
    stack: ['HubSpot', 'WhatsApp'],
    timeline: 'This quarter',
  },
  call_context: {
    call_notes: 'Owner described WhatsApp chaos and Q3 expansion plans',
    call_duration_minutes: 45,
  },
  vertical: 'fitness',
  mode: 'discovery_execution',
};

describe('Sprint 12.5 — Agent 3 sub-agent orchestrator', () => {
  beforeEach(() => {
    mockedExecute.mockReset();
    mockedCollect.mockClear();
  });

  it('produces Agent3Output via 3A → 3B', async () => {
    mockedExecute
      .mockResolvedValueOnce(fakeFallback(DISCOVERY))
      .mockResolvedValueOnce(fakeFallback(PROPOSAL));

    const result = await runAgent3SubAgent(INPUT, { pipelineRunId: 'run-1' });

    expect(result.final_output.value_calc.monthly_value_estimate).toBe(3200);
    expect(result.final_output.proposal_sow.pricing_options).toHaveLength(3);
    expect(result.final_output.handoff_to_agent4_spec.agent_specs_needed).toContain('Lead Intake Agent');
  });

  it('fires collectFromAgent3 between 3A and 3B with discovery findings', async () => {
    mockedExecute
      .mockResolvedValueOnce(fakeFallback(DISCOVERY))
      .mockResolvedValueOnce(fakeFallback(PROPOSAL));

    await runAgent3SubAgent(INPUT, { pipelineRunId: 'run-1' });

    expect(mockedCollect).toHaveBeenCalledTimes(1);
    expect(mockedCollect).toHaveBeenCalledWith(
      expect.objectContaining({
        vertical: 'fitness',
        pillar_findings: expect.arrayContaining([expect.objectContaining({ pillar: 'shadow_ops', estimated_usd: 2400 })]),
      }),
      'run-1',
    );
  });

  it('does NOT fire collectFromAgent3 when no pipelineRunId is provided', async () => {
    mockedExecute
      .mockResolvedValueOnce(fakeFallback(DISCOVERY))
      .mockResolvedValueOnce(fakeFallback(PROPOSAL));

    await runAgent3SubAgent(INPUT);

    expect(mockedCollect).not.toHaveBeenCalled();
  });

  it('skips 3B and emits P1 if 3A fails', async () => {
    mockedExecute.mockRejectedValueOnce(new Error('3A LLM down'));

    const result = await runAgent3SubAgent(INPUT, { pipelineRunId: 'run-1' });

    expect(result.requires_human_attention).toBe(true);
    expect(result.sub_agent_results[1].task_completed).toBe(false);
    expect(result.sub_agent_results[1].escalation_severity).toBe('P1');
    expect(mockedCollect).not.toHaveBeenCalled();
  });
});
