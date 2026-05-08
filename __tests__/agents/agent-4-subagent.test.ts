// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/providers/fallback', () => ({
  executeWithFallback: vi.fn(),
}));

import { executeWithFallback } from '@/lib/providers/fallback';
import { runAgent4SubAgent, type SpecDesignerInput } from '../../app/api/agents/run/uptimize/agent-4-systems-delivery';

const mockedExecute = vi.mocked(executeWithFallback);

const SPEC = {
  build_plan: {
    phase_1: { goal: 'Lead intake automation', deliverables: ['Webhook capture'], time_to_value: '7 days', dependencies: [] },
    phase_2_optional: { goal: 'Voice agent', deliverables: ['After-hours coverage'], time_to_value: '30 days', dependencies: [] },
    milestones: [{ milestone_name: 'M1', deliverables: ['Capture'], eta_days: 7, acceptance_criteria: ['<15min response'] }],
    dependencies: [],
    change_request_linkage: 'process-doc#cr',
  },
  data_model: { entities: ['Lead'], fields: ['source'], logging_fields: ['captured_at'], pipeline_stages: ['captured', 'qualified'], exception_tags: ['DUPLICATE'] },
  workflow_specs: [
    {
      workflow_name: 'Lead Intake',
      goal: 'Capture leads',
      inputs: ['form'],
      outputs: ['CRM record'],
      tools: ['HubSpot'],
      happy_path_steps: ['Receive', 'Validate', 'Store'],
      exception_paths: [{ exception_name: 'Duplicate', trigger: 'email exists', behavior: 'Merge', escalation: 'none', logging: 'duplicate_merged' }],
      audit_events_emitted: ['lead_captured', 'duplicate_merged'],
      kpis_affected: ['Lead response'],
    },
  ],
  agent_spec_sheets: [
    {
      agent_name: 'Lead Intake Agent',
      agent_role: 'Capture',
      agent_persona: 'Efficient',
      system_prompt: '...',
      context_documents: [],
      memory_config: { short_term: 'session', long_term: 'CRM', shared: 'none' },
      allowed_tools: ['HubSpot'],
      tool_configs: { HubSpot: { auth_method: 'oauth' } },
      allowed_actions: ['create_contact'],
      requires_approval: ['mass_email'],
      never_do: ['delete_records'],
      data_sources: [{ name: 'CRM', type: 'API', access_method: 'OAuth', fields_used: ['email', 'name'] }],
      output_destinations: ['CRM'],
      escalation_rules: [{ trigger: 'duplicate', action: 'merge', notify: 'ops' }],
      fallback_behaviors: [{ condition: 'API down', behavior: 'queue' }],
      success_metrics: [{ metric_name: 'response_time', target: '<15min', measurement_method: 'CRM ts' }],
      alert_conditions: [{ condition: 'queue > 10', severity: 'warn', action: 'notify' }],
      pillars_addressed: ['1', '5'],
      money_leaks_resolved: ['booking_chaos'],
    },
  ],
  fallback_modes: [{ workflow_name: 'Lead Intake', failure_mode: 'API outage', fallback_behavior: 'queue', human_action_required: 'monitor', logging: 'fallback_active' }],
  audit_trail_spec: { audit_fields: ['actor', 'ts', 'action'], audit_event_types: ['lead_captured'], retention_policy: '7 years', where_logs_live: 'PostgreSQL' },
};

const QA = {
  qa_plan_and_results: {
    qa_checklist: ['All 6 test types per workflow'],
    test_cases: [
      { test_name: 'Happy intake', type: 'happy_path', steps: ['Submit'], expected_result: 'Stored', status: 'pass' },
      { test_name: 'Missing email', type: 'missing_input', steps: ['Submit no email'], expected_result: 'Reject', status: 'pass' },
      { test_name: 'API down', type: 'tool_failure', steps: ['Disable HubSpot'], expected_result: 'Queue', status: 'pass' },
      { test_name: 'Mass delete', type: 'safety', steps: ['Try delete-all'], expected_result: 'Refuse', status: 'pass' },
    ],
    results_summary: 'All happy/safety pass. 1 minor edge case open.',
    open_issues: ['Edge: special characters in name'],
  },
  client_handoff_kit: {
    quickstart_5min: ['Log in', 'Open CRM', 'Check queue'],
    daily_sop: ['Review captures', 'Triage exceptions'],
    weekly_sop: ['KPI review'],
    exception_sop: ['Duplicate merge protocol'],
    training_plan: ['Day 1: Dashboard tour'],
    admin_notes: ['HubSpot API limit 100/min'],
  },
  post_launch_monitoring: {
    kpis: ['Lead response time', 'Capture rate'],
    alerts: ['Queue > 50'],
    support_process: ['Ticket → Agent 5 → Agent 4'],
    weekly_review_format: ['Metrics', 'Exceptions', 'Optimizations'],
  },
  go_no_go: 'GO',
  blockers: [],
};

const QA_NO_GO = { ...QA, go_no_go: 'NO_GO', blockers: ['Missing safety test for mass-delete'] };

function fakeFallback(content: unknown) {
  return {
    content: JSON.stringify(content),
    model_used: 'claude-sonnet-4-20250514',
    provider: 'anthropic' as const,
    usage: { input_tokens: 1200, output_tokens: 800, total_tokens: 2000 },
    cost_usd: 0.05,
    latency_ms: 1800,
    fallback_used: false,
    primary_provider: 'anthropic' as const,
    attempts: 1,
  };
}

const INPUT: SpecDesignerInput = {
  handoff_spec: {
    buildModules: ['Lead Intake'],
    integrations: ['HubSpot'],
    risks: ['API rate limits'],
    definitionOfDone: ['<15min response time'],
    topExceptionsToHandle: ['Duplicate'],
    auditTrailFieldsRequired: ['actor', 'ts', 'action'],
  },
  client_tools: { available: ['HubSpot', 'Slack'], restricted: ['Salesforce'] },
  target_timeline_days: 14,
};

describe('Sprint 12.4 — Agent 4 sub-agent orchestrator', () => {
  beforeEach(() => mockedExecute.mockReset());

  it('produces DeliveryPackageOutput on GO decision', async () => {
    mockedExecute
      .mockResolvedValueOnce(fakeFallback(SPEC))
      .mockResolvedValueOnce(fakeFallback(QA));

    const result = await runAgent4SubAgent(INPUT);

    expect(result.final_output.workflow_specs).toHaveLength(1);
    expect(result.final_output.qa_plan_and_results.test_cases).toHaveLength(4);
    expect(result.final_output.client_handoff_kit.daily_sop).toContain('Review captures');
    expect(result.requires_human_attention).toBe(false);
  });

  it('escalates P2 when QA returns NO_GO', async () => {
    mockedExecute
      .mockResolvedValueOnce(fakeFallback(SPEC))
      .mockResolvedValueOnce(fakeFallback(QA_NO_GO));

    const result = await runAgent4SubAgent(INPUT);

    expect(result.requires_human_attention).toBe(true);
    expect(result.sub_agent_results[1].escalation_severity).toBe('P2');
    expect(result.human_attention_reason).toContain('Missing safety test');
  });
});
