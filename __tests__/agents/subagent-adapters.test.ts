// @vitest-environment node
/**
 * Sub-agent adapter seam.
 *
 * These are the mappings that decide whether the v2 orchestrators are actually
 * reachable, so they are tested offline against mocked orchestrators rather
 * than against live providers.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/subagent/persistence', () => ({
    persistSubAgentRuns: vi.fn(async () => {}),
}));

vi.mock('../../app/api/agents/run/uptimize/agent-1-market-intelligence/subagent-orchestrator', () => ({
    runAgent1SubAgent: vi.fn(),
}));
vi.mock('../../app/api/agents/run/uptimize/agent-1-market-intelligence/agent', () => ({
    runAgent1MarketIntelligence: vi.fn(async () => ({ success: true, message: 'legacy', data: { legacy: true } })),
}));
vi.mock('../../app/api/agents/run/uptimize/agent-2-outbound-appointment/subagent-orchestrator', () => ({
    runAgent2SubAgent: vi.fn(),
}));
vi.mock('../../app/api/agents/run/uptimize/agent-2-outbound-appointment/agent', () => ({
    runAgent2OutboundAppointment: vi.fn(async () => ({ success: true, message: 'legacy', data: { legacy: true } })),
}));
vi.mock('../../app/api/agents/run/uptimize/agent-3-sales-engineer/subagent-orchestrator', () => ({
    runAgent3SubAgent: vi.fn(),
}));
vi.mock('../../app/api/agents/run/uptimize/agent-3-sales-engineer/agent', () => ({
    runAgent3SalesEngineer: vi.fn(async () => ({ success: true, message: 'legacy', data: { legacy: true } })),
}));
vi.mock('../../app/api/agents/run/uptimize/agent-4-systems-delivery/subagent-orchestrator', () => ({
    runAgent4SubAgent: vi.fn(),
}));
vi.mock('../../app/api/agents/run/uptimize/agent-4-systems-delivery/agent', () => ({
    runAgent4SystemsDelivery: vi.fn(async () => ({ success: true, message: 'legacy', data: { legacy: true } })),
}));
vi.mock('../../app/api/agents/run/uptimize/agent-5-client-success', () => ({
    runAgent5SubAgent: vi.fn(),
    runAgent5: vi.fn(async () => ({ legacy: true })),
}));

import {
    runAgent1ViaSubAgents,
    runAgent2ViaSubAgents,
    runAgent3ViaSubAgents,
    runAgent4ViaSubAgents,
    resolvePipelineAgents,
    actualCostOf,
    subAgentsEnabled,
} from '../../app/api/agents/run/uptimize/subagent-adapters';

import { persistSubAgentRuns } from '@/lib/subagent/persistence';
import { runAgent1SubAgent } from '../../app/api/agents/run/uptimize/agent-1-market-intelligence/subagent-orchestrator';
import { runAgent1MarketIntelligence } from '../../app/api/agents/run/uptimize/agent-1-market-intelligence/agent';
import { runAgent2SubAgent } from '../../app/api/agents/run/uptimize/agent-2-outbound-appointment/subagent-orchestrator';
import { runAgent2OutboundAppointment } from '../../app/api/agents/run/uptimize/agent-2-outbound-appointment/agent';
import { runAgent3SubAgent } from '../../app/api/agents/run/uptimize/agent-3-sales-engineer/subagent-orchestrator';
import { runAgent3SalesEngineer } from '../../app/api/agents/run/uptimize/agent-3-sales-engineer/agent';
import { runAgent4SubAgent } from '../../app/api/agents/run/uptimize/agent-4-systems-delivery/subagent-orchestrator';
import { runAgent4SystemsDelivery } from '../../app/api/agents/run/uptimize/agent-4-systems-delivery/agent';

function subResult(overrides: Record<string, unknown> = {}) {
    return {
        sub_agent_id: '1A-research-specialist',
        parent_agent_id: 'agent-1-market-intelligence',
        task_completed: true,
        result: { ok: true },
        confidence: 'high',
        cost_usd: 0.01,
        duration_ms: 1000,
        model_used: 'gemini-2.0-flash',
        tokens_input: 800,
        tokens_output: 400,
        processing_notes: [],
        fallbacks_used: [],
        escalation_needed: false,
        ...overrides,
    };
}

function synthesis(overrides: Record<string, unknown> = {}) {
    return {
        agent_id: 'agent-1-market-intelligence',
        final_output: { target_pack_primary: [{ lead_id: 'lead-1' }] },
        sub_agent_results: [
            subResult(),
            subResult({ sub_agent_id: '1B-scoring-analyst', model_used: 'gemini-2.0-flash', cost_usd: 0.02 }),
        ],
        total_cost_usd: 0.03,
        total_duration_ms: 2000,
        synthesis_notes: ['2 leads scored'],
        overall_confidence: 'high',
        requires_human_attention: false,
        ...overrides,
    };
}

const ORIGINAL_FLAG = process.env.USE_SUBAGENTS;

beforeEach(() => {
    vi.clearAllMocks();
});

afterEach(() => {
    if (ORIGINAL_FLAG === undefined) delete process.env.USE_SUBAGENTS;
    else process.env.USE_SUBAGENTS = ORIGINAL_FLAG;
});

describe('subAgentsEnabled', () => {
    it('is off unless USE_SUBAGENTS is exactly "true"', () => {
        delete process.env.USE_SUBAGENTS;
        expect(subAgentsEnabled()).toBe(false);

        process.env.USE_SUBAGENTS = '1';
        expect(subAgentsEnabled()).toBe(false);

        process.env.USE_SUBAGENTS = 'true';
        expect(subAgentsEnabled()).toBe(true);
    });
});

describe('resolvePipelineAgents', () => {
    it('routes to the legacy implementations when the flag is off', async () => {
        delete process.env.USE_SUBAGENTS;
        const agents = resolvePipelineAgents();

        expect(agents.useSubAgents).toBe(false);
        await agents.runAgent1('find gyms', {}, 'fast');

        expect(runAgent1MarketIntelligence).toHaveBeenCalledOnce();
        expect(runAgent1SubAgent).not.toHaveBeenCalled();
    });

    it('routes to the sub-agent orchestrators when the flag is on', async () => {
        process.env.USE_SUBAGENTS = 'true';
        vi.mocked(runAgent1SubAgent).mockResolvedValue(synthesis() as never);

        const agents = resolvePipelineAgents();
        expect(agents.useSubAgents).toBe(true);

        await agents.runAgent1('find gyms', {}, 'fast');

        expect(runAgent1SubAgent).toHaveBeenCalledOnce();
        expect(runAgent1MarketIntelligence).not.toHaveBeenCalled();
    });
});

describe('synthesis → legacy envelope', () => {
    it('maps a successful run onto the legacy shape', async () => {
        vi.mocked(runAgent1SubAgent).mockResolvedValue(synthesis() as never);

        const result = await runAgent1ViaSubAgents('find gyms', {}, 'fast', { clientId: 'client_001' });

        expect(result.success).toBe(true);
        expect(result.data).toEqual({ target_pack_primary: [{ lead_id: 'lead-1' }] });
        expect(result.metadata?.provider).toBe('gemini');
        expect(result.metadata?.model).toBe('gemini-2.0-flash');
        // 800+400 per sub-agent, two sub-agents
        expect(result.metadata?.tokensUsed).toBe(2400);
    });

    it('keeps partial output when one sub-agent fails', async () => {
        vi.mocked(runAgent1SubAgent).mockResolvedValue(synthesis({
            sub_agent_results: [
                subResult(),
                subResult({
                    sub_agent_id: '1B-scoring-analyst',
                    task_completed: false,
                    result: null,
                    model_used: 'none',
                    escalation_needed: true,
                    escalation_severity: 'P1',
                    escalation_reason: 'scoring failed',
                }),
            ],
            requires_human_attention: true,
            overall_confidence: 'low',
        }) as never);

        const result = await runAgent1ViaSubAgents('find gyms');

        expect(result.success).toBe(true);
        expect(result.sub_agent_telemetry?.requires_human_attention).toBe(true);
        // 'none' is not a real model and must not pollute the metadata
        expect(result.metadata?.model).toBe('gemini-2.0-flash');
    });

    it('fails only when no sub-agent completed', async () => {
        vi.mocked(runAgent1SubAgent).mockResolvedValue(synthesis({
            sub_agent_results: [
                subResult({ task_completed: false, result: null, escalation_reason: 'research failed' }),
                subResult({ sub_agent_id: '1B-scoring-analyst', task_completed: false, result: null, escalation_reason: 'skipped' }),
            ],
        }) as never);

        const result = await runAgent1ViaSubAgents('find gyms');

        expect(result.success).toBe(false);
        expect(result.error?.type).toBe('SUBAGENT_ERROR');
        expect(result.error?.details).toContain('research failed');
    });

    it('exposes measured cost through actualCostOf, and null for legacy results', async () => {
        vi.mocked(runAgent1SubAgent).mockResolvedValue(synthesis() as never);

        const result = await runAgent1ViaSubAgents('find gyms');
        expect(actualCostOf(result)).toBe(0.03);

        expect(actualCostOf({ success: true, data: {} })).toBeNull();
        expect(actualCostOf(null)).toBeNull();
    });
});

describe('sub-agent run persistence', () => {
    it('records every sub-agent run with its client and pipeline run', async () => {
        vi.mocked(runAgent1SubAgent).mockResolvedValue(synthesis() as never);

        await runAgent1ViaSubAgents('find gyms', {}, 'fast', {
            clientId: 'client_001',
            pipelineRunId: 'run_123',
        });

        expect(persistSubAgentRuns).toHaveBeenCalledOnce();
        expect(vi.mocked(persistSubAgentRuns).mock.calls[0][1]).toEqual({
            clientId: 'client_001',
            pipelineRunId: 'run_123',
            pipelineSessionId: undefined,
        });
    });

    it('defaults the client to "unknown" rather than dropping the row', async () => {
        vi.mocked(runAgent1SubAgent).mockResolvedValue(synthesis() as never);

        await runAgent1ViaSubAgents('find gyms');

        expect(vi.mocked(persistSubAgentRuns).mock.calls[0][1].clientId).toBe('unknown');
    });
});

describe('degrading to the legacy path', () => {
    it('Agent 2 falls back when no target pack is supplied', async () => {
        await runAgent2ViaSubAgents('outreach', {});

        expect(runAgent2OutboundAppointment).toHaveBeenCalledOnce();
        expect(runAgent2SubAgent).not.toHaveBeenCalled();
    });

    it('Agent 3 falls back when no qualified lead brief is supplied', async () => {
        await runAgent3ViaSubAgents('proposal', {});

        expect(runAgent3SalesEngineer).toHaveBeenCalledOnce();
        expect(runAgent3SubAgent).not.toHaveBeenCalled();
    });

    it('Agent 4 falls back when no handoff spec is supplied', async () => {
        await runAgent4ViaSubAgents('delivery', {});

        expect(runAgent4SystemsDelivery).toHaveBeenCalledOnce();
        expect(runAgent4SubAgent).not.toHaveBeenCalled();
    });
});

describe('input mapping', () => {
    it('Agent 2 maps context onto MessageArchitectInput and defaults channels', async () => {
        vi.mocked(runAgent2SubAgent).mockResolvedValue(synthesis({ agent_id: 'agent-2-outbound-appointment' }) as never);

        await runAgent2ViaSubAgents('outreach', {
            targetPack: { target_pack_primary: [] },
            offerPositioning: 'ops automation',
            vertical: 'fitness',
        });

        const [input, config] = vi.mocked(runAgent2SubAgent).mock.calls[0];
        expect(input.target_pack).toEqual({ target_pack_primary: [] });
        expect(input.offer_positioning).toBe('ops automation');
        expect(input.channels).toEqual(['email', 'linkedin']);
        expect(config?.vertical).toBe('fitness');
    });

    it('Agent 3 collapses the four legacy modes onto the two 3A modes', async () => {
        vi.mocked(runAgent3SubAgent).mockResolvedValue(synthesis({ agent_id: 'agent-3-sales-engineer' }) as never);

        await runAgent3ViaSubAgents('proposal', {
            qualified_lead_brief: { lead_id: 'lead-1' },
            mode: 'proposal_generation',
        });
        expect(vi.mocked(runAgent3SubAgent).mock.calls[0][0].mode).toBe('discovery_execution');

        await runAgent3ViaSubAgents('prep', {
            qualified_lead_brief: { lead_id: 'lead-1' },
            mode: 'pre_call_prep',
        });
        expect(vi.mocked(runAgent3SubAgent).mock.calls[1][0].mode).toBe('pre_call_prep');
    });

    it('Agent 4 supplies empty tool access when the caller omits it', async () => {
        vi.mocked(runAgent4SubAgent).mockResolvedValue(synthesis({ agent_id: 'agent-4-systems-builder' }) as never);

        await runAgent4ViaSubAgents('delivery', {
            handoffSpec: {
                buildModules: ['intake'],
                integrations: [],
                risks: [],
                definitionOfDone: [],
                topExceptionsToHandle: [],
                auditTrailFieldsRequired: [],
            },
            targetTimelineDays: 14,
        });

        const [input] = vi.mocked(runAgent4SubAgent).mock.calls[0];
        expect(input.client_tools).toEqual({ available: [], restricted: [] });
        expect(input.target_timeline_days).toBe(14);
    });
});
