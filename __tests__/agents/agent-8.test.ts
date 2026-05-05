// @vitest-environment node
/**
 * Agent 8: Vertical Intelligence Keeper Tests
 *
 * Structural tests with mocked LLM provider — verifies the three-tier
 * confirmation rule, multiplier cap, model_performance defer-to-Pedro,
 * and the audit-required (old/new content summary) invariant.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/providers/fallback', () => ({
  executeWithFallback: vi.fn(),
}));

import { executeWithFallback } from '@/lib/providers/fallback';
import { runAgent8IntelligenceKeeper } from '../../app/api/agents/run/uptimize/agent-8-intelligence';
import {
  evaluateModelPerformance,
  buildModelPerformanceLearningPayload,
} from '../../lib/learning/updaters/model-performance';
import type {
  Agent8Input,
  PatternCollectorResult,
  PlaybookUpdaterResult,
  LearningEventView,
} from '../../app/api/agents/run/uptimize/agent-8-intelligence';

const mockedExecute = vi.mocked(executeWithFallback);

function event(over: Partial<LearningEventView> = {}): LearningEventView {
  return {
    id: 'evt-1',
    source_agent_id: 'agent-3-sales-engineer',
    source_run_id: 'run-1',
    vertical: 'fitness',
    learning_type: 'shadow_ops_signal_weight',
    key: 'whatsapp-booking',
    value: '{"observed":true,"weight":1.5}',
    data_points: 1,
    confidence: 0.5,
    significance: 'flag_only',
    created_at: '2026-05-01T00:00:00Z',
    ...over,
  };
}

const PATTERN_VALIDATED: PatternCollectorResult = {
  evaluations: [
    {
      learning_event_ids: ['evt-1', 'evt-2', 'evt-3'],
      vertical: 'fitness',
      learning_type: 'shadow_ops_signal_weight',
      key: 'whatsapp-booking',
      data_points_collected: 3,
      significance: 'validated',
      basis: 'Three independent fitness deployments confirmed WhatsApp booking signal weight uplift.',
      recommended_action: 'confirmed_update',
      recommended_update: {
        target: 'playbook:fitness:shadow_ops_signals',
        old_summary: 'WhatsApp booking signal weighted 1.2x',
        new_summary: 'WhatsApp booking signal weighted 1.5x',
      },
    },
  ],
  events_processed: 3,
  contradictions_detected: 0,
};

const PATTERN_TENTATIVE: PatternCollectorResult = {
  evaluations: [
    {
      learning_event_ids: ['evt-1', 'evt-2'],
      vertical: 'fitness',
      learning_type: 'money_leak_multiplier',
      key: 'shadow_ops',
      data_points_collected: 2,
      significance: 'tentative',
      basis: 'Two fitness deployments showed actual leak 18% higher than estimate.',
      recommended_action: 'tentative_update',
      quantification: {
        estimated_value: '1.0x',
        actual_value: '1.18x',
        percentage_difference: 18,
      },
      recommended_update: {
        target: 'multiplier:fitness:shadow_ops',
        old_summary: '1.0x',
        new_summary: '1.18x',
      },
    },
  ],
  events_processed: 2,
  contradictions_detected: 0,
};

const PATTERN_FLAG_ONLY: PatternCollectorResult = {
  evaluations: [
    {
      learning_event_ids: ['evt-1'],
      vertical: 'healthcare',
      learning_type: 'exception_pattern',
      key: 'hipaa-overhead',
      data_points_collected: 1,
      significance: 'watch',
      basis: 'Single observation in healthcare. Insufficient for update.',
      recommended_action: 'no_change',
    },
  ],
  events_processed: 1,
  contradictions_detected: 0,
};

const PATTERN_MODEL_PERF: PatternCollectorResult = {
  evaluations: [
    {
      learning_event_ids: ['evt-1', 'evt-2', 'evt-3'],
      vertical: 'all',
      learning_type: 'model_performance',
      key: 'shadow_ops_research:gemini-2.0-flash',
      data_points_collected: 3,
      significance: 'validated',
      basis: '36% significant edit rate over 11 runs.',
      recommended_action: 'confirmed_update',
      recommended_update: {
        target: 'task_profile:shadow_ops_research',
        old_summary: 'Tier FAST (gemini-2.0-flash)',
        new_summary: 'Recommend BALANCED tier',
      },
    },
  ],
  events_processed: 3,
  contradictions_detected: 0,
};

function applyValidated(): PlaybookUpdaterResult {
  return {
    updates_applied: [
      {
        evaluation_index: 0,
        target: 'playbook:fitness:shadow_ops_signals',
        scope: 'playbook',
        old_content_summary: 'WhatsApp booking signal weighted 1.2x',
        new_content_summary: 'WhatsApp booking signal weighted 1.5x',
        applied_label: 'VALIDATED',
        applied_at: '2026-05-04T00:00:00Z',
        data_points: 3,
      },
    ],
    distribution_notices: [],
    deferred_to_pedro: [],
  };
}

function applyTentativeWithLargeMultiplier(): PlaybookUpdaterResult {
  return {
    updates_applied: [
      {
        evaluation_index: 0,
        target: 'multiplier:fitness:shadow_ops',
        scope: 'multiplier',
        old_content_summary: '1.0x',
        new_content_summary: '1.40x', // LLM tries to apply +40%
        applied_label: 'EMERGING',
        applied_at: '2026-05-04T00:00:00Z',
        data_points: 2,
        multiplier_change_pct: 40, // exceeds 15% cap
      },
    ],
    distribution_notices: [],
    deferred_to_pedro: [],
  };
}

function applyFlagOnly(): PlaybookUpdaterResult {
  return {
    updates_applied: [
      {
        evaluation_index: 0,
        target: 'exception_library:hipaa-overhead',
        scope: 'exception_library',
        old_content_summary: 'Not in library',
        new_content_summary: 'New entry',
        applied_label: 'EMERGING',
        applied_at: '2026-05-04T00:00:00Z',
        data_points: 1,
      },
    ],
    distribution_notices: [],
    deferred_to_pedro: [],
  };
}

function applyModelPerf(): PlaybookUpdaterResult {
  return {
    updates_applied: [
      {
        evaluation_index: 0,
        target: 'task_profile:shadow_ops_research',
        scope: 'fit_score_weights',
        old_content_summary: 'FAST',
        new_content_summary: 'BALANCED',
        applied_label: 'VALIDATED',
        applied_at: '2026-05-04T00:00:00Z',
        data_points: 3,
      },
    ],
    distribution_notices: [],
    deferred_to_pedro: [
      {
        category: 'model_performance',
        description: 'shadow_ops_research using gemini-2.0-flash has a 36% edit rate over 11 runs.',
        decision_required: 'Approve upgrade to BALANCED or add task-specific override.',
        evaluation_indices: [0],
      },
    ],
  };
}

function applyMissingAuditFields(): PlaybookUpdaterResult {
  return {
    updates_applied: [
      {
        evaluation_index: 0,
        target: 'playbook:fitness:shadow_ops_signals',
        scope: 'playbook',
        old_content_summary: '', // missing!
        new_content_summary: 'WhatsApp booking signal weighted 1.5x',
        applied_label: 'VALIDATED',
        applied_at: '2026-05-04T00:00:00Z',
        data_points: 3,
      },
    ],
    distribution_notices: [],
    deferred_to_pedro: [],
  };
}

function fakeFallback(content: unknown) {
  return {
    content: JSON.stringify(content),
    model_used: 'gemini-2.5-pro',
    provider: 'gemini' as const,
    usage: { input_tokens: 700, output_tokens: 350, total_tokens: 1050 },
    cost_usd: 0.03,
    latency_ms: 1800,
    fallback_used: false,
    primary_provider: 'gemini' as const,
    attempts: 1,
  };
}

describe('Agent 8: Vertical Intelligence Keeper', () => {
  beforeEach(() => mockedExecute.mockReset());

  it('applies a validated 3+ data-point pattern', async () => {
    mockedExecute
      .mockResolvedValueOnce(fakeFallback(PATTERN_VALIDATED))
      .mockResolvedValueOnce(fakeFallback(applyValidated()));

    const input: Agent8Input = {
      events: [event({ id: 'evt-1' }), event({ id: 'evt-2' }), event({ id: 'evt-3' })],
      triggered_by: 'event',
    };
    const result = await runAgent8IntelligenceKeeper(input);

    expect(result.final_output.playbook_updater.updates_applied).toHaveLength(1);
    expect(result.final_output.playbook_updater.updates_applied[0].applied_label).toBe('VALIDATED');
    expect(result.final_output.events_to_mark_applied).toEqual(['evt-1', 'evt-2', 'evt-3']);
  });

  it('caps multiplier change at ±15% per cycle', async () => {
    mockedExecute
      .mockResolvedValueOnce(fakeFallback(PATTERN_TENTATIVE))
      .mockResolvedValueOnce(fakeFallback(applyTentativeWithLargeMultiplier()));

    const result = await runAgent8IntelligenceKeeper({
      events: [event({ id: 'evt-1' }), event({ id: 'evt-2' })],
      triggered_by: 'event',
    });

    const applied = result.final_output.playbook_updater.updates_applied;
    expect(applied).toHaveLength(1);
    expect(applied[0].applied_label).toBe('EMERGING');
    expect(applied[0].multiplier_change_pct).toBe(15); // capped from 40
  });

  it('drops updates that 8A classified as flag_only/watch (one data point)', async () => {
    mockedExecute
      .mockResolvedValueOnce(fakeFallback(PATTERN_FLAG_ONLY))
      .mockResolvedValueOnce(fakeFallback(applyFlagOnly())); // LLM tries to apply anyway

    const result = await runAgent8IntelligenceKeeper({
      events: [event({ id: 'evt-1', vertical: 'healthcare', learning_type: 'exception_pattern' })],
      triggered_by: 'event',
    });

    expect(result.final_output.playbook_updater.updates_applied).toHaveLength(0);
    expect(result.final_output.events_to_mark_applied).toHaveLength(0);
  });

  it('strips updates missing required audit fields', async () => {
    mockedExecute
      .mockResolvedValueOnce(fakeFallback(PATTERN_VALIDATED))
      .mockResolvedValueOnce(fakeFallback(applyMissingAuditFields()));

    const result = await runAgent8IntelligenceKeeper({
      events: [event({ id: 'evt-1' }), event({ id: 'evt-2' }), event({ id: 'evt-3' })],
      triggered_by: 'event',
    });

    expect(result.final_output.playbook_updater.updates_applied).toHaveLength(0);
  });

  it('never applies model_performance updates — defers to Pedro', async () => {
    mockedExecute
      .mockResolvedValueOnce(fakeFallback(PATTERN_MODEL_PERF))
      .mockResolvedValueOnce(fakeFallback(applyModelPerf()));

    const result = await runAgent8IntelligenceKeeper({
      events: [
        event({ id: 'evt-1', learning_type: 'model_performance' }),
        event({ id: 'evt-2', learning_type: 'model_performance' }),
        event({ id: 'evt-3', learning_type: 'model_performance' }),
      ],
      triggered_by: 'event',
    });

    expect(result.final_output.playbook_updater.updates_applied).toHaveLength(0);
    expect(result.final_output.pedro_review_required).toHaveLength(1);
    expect(result.final_output.pedro_review_required[0].category).toBe('model_performance');
    expect(result.requires_human_attention).toBe(true);
  });

  it('returns empty result on empty batch with no LLM calls', async () => {
    const result = await runAgent8IntelligenceKeeper({ events: [], triggered_by: 'cron_batch' });
    expect(mockedExecute).not.toHaveBeenCalled();
    expect(result.final_output.playbook_updater.updates_applied).toHaveLength(0);
    expect(result.total_cost_usd).toBe(0);
  });
});

describe('Sprint 11.3 — model_performance updater', () => {
  it('recommends upgrade when 30%+ edit rate over 10+ runs', () => {
    const evaluation = evaluateModelPerformance({
      task_profile: 'shadow_ops_research',
      model_used: 'gemini-2.0-flash',
      total_runs: 11,
      minor_edits: 2,
      significant_edits: 3,
      full_rewrites: 1,
      rewrite_rate: 1 / 11,
      significant_edit_rate: 4 / 11, // ~36%
    });

    expect(evaluation.action).toBe('recommend_upgrade');
    expect(evaluation.recommendation).toContain('shadow_ops_research');
    expect(evaluation.recommendation).toContain('36%');
  });

  it('flags when 15-30% edit rate over 5+ runs', () => {
    const evaluation = evaluateModelPerformance({
      task_profile: 'win_report',
      model_used: 'claude-opus-4-20250514',
      total_runs: 8,
      minor_edits: 4,
      significant_edits: 2,
      full_rewrites: 0,
      rewrite_rate: 0,
      significant_edit_rate: 2 / 8, // 25%
    });

    expect(evaluation.action).toBe('flag_for_review');
  });

  it('says no_change for low edit rates', () => {
    const evaluation = evaluateModelPerformance({
      task_profile: 'proposal_writing',
      model_used: 'claude-opus-4-20250514',
      total_runs: 6,
      minor_edits: 1,
      significant_edits: 0,
      full_rewrites: 0,
      rewrite_rate: 0,
      significant_edit_rate: 0,
    });

    expect(evaluation.action).toBe('no_change');
    expect(evaluation.recommendation).toBeUndefined();
  });

  it('builds a learning payload with embedded evaluation', () => {
    const payload = buildModelPerformanceLearningPayload({
      task_profile: 'shadow_ops_research',
      model_used: 'gemini-2.0-flash',
      total_runs: 11,
      minor_edits: 2,
      significant_edits: 3,
      full_rewrites: 1,
      rewrite_rate: 1 / 11,
      significant_edit_rate: 4 / 11,
    });

    expect(payload.learning_type).toBe('model_performance');
    expect(payload.key).toBe('shadow_ops_research:gemini-2.0-flash');
    const value = JSON.parse(payload.value);
    expect(value.evaluation.action).toBe('recommend_upgrade');
  });
});
