// @vitest-environment node
/**
 * Learning consumption — the last stage of the pipeline.
 *
 * Three separate breaks had to close for this to deliver anything, and each
 * failed silently on its own: notices were consumed on read (so a failed run
 * destroyed the learning), learning keys did not match the memory-key
 * vocabulary the sub-agent filter enforces, and no sub-agent read
 * `memory_context` at all.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

interface DistRow {
    id: string;
    targetAgentId: string;
    delivered: boolean;
    effectiveFrom: Date;
    agentLearning: {
        learningType: string;
        key: string;
        value: string;
        vertical: string;
        confidence: number;
        label: string;
    };
}

const distributions: DistRow[] = [];
const memoryLogs: Array<Record<string, unknown>> = [];

vi.mock('@/lib/prisma', () => ({
    prisma: {
        learningDistribution: {
            findMany: vi.fn(async ({ where, take }: {
                where: { targetAgentId: string; delivered: boolean; effectiveFrom?: { lte: Date } };
                take?: number;
            }) =>
                distributions
                    .filter(d =>
                        d.targetAgentId === where.targetAgentId &&
                        d.delivered === where.delivered &&
                        (!where.effectiveFrom || d.effectiveFrom <= where.effectiveFrom.lte),
                    )
                    .slice(0, take ?? 50),
            ),
            updateMany: vi.fn(async ({ where }: { where: { id: { in: string[] } } }) => {
                let count = 0;
                for (const row of distributions) {
                    if (where.id.in.includes(row.id)) { row.delivered = true; count++; }
                }
                return { count };
            }),
        },
        agentMemoryLog: {
            create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
                memoryLogs.push(data);
                return data;
            }),
        },
    },
}));

import { loadAgentMemory, commitAgentMemory, memoryKeyFor } from '@/lib/learning/memory';
import { peekPendingNotices, markNoticesDelivered } from '@/lib/learning/distribution';
import { withMemoryContext, filterMemoryForSubAgent, SUBAGENT_MEMORY_KEYS, memoryKeysForParentAgent } from '@/lib/subagent/context-builder';

function notice(overrides: Partial<DistRow> & { learning?: Partial<DistRow['agentLearning']> } = {}): DistRow {
    const { learning, ...rest } = overrides;
    return {
        id: `d${distributions.length + 1}`,
        targetAgentId: 'agent-3-sales-engineer',
        delivered: false,
        effectiveFrom: new Date(Date.now() - 1000),
        agentLearning: {
            learningType: 'money_leak',
            key: 'pillar_finding',
            value: 'Shadow ops averaged $12k/mo in fitness',
            vertical: 'fitness',
            confidence: 0.8,
            label: 'validated',
            ...learning,
        },
        ...rest,
    };
}

beforeEach(() => {
    distributions.length = 0;
    memoryLogs.length = 0;
    vi.clearAllMocks();
});

describe('reading does not consume', () => {
    it('leaves notices pending after a peek', async () => {
        distributions.push(notice());

        const first = await peekPendingNotices('agent-3-sales-engineer');
        const second = await peekPendingNotices('agent-3-sales-engineer');

        // A failed run must not destroy learning it never got to use.
        expect(first).toHaveLength(1);
        expect(second).toHaveLength(1);
    });

    it('consumes only when explicitly acknowledged', async () => {
        distributions.push(notice());

        const pending = await peekPendingNotices('agent-3-sales-engineer');
        await markNoticesDelivered(pending.map(n => n.id));

        expect(await peekPendingNotices('agent-3-sales-engineer')).toHaveLength(0);
    });

    it('withholds notices scheduled for the future', async () => {
        distributions.push(notice({ effectiveFrom: new Date(Date.now() + 60_000) }));

        expect(await peekPendingNotices('agent-3-sales-engineer')).toHaveLength(0);
    });
});

describe('learning key → memory key', () => {
    it('maps onto keys sub-agents are actually permitted to read', () => {
        const key = memoryKeyFor('money_leak', 'pillar_finding');
        expect(key).toBe('shared:money_leak_map');

        // The whole point: an unmapped key would be filtered out and lost.
        expect(SUBAGENT_MEMORY_KEYS['3A-discovery-conductor']).toContain(key);
    });

    it('returns null for a learning with no destination', () => {
        expect(memoryKeyFor('unknown_type', 'whatever')).toBeNull();
    });

    // The check that matters is per receiving agent, not global. An earlier
    // version asserted only that a target was readable by SOME sub-agent, which
    // passed while five of the ten real distribution routes resolved to keys the
    // targeted agent could not read — consuming those notices and dropping them.
    it('every real distribution route resolves to a key its target agent can read', async () => {
        const { LEARNING_DISTRIBUTION_MAP } = await import('@/lib/learning/distribution');

        for (const [route, targets] of Object.entries(LEARNING_DISTRIBUTION_MAP)) {
            const [learningType, key] = route.split(':');

            for (const agentId of targets) {
                const resolved = memoryKeyFor(learningType, key, agentId);
                expect(resolved, `${route} → ${agentId} resolves to nothing deliverable`).not.toBeNull();
                expect(
                    memoryKeysForParentAgent(agentId),
                    `${route} → ${agentId} maps to ${resolved}, which it cannot read`,
                ).toContain(resolved);
            }
        }
    });

    it('withholds rather than consumes when a key is unreadable by the target', () => {
        // Agent 6 has no money-leak key; without the per-agent override this
        // would resolve to shared:money_leak_map and be silently dropped.
        expect(memoryKeyFor('money_leak:value_estimate'.split(':')[0], 'value_estimate', 'agent-6-closer'))
            .toBe('agent6:proposal');

        // A route with no override and no readable default is withheld.
        expect(memoryKeyFor('integration_quirk', 'issue', 'agent-6-closer')).toBeNull();
    });
});

describe('loadAgentMemory', () => {
    it('groups several learnings under one memory key', async () => {
        distributions.push(
            notice({ learning: { value: 'Finding A' } }),
            notice({ id: 'd2', learning: { value: 'Finding B' } }),
        );

        const memory = await loadAgentMemory('agent-3-sales-engineer');

        expect(Object.keys(memory.entries)).toEqual(['shared:money_leak_map']);
        expect(memory.entries['shared:money_leak_map']).toContain('Finding A');
        expect(memory.entries['shared:money_leak_map']).toContain('Finding B');
        expect(memory.noticeIds).toEqual(['d1', 'd2']);
    });

    it('carries confidence and label so a hint is not read as a fact', async () => {
        distributions.push(notice({ learning: { confidence: 0.4, label: 'emerging' } }));

        const memory = await loadAgentMemory('agent-3-sales-engineer');

        expect(memory.entries['shared:money_leak_map']).toContain('emerging');
        expect(memory.entries['shared:money_leak_map']).toContain('40%');
    });

    it('skips unmapped learnings without consuming them', async () => {
        distributions.push(notice({ learning: { learningType: 'model_performance', key: 'latency' } }));

        const memory = await loadAgentMemory('agent-3-sales-engineer');

        expect(memory.entries).toEqual({});
        // Not in noticeIds, so it is never marked delivered — withheld, not lost.
        expect(memory.noticeIds).toEqual([]);
    });

    it('returns empty when the agent has nothing waiting', async () => {
        const memory = await loadAgentMemory('agent-1-market-intelligence');
        expect(memory).toEqual({ entries: {}, noticeIds: [], keysRead: [] });
    });
});

describe('commitAgentMemory', () => {
    it('marks notices delivered and records what was read', async () => {
        distributions.push(notice());
        const memory = await loadAgentMemory('agent-3-sales-engineer');

        await commitAgentMemory(memory, { clientId: 'client_001', agentId: 'agent-3-sales-engineer', pipelineRunId: 'run_1' });

        expect(await peekPendingNotices('agent-3-sales-engineer')).toHaveLength(0);
        expect(memoryLogs).toHaveLength(1);
        expect(JSON.parse(memoryLogs[0].memoriesRead as string)).toEqual(['shared:money_leak_map']);
    });

    it('does nothing when there was no memory to begin with', async () => {
        await commitAgentMemory({ entries: {}, noticeIds: [], keysRead: [] }, { clientId: 'c', agentId: 'a' });
        expect(memoryLogs).toHaveLength(0);
    });
});

describe('delivery into the prompt', () => {
    it('survives the sub-agent memory filter end to end', async () => {
        distributions.push(notice());
        const memory = await loadAgentMemory('agent-3-sales-engineer');

        const filtered = filterMemoryForSubAgent(
            memory.entries,
            SUBAGENT_MEMORY_KEYS['3A-discovery-conductor'],
        );

        // Before the mapping existed this came back empty — the notice was
        // consumed and then silently dropped here.
        expect(filtered).toContain('Shadow ops averaged $12k/mo');
    });

    it('prepends learned context to the prompt', () => {
        const prompt = withMemoryContext('DO THE TASK', '[shared:money_leak_map]: something learned');

        expect(prompt).toContain('LEARNED CONTEXT FROM PREVIOUS RUNS');
        expect(prompt).toContain('something learned');
        expect(prompt).toContain('DO THE TASK');
        expect(prompt.indexOf('something learned')).toBeLessThan(prompt.indexOf('DO THE TASK'));
    });

    it('leaves the prompt untouched when there is no memory', () => {
        expect(withMemoryContext('DO THE TASK', '')).toBe('DO THE TASK');
        expect(withMemoryContext('DO THE TASK', '   ')).toBe('DO THE TASK');
    });
});
