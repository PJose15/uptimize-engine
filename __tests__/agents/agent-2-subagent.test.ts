// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/providers/fallback', () => ({
  executeWithFallback: vi.fn(),
}));

import { executeWithFallback } from '@/lib/providers/fallback';
import { runAgent2SubAgent, type MessageArchitectInput } from '../../app/api/agents/run/uptimize/agent-2-outbound-appointment';

const mockedExecute = vi.mocked(executeWithFallback);

const MESSAGES = {
  message_library: [
    {
      lead_id: 'lead-1',
      channel: 'email',
      track_messages: {
        pattern_interrupt: { linkedin_dm: 'Saw the Ops hire — chaos signal?', email: 'Ops Coordinator hire usually means coordination chaos.', cold_call_script: '30s pitch' },
        problem_first: { linkedin_dm: '$4,800/mo leak', email: 'Identified $4,800/mo leak', cold_call_script: 'Lead with $$' },
        proof_first: { linkedin_dm: 'Other studio cut chaos 60%', email: 'Similar studio in fitness cut chaos 60%', cold_call_script: 'Proof first' },
      },
      followup_sequence: [
        { touch_number: 1, day_offset: 0, message: 'Initial', angle_type: 'question', cta: 'Reply YES' },
        { touch_number: 2, day_offset: 3, message: 'Bump', angle_type: 'insight', cta: 'Quick chat?' },
      ],
    },
  ],
  conversation_updates: [],
};

const PIPELINE = {
  outbound_run_sheet: {
    daily_plan: [
      { block_name: 'Morning new outreach', activity: 'new_outreach', count: 10, channel: 'linkedin', suggested_send_day: 'Tue', suggested_send_time_local: '9-10am', send_schedule_rationale: 'Best open rates' },
    ],
    sequence_rules: 'Email 1 → LinkedIn 2 → Call 3',
    qualification_rules: 'BANT + pillar fit',
    no_show_protocol: 'Follow up within 4h',
  },
  bookings: [
    {
      lead_id: 'lead-1',
      meeting_type: 'discovery',
      confirmed_time: '2026-05-08T15:00:00Z',
      qualified_lead_summary: { problem: 'Lost confirmations', impact: '$4,800/mo', urgency: 'High', authority: 'Owner', stack: ['HubSpot'], timeline: 'Q3' },
      qualification_level: 'hard_qualified',
      confirmation_message: { timing: 'T_minus_24h', channel: 'email', body: 'Confirming our Tuesday 3pm.' },
    },
  ],
  nurture_queue: [
    {
      lead_id: 'lead-2',
      reason: 'Q3 expansion focus, not ready for Q2',
      next_touch_day_offset: 30,
      nurture_message: 'Reaching out next quarter when timing fits.',
      shadow_ops_guess: 'Spreadsheet ops + WhatsApp',
      likely_exceptions_guess: ['Lost leads'],
    },
  ],
  volume_targets: { new_outreach: 30, followups: 20, goal_booked_calls: 5 },
  channels_used: ['email', 'linkedin'],
};

function fakeFallback(content: unknown) {
  return {
    content: JSON.stringify(content),
    model_used: 'claude-sonnet-4-20250514',
    provider: 'anthropic' as const,
    usage: { input_tokens: 1000, output_tokens: 800, total_tokens: 1800 },
    cost_usd: 0.04,
    latency_ms: 1500,
    fallback_used: false,
    primary_provider: 'anthropic' as const,
    attempts: 1,
  };
}

const INPUT: MessageArchitectInput = {
  target_pack: { target_pack_primary: [{ lead_id: 'lead-1', name: 'Jane' }] },
  channels: ['email', 'linkedin'],
  offer_positioning: 'Operations automation for fitness',
};

describe('Sprint 12.6 — Agent 2 sub-agent orchestrator (parallel)', () => {
  beforeEach(() => mockedExecute.mockReset());

  it('produces OutboundAndBookingOutput from 2A and 2B in parallel', async () => {
    mockedExecute.mockImplementation(async (taskProfile) => {
      if (taskProfile === 'content_drafting') return fakeFallback(MESSAGES);
      return fakeFallback(PIPELINE);
    });

    const result = await runAgent2SubAgent(INPUT, { clientId: 'client-1', pipelineRunId: 'run-1' });

    expect(result.final_output.message_library).toHaveLength(1);
    expect(result.final_output.bookings).toHaveLength(1);
    expect(result.final_output.nurture_queue).toHaveLength(1);
    expect(result.final_output.outbound_run_sheet.daily_plan).toHaveLength(1);
    expect(result.sub_agent_results.map(r => r.sub_agent_id).sort()).toEqual(['2A-message-architect', '2B-pipeline-manager']);
  });

  it('total duration is the max of the parallel sub-agents (not the sum)', async () => {
    mockedExecute.mockImplementation(async (taskProfile) => {
      if (taskProfile === 'content_drafting') {
        return { ...fakeFallback(MESSAGES), latency_ms: 1500 };
      }
      return { ...fakeFallback(PIPELINE), latency_ms: 1500 };
    });

    const result = await runAgent2SubAgent(INPUT);
    // Both sub-agent durations recorded individually; total_duration_ms is max,
    // so it should be roughly the duration of one sub-agent (each ~ms-fast in mock).
    const maxIndividual = Math.max(...result.sub_agent_results.map(r => r.duration_ms));
    expect(result.total_duration_ms).toBe(maxIndividual);
  });
});
