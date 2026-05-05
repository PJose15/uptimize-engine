// @vitest-environment node
/**
 * Agent 6: Closer & Onboarding Coordinator Tests
 *
 * Structural tests with mocked LLM provider — verifies orchestration,
 * synthesis, and ready_for_build enforcement without burning real API cost.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the fallback executor BEFORE importing the agent.
vi.mock('@/lib/providers/fallback', () => ({
  executeWithFallback: vi.fn(),
}));

import { executeWithFallback } from '@/lib/providers/fallback';
import { runAgent6Closer } from '../../app/api/agents/run/uptimize/agent-6-closer';
import type {
  Agent6Input,
  PresentationCoachResult,
  ContractOrchestratorResult,
  PresentationOutcome,
} from '../../app/api/agents/run/uptimize/agent-6-closer';

const mockedExecute = vi.mocked(executeWithFallback);

const MOCK_GUIDE: PresentationCoachResult = {
  pre_presentation_guide: {
    opening_statement: 'When we talked about the WhatsApp coordination chaos, you said it was eating 12 hours a week.',
    lead_with_this_number_usd: 4800,
    recommended_sequence: [
      'Open with the discovery anchor',
      'State the monthly leak total — pause',
      'Walk pillar-by-pillar breakdown',
      'Invite reactions to the numbers',
      'Present the three tiers',
      'Ask the closing question',
    ],
    objection_responses: [
      {
        objection: 'It feels expensive for a 6-person shop',
        response_acknowledge: "I hear you — for a team your size that number lands hard.",
        response_reframe: "But the leak is the comparison, not the price.",
        response_evidence: "$4,800/mo lost vs $1,200/mo to fix it — that is 4× recovery.",
        response_ask: "Would the Starter tier feel better as a way to begin?",
      },
    ],
    closing_question: 'Based on what we walked through, does Growth feel right, or would Starter be a better first step?',
    red_lines: ['Do not bring up legal compliance unprompted', 'Do not pitch internal AI ventures'],
  },
};

const MOCK_GUIDE_WITH_DEBRIEF: PresentationCoachResult = {
  pre_presentation_guide: MOCK_GUIDE.pre_presentation_guide,
  post_presentation_debrief: {
    what_actually_happened: 'Client signed Growth tier on the spot at $1,200/mo with $5,000 build fee.',
    objections_that_came_up: ['Worried about staff training time'],
    what_worked: ['Leading with the $4,800/mo anchor', 'Using their phrase "we drown in WhatsApp"'],
    what_did_not_work: ['Pillar 6 explanation went too long'],
    scope_changes_during_close: [],
    feeds_to_agent8: {
      objection_pattern: 'training-time-fear',
      response_effectiveness: 'high',
      notes_for_methodology: 'Offering FVi7 protocol upfront defused training concern faster than expected.',
    },
  },
};

const MOCK_NOT_READY_CONTRACT: ContractOrchestratorResult = {
  contract_status: {
    sow_generated: false,
    sow_version: 0,
    follow_ups_sent: 0,
  },
  credential_status: {
    required_count: 3,
    collected_count: 0,
    tested_count: 0,
    all_required_tested: false,
    confirmed_credentials: [],
    blockers: [
      { system_name: 'HubSpot', blocker: 'Pending — pre-close', attempts: 0 },
      { system_name: 'Mailchimp', blocker: 'Pending — pre-close', attempts: 0 },
      { system_name: 'WhatsApp Business', blocker: 'Pending — pre-close', attempts: 0 },
    ],
  },
  client_setup: {
    client_id: 'client_test_001',
    client_config_created: false,
    portal_created: false,
    portal_login_sent: false,
    kickoff_agenda_items: [],
    primary_contact_name: 'Pending',
    primary_contact_email: 'pending@example.com',
    preferred_communication: 'email',
  },
  scope_modifications: [],
  build_directives: [],
  agent_4_briefing: null,
  ready_for_build: false,
};

const MOCK_READY_CONTRACT: ContractOrchestratorResult = {
  contract_status: {
    sow_generated: true,
    sow_sent_at: '2026-05-04T15:00:00Z',
    sow_version: 1,
    signed_at: '2026-05-04T18:30:00Z',
    signature_method: 'docusign',
    follow_ups_sent: 0,
  },
  credential_status: {
    required_count: 1,
    collected_count: 1,
    tested_count: 1,
    all_required_tested: true,
    confirmed_credentials: [
      {
        system_name: 'HubSpot',
        system_type: 'CRM',
        credential_reference: 'secrets://client_test_001/hubspot/api_key',
        access_level_confirmed: 'read_write_contacts',
        test_connection_passed: true,
        collected_at: '2026-05-04T17:00:00Z',
      },
    ],
    blockers: [],
  },
  client_setup: {
    client_id: 'client_test_001',
    client_config_created: true,
    portal_created: true,
    portal_login_sent: true,
    portal_first_login_at: '2026-05-04T19:00:00Z',
    kickoff_date: '2026-05-08T14:00:00Z',
    kickoff_agenda_items: ['Review delivery plan', 'Walk through portal'],
    primary_contact_name: 'Test Owner',
    primary_contact_email: 'owner@example.com',
    preferred_communication: 'email',
  },
  scope_modifications: [],
  build_directives: [
    {
      directive: 'Include 1-hour staff training session in week 1',
      source: 'objection_resolution',
      priority: 'must',
    },
  ],
  agent_4_briefing: {
    agreed_scope: {
      tier: 'growth',
      build_fee_usd: 5000,
      monthly_retainer_usd: 1200,
      payment_terms: '50/50 split, signing/go-live',
      scope_inclusions: ['Lead intake automation', 'Exception triage', 'Audit trail'],
      scope_exclusions: ['Custom mobile app', 'Phone system integration'],
      phase_2_preview: ['Voice agent', 'Compliance reporting'],
    },
    close_context: {
      close_date: '2026-05-04',
      objections_raised: [
        { objection: 'Training time', resolution: 'FVi7 protocol explained', any_commitments_made: '1-hour week-1 training' },
      ],
      client_priorities_stated: ['Stop the WhatsApp chaos first'],
      specific_concerns_for_build: ['No staff training friction'],
      relationship_tone: 'enthusiastic',
    },
    confirmed_credentials: [
      {
        system_name: 'HubSpot',
        system_type: 'CRM',
        credential_reference: 'secrets://client_test_001/hubspot/api_key',
        access_level_confirmed: 'read_write_contacts',
        test_connection_passed: true,
        collected_at: '2026-05-04T17:00:00Z',
      },
    ],
    client_setup: {
      client_id: 'client_test_001',
      client_config_created: true,
      portal_created: true,
      portal_login_sent: true,
      portal_first_login_at: '2026-05-04T19:00:00Z',
      kickoff_date: '2026-05-08T14:00:00Z',
      kickoff_agenda_items: ['Review delivery plan', 'Walk through portal'],
      primary_contact_name: 'Test Owner',
      primary_contact_email: 'owner@example.com',
      preferred_communication: 'email',
    },
    original_agent3_spec: { mock: 'agent3-spec' },
    scope_modifications: [],
    build_directives: [
      {
        directive: 'Include 1-hour staff training session in week 1',
        source: 'objection_resolution',
        priority: 'must',
      },
    ],
  },
  ready_for_build: true,
};

function buildBaseInput(overrides: Partial<Agent6Input> = {}): Agent6Input {
  return {
    proposal: {
      recommended_tier: 'growth',
      tier_rationale: '6 people, mid-volume — Growth fits.',
      starter_option: {
        build_fee_usd: 2500,
        monthly_retainer_usd: 600,
        delivery_days: 14,
        whats_included: ['Top leak fix'],
        top_leak_addressed: 'WhatsApp chaos',
        top_leak_value_usd: 2400,
      },
      growth_option: {
        build_fee_usd: 5000,
        monthly_retainer_usd: 1200,
        delivery_days: 21,
        whats_included: ['Lead intake', 'Exception triage', 'Audit trail'],
        leaks_addressed: ['WhatsApp chaos', 'Manual exception handling', 'Audit gaps'],
        total_value_usd: 4800,
      },
    },
    money_leak_map: {
      total_monthly_value_usd: 4800,
      confidence_weighted_usd: 4200,
      pillar_breakdown: [
        { pillar: 'Shadow Ops', monthly_value_usd: 2400, confidence: 'high', key_leaks: ['WhatsApp coordination'] },
      ],
      key_assumptions: ['12 hours/week of off-system coordination'],
    },
    close_plan: {
      presentation_sequence: ['Open with anchor', 'Walk through pillars', 'Present tiers'],
      lead_with_this_number: 4800,
      anticipated_objections: [
        {
          objection: 'It feels expensive',
          likelihood: 'high',
          recommended_response: 'Reframe with leak comparison',
          evidence_to_reference: '$4,800/mo lost vs $1,200/mo to fix',
        },
      ],
      decision_maker_profile: 'Operator-owner, fast decisions',
      urgency_signal: 'Q3 expansion plan needs operational stability first',
      deal_breakers_to_avoid: ['Long implementation timelines'],
    },
    client_intelligence: {
      specific_phrases_used: ['we drown in WhatsApp', 'nobody remembers what was said'],
      problems_in_their_words: 'We drown in WhatsApp and nobody remembers what was said.',
      what_they_care_most_about: 'Stopping the chaos',
      communication_style: 'casual',
      decision_speed_signal: 'fast',
      budget_signals: ['Mentioned $1500/mo as comfortable'],
    },
    build_readiness: {
      required_integrations: [
        { system_name: 'HubSpot', system_type: 'CRM', credential_type: 'api_key' },
      ],
      known_constraints: ['Owner is the only admin'],
      timeline_expectations: 'Live in 3 weeks',
      agent3_handoff_spec: { mock: 'agent3-spec' },
    },
    gate3_decision: {
      proposalApproved: true,
      tierRecommendation: 'growth',
    },
    mode: 'pre_close',
    client_id: 'client_test_001',
    ...overrides,
  };
}

const SUCCESSFUL_OUTCOME: PresentationOutcome = {
  status: 'signed',
  agreed_tier: 'growth',
  agreed_build_fee_usd: 5000,
  agreed_monthly_retainer_usd: 1200,
  payment_terms: '50/50 split',
  scope_inclusions: ['Lead intake automation', 'Exception triage', 'Audit trail'],
  scope_exclusions: ['Custom mobile app'],
  phase_2_preview: ['Voice agent'],
  objections_raised: [
    { objection: 'Training time', resolution: 'FVi7 explained', any_commitments_made: '1-hour week-1 training' },
  ],
  client_priorities_stated: ['Stop the WhatsApp chaos first'],
  specific_concerns_for_build: ['No staff training friction'],
  relationship_tone: 'enthusiastic',
};

function fakeFallback(content: unknown) {
  return {
    content: JSON.stringify(content),
    model_used: 'claude-opus-4-20250514',
    provider: 'anthropic' as const,
    usage: { input_tokens: 800, output_tokens: 400, total_tokens: 1200 },
    cost_usd: 0.05,
    latency_ms: 1500,
    fallback_used: false,
    primary_provider: 'anthropic' as const,
    attempts: 1,
  };
}

describe('Agent 6: Closer & Onboarding Coordinator', () => {
  beforeEach(() => {
    mockedExecute.mockReset();
  });

  it('pre-close mode produces a presentation guide and an unready contract', async () => {
    mockedExecute
      .mockResolvedValueOnce(fakeFallback(MOCK_GUIDE))
      .mockResolvedValueOnce(fakeFallback(MOCK_NOT_READY_CONTRACT));

    const result = await runAgent6Closer(buildBaseInput({ mode: 'pre_close' }));

    expect(result.agent_id).toBe('agent-6-closer');
    expect(result.final_output.mode).toBe('pre_close');
    expect(result.final_output.pre_presentation_guide.lead_with_this_number_usd).toBe(4800);
    expect(result.final_output.post_presentation_debrief).toBeNull();
    expect(result.final_output.ready_for_build).toBe(false);
    expect(result.final_output.agent_4_briefing).toBeNull();
    expect(result.sub_agent_results).toHaveLength(2);
    expect(result.sub_agent_results[0].sub_agent_id).toBe('6A-presentation-coach');
    expect(result.sub_agent_results[1].sub_agent_id).toBe('6B-contract-orchestrator');
  });

  it('post-close signed outcome produces a ready Agent 4 briefing', async () => {
    mockedExecute
      .mockResolvedValueOnce(fakeFallback(MOCK_GUIDE_WITH_DEBRIEF))
      .mockResolvedValueOnce(fakeFallback(MOCK_READY_CONTRACT));

    const input = buildBaseInput({
      mode: 'post_close',
      presentation_outcome: SUCCESSFUL_OUTCOME,
    });
    const result = await runAgent6Closer(input);

    expect(result.final_output.ready_for_build).toBe(true);
    expect(result.final_output.agent_4_briefing).not.toBeNull();
    expect(result.final_output.agent_4_briefing!.agreed_scope.tier).toBe('growth');
    expect(result.final_output.agent_4_briefing!.original_agent3_spec).toEqual({ mock: 'agent3-spec' });
    expect(result.final_output.post_presentation_debrief).not.toBeNull();
    expect(result.final_output.post_presentation_debrief!.feeds_to_agent8.objection_pattern).toBe('training-time-fear');
  });

  it('forces ready_for_build=false when an LLM hallucinates ready=true without preconditions', async () => {
    const hallucinatedReady = {
      ...MOCK_NOT_READY_CONTRACT,
      ready_for_build: true,
      agent_4_briefing: { ...MOCK_READY_CONTRACT.agent_4_briefing },
    };
    mockedExecute
      .mockResolvedValueOnce(fakeFallback(MOCK_GUIDE_WITH_DEBRIEF))
      .mockResolvedValueOnce(fakeFallback(hallucinatedReady));

    const result = await runAgent6Closer(
      buildBaseInput({ mode: 'post_close', presentation_outcome: SUCCESSFUL_OUTCOME }),
    );

    expect(result.final_output.ready_for_build).toBe(false);
    expect(result.final_output.agent_4_briefing).toBeNull();
  });

  it('marks human attention required when sub-agent A fails', async () => {
    mockedExecute.mockRejectedValueOnce(new Error('Provider down'));

    const result = await runAgent6Closer(buildBaseInput({ mode: 'pre_close' }));

    expect(result.requires_human_attention).toBe(true);
    expect(result.sub_agent_results[0].task_completed).toBe(false);
    expect(result.sub_agent_results[0].escalation_severity).toBe('P1');
    expect(result.final_output.ready_for_build).toBe(false);
  });

  it('rolls up cost from both sub-agents', async () => {
    mockedExecute
      .mockResolvedValueOnce(fakeFallback(MOCK_GUIDE))
      .mockResolvedValueOnce(fakeFallback(MOCK_NOT_READY_CONTRACT));

    const result = await runAgent6Closer(buildBaseInput({ mode: 'pre_close' }));

    expect(result.total_cost_usd).toBeCloseTo(0.10, 5);
    expect(result.sub_agent_results.every(r => r.cost_usd === 0.05)).toBe(true);
  });
});
