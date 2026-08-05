// @vitest-environment node
/**
 * Learning collection idempotency.
 *
 * Duplicate LearningEvent rows are not merely redundant: confidence scoring
 * counts data points, so the same observation recorded twice reads as
 * independent corroboration and pushes a learning toward "validated".
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

interface Row { id: string; sourceAgentId: string; sourceRunId: string | null }

const events: Row[] = [];
let nextId = 1;

vi.mock('@/lib/prisma', () => ({
    prisma: {
        learningEvent: {
            create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
                const row = { id: `ev_${nextId++}`, ...data } as unknown as Row;
                events.push(row);
                return row;
            }),
            findFirst: vi.fn(async ({ where }: { where: { sourceAgentId: string; sourceRunId: string } }) =>
                events.find(e => e.sourceAgentId === where.sourceAgentId && e.sourceRunId === where.sourceRunId) ?? null,
            ),
        },
    },
}));

import { hasCollectedFor } from '@/lib/learning/idempotency';
import { collectFromAgent3 } from '@/lib/learning/collectors/from-agent3';

const AGENT_3_OUTPUT = {
    vertical: 'fitness',
    pillar_findings: [
        { pillar: 'shadow_ops', estimated_usd: 12000 },
        { pillar: 'exceptions', estimated_usd: 4000 },
    ],
};

beforeEach(() => {
    events.length = 0;
    nextId = 1;
    vi.clearAllMocks();
});

describe('hasCollectedFor', () => {
    it('is false before anything is collected', async () => {
        expect(await hasCollectedFor('agent-3-sales-engineer', 'run_1')).toBe(false);
    });

    it('is false without a run id, since there is nothing to key on', async () => {
        events.push({ id: 'ev_0', sourceAgentId: 'agent-3-sales-engineer', sourceRunId: null });
        expect(await hasCollectedFor('agent-3-sales-engineer', '')).toBe(false);
    });
});

describe('collector guards', () => {
    it('collects on the first call', async () => {
        const ids = await collectFromAgent3(AGENT_3_OUTPUT, 'run_1');
        expect(ids).toHaveLength(2);
        expect(events).toHaveLength(2);
    });

    it('does not collect twice for the same run', async () => {
        await collectFromAgent3(AGENT_3_OUTPUT, 'run_1');
        const second = await collectFromAgent3(AGENT_3_OUTPUT, 'run_1');

        expect(second).toEqual([]);
        expect(events).toHaveLength(2);
    });

    it('still collects for a different run', async () => {
        await collectFromAgent3(AGENT_3_OUTPUT, 'run_1');
        await collectFromAgent3(AGENT_3_OUTPUT, 'run_2');

        expect(events).toHaveLength(4);
    });

    it('does not suppress a different agent on the same run', async () => {
        await collectFromAgent3(AGENT_3_OUTPUT, 'run_1');
        expect(await hasCollectedFor('agent-4-systems-builder', 'run_1')).toBe(false);
    });
});
