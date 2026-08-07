// @vitest-environment node
/**
 * Governance enforcement.
 *
 * The behaviour that matters here is negative: an action that is denied or
 * awaiting approval must NOT have run. These tests assert on whether the
 * executor was invoked, not just on the returned status.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const approvalRows = new Map<string, { id: string; status: string; timestamp: Date }>();
let nextId = 1;

vi.mock('@/lib/prisma', () => ({
    prisma: {
        approvalItem: {
            create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
                const row = { id: `apr_${nextId++}`, status: 'pending', timestamp: new Date(), ...data };
                approvalRows.set(row.id, row as never);
                return row;
            }),
            findUnique: vi.fn(async ({ where }: { where: { id: string } }) => approvalRows.get(where.id) ?? null),
            updateMany: vi.fn(async () => ({ count: 0 })),
        },
    },
}));

vi.mock('@/lib/portal-events', () => ({
    logAuditEntry: vi.fn(async () => {}),
}));

import { withGovernance, enforceGovernance, GovernanceError } from '@/lib/governance/enforce';
import { PermissionLevel, getPermissionChecker } from '@/lib/governance/tool-permissions';
import { APPROVAL_TTL_MS } from '@/lib/governance/approval-store';

beforeEach(() => {
    approvalRows.clear();
    nextId = 1;
    vi.clearAllMocks();
});

describe('permitted actions', () => {
    it('runs a READ tool the agent is allowed to use', async () => {
        const execute = vi.fn(async () => 'results');

        const outcome = await withGovernance(
            { agentId: 'agent1', toolName: 'web_search', level: PermissionLevel.READ },
            execute,
        );

        expect(outcome).toEqual({ status: 'executed', value: 'results' });
        expect(execute).toHaveBeenCalledOnce();
    });
});

describe('denied actions do not execute', () => {
    it('blocks a tool that is not in the agent\'s allow list', async () => {
        const execute = vi.fn(async () => 'sent');

        const outcome = await withGovernance(
            { agentId: 'agent1', toolName: 'send_email', level: PermissionLevel.EXECUTE },
            execute,
        );

        expect(outcome.status).toBe('denied');
        expect(execute).not.toHaveBeenCalled();
    });

    it('blocks an unknown agent by default', async () => {
        const execute = vi.fn(async () => 'x');

        const outcome = await withGovernance(
            { agentId: 'agent_does_not_exist', toolName: 'web_search', level: PermissionLevel.READ },
            execute,
        );

        expect(outcome.status).toBe('denied');
        expect((outcome as { reason: string }).reason).toContain('Unknown agent');
        expect(execute).not.toHaveBeenCalled();
    });

    // Note a policy inconsistency inherited from the permission checker: for an
    // over-limit batch or cost it returns allowed:false WITH requires_approval:
    // true, i.e. "not on your own authority — ask a human". checkGate tests
    // `allowed` first, so the request is refused outright and never reaches the
    // approval queue. Both fail closed, so this is safe either way; documented
    // here so the stricter reading is a deliberate choice rather than a
    // surprise if someone later expects an escalation.
    it('blocks a batch larger than the agent\'s limit', async () => {
        const execute = vi.fn(async () => 'x');

        const outcome = await withGovernance(
            { agentId: 'agent1', toolName: 'web_search', level: PermissionLevel.READ, batchSize: 5000 },
            execute,
        );

        expect(outcome.status).toBe('denied');
        expect(execute).not.toHaveBeenCalled();
    });

    it('blocks an action costing more than the agent\'s per-action limit', async () => {
        const execute = vi.fn(async () => 'x');

        const outcome = await withGovernance(
            { agentId: 'agent1', toolName: 'web_search', level: PermissionLevel.READ, estimatedCostUsd: 999 },
            execute,
        );

        expect(outcome.status).toBe('denied');
        expect(execute).not.toHaveBeenCalled();
    });
});

describe('actions requiring approval', () => {
    it('queues instead of executing, and returns a durable approval id', async () => {
        const execute = vi.fn(async () => 'contact created');

        const outcome = await withGovernance(
            { agentId: 'agent2', toolName: 'create_crm_contact', level: PermissionLevel.WRITE_EXTERNAL },
            execute,
        );

        expect(outcome.status).toBe('awaiting_approval');
        expect(execute).not.toHaveBeenCalled();

        const approvalId = (outcome as { approvalId: string }).approvalId;
        // The id must be the ApprovalItem row id, or the portal's decision can
        // never be matched back to the queued action.
        expect(approvalRows.has(approvalId)).toBe(true);
    });

    it('executes once the row is approved and the id is presented again', async () => {
        const execute = vi.fn(async () => 'contact created');
        const action = {
            agentId: 'agent2',
            toolName: 'create_crm_contact',
            level: PermissionLevel.WRITE_EXTERNAL,
        };

        const first = await withGovernance(action, execute);
        const approvalId = (first as { approvalId: string }).approvalId;
        expect(execute).not.toHaveBeenCalled();

        approvalRows.get(approvalId)!.status = 'approved';

        const second = await withGovernance({ ...action, approvalId }, execute);

        expect(second).toEqual({ status: 'executed', value: 'contact created' });
        expect(execute).toHaveBeenCalledOnce();
    });

    it('stays blocked when the row was denied', async () => {
        const execute = vi.fn(async () => 'contact created');
        const action = {
            agentId: 'agent2',
            toolName: 'create_crm_contact',
            level: PermissionLevel.WRITE_EXTERNAL,
        };

        const first = await withGovernance(action, execute);
        const approvalId = (first as { approvalId: string }).approvalId;
        approvalRows.get(approvalId)!.status = 'denied';

        const second = await withGovernance({ ...action, approvalId }, execute);

        expect(second.status).toBe('denied');
        expect(execute).not.toHaveBeenCalled();
    });

    it('treats a lapsed pending row as expired even before the sweep runs', async () => {
        const execute = vi.fn(async () => 'contact created');
        const action = {
            agentId: 'agent2',
            toolName: 'create_crm_contact',
            level: PermissionLevel.WRITE_EXTERNAL,
        };

        const first = await withGovernance(action, execute);
        const approvalId = (first as { approvalId: string }).approvalId;

        const row = approvalRows.get(approvalId)!;
        row.timestamp = new Date(Date.now() - APPROVAL_TTL_MS - 1000);

        const second = await withGovernance({ ...action, approvalId }, execute);

        expect(second.status).toBe('denied');
        expect((second as { reason: string }).reason).toContain('expired');
        expect(execute).not.toHaveBeenCalled();
    });

    it('reuses the pending row instead of queueing a duplicate on retry', async () => {
        const execute = vi.fn(async () => 'x');
        const action = {
            agentId: 'agent2',
            toolName: 'create_crm_contact',
            level: PermissionLevel.WRITE_EXTERNAL,
        };

        const first = await withGovernance(action, execute);
        const approvalId = (first as { approvalId: string }).approvalId;

        await withGovernance({ ...action, approvalId }, execute);
        await withGovernance({ ...action, approvalId }, execute);

        expect(approvalRows.size).toBe(1);
    });
});

describe('enforceGovernance', () => {
    it('returns the value when permitted', async () => {
        const value = await enforceGovernance(
            { agentId: 'agent1', toolName: 'web_search', level: PermissionLevel.READ },
            async () => 42,
        );
        expect(value).toBe(42);
    });

    it('throws with the approval id when queued', async () => {
        const execute = vi.fn(async () => 'x');

        await expect(
            enforceGovernance(
                { agentId: 'agent2', toolName: 'create_crm_contact', level: PermissionLevel.WRITE_EXTERNAL },
                execute,
            ),
        ).rejects.toThrow(GovernanceError);

        expect(execute).not.toHaveBeenCalled();
    });

    it('marks the error as awaiting approval so a caller can retry with the id', async () => {
        let caught: GovernanceError | null = null;
        try {
            await enforceGovernance(
                { agentId: 'agent2', toolName: 'create_crm_contact', level: PermissionLevel.WRITE_EXTERNAL },
                async () => 'x',
            );
        } catch (err) {
            caught = err as GovernanceError;
        }

        expect(caught?.awaitingApproval).toBe(true);
        expect(caught?.approvalId).toBeDefined();
    });
});

describe('permission matrix coverage', () => {
    it('registers all 13 agents so none fails merely for being unknown', () => {
        const ids = getPermissionChecker().listAgents().map(a => a.agent_id);

        for (let n = 1; n <= 13; n++) {
            expect(ids).toContain(`agent${n}`);
        }
    });
});
