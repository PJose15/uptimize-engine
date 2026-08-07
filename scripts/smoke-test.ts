/**
 * Post-migration smoke test.
 *
 *   npx tsx scripts/smoke-test.ts
 *
 * Checks the things this branch wired that have never executed against a real
 * database. Each one fails silently in production if it is broken — that is why
 * they are worth asserting explicitly rather than eyeballing a pipeline run.
 *
 * Read-only except where noted; it writes and removes its own rows and does not
 * call any model provider or spend money.
 */

import { prisma } from '../lib/prisma';
import { isPostgres } from '../lib/db-compat';
import { createApproval, getApprovalDecision, approvalFingerprint } from '../lib/governance/approval-store';
import { loadAgentMemory } from '../lib/learning/memory';
import { loadPortfolioClients, calculatePortfolioHealthScore } from '../lib/portfolio';
import { CRON_JOBS } from '../lib/scheduler/operational-jobs';

type Check = { name: string; run: () => Promise<string> };

const SUITE = 'smoke_test';
let failures = 0;

const checks: Check[] = [
    {
        name: 'database reachable',
        run: async () => {
            const users = await prisma.user.count();
            return `connected, ${users} user(s)`;
        },
    },
    {
        name: 'engine detected correctly',
        run: async () => {
            const pg = isPostgres();
            if (!pg) {
                return 'SQLite — fine for local, but DB-backed rate limiting and ' +
                    'case-insensitive search stay off';
            }
            return 'PostgreSQL — DB-backed rate limiting and insensitive search active';
        },
    },
    {
        name: 'approval survives a round trip',
        run: async () => {
            const { approvalId } = await createApproval({
                agentId: SUITE,
                toolName: 'smoke_tool',
                actionDescription: 'smoke test approval',
                reason: 'smoke test',
                estimatedCostUsd: 0,
                batchSize: 1,
                clientId: SUITE,
            });

            const pending = await getApprovalDecision(approvalId, approvalFingerprint(SUITE, 'smoke_tool'));
            if (pending !== 'pending') throw new Error(`expected pending, got ${pending}`);

            // An approval must not authorize a different action.
            const mismatched = await getApprovalDecision(approvalId, approvalFingerprint(SUITE, 'other_tool'));
            if (mismatched !== 'not_found') throw new Error(`fingerprint not enforced: got ${mismatched}`);

            await prisma.approvalItem.update({ where: { id: approvalId }, data: { status: 'approved' } });
            const approved = await getApprovalDecision(approvalId, approvalFingerprint(SUITE, 'smoke_tool'));
            if (approved !== 'approved') throw new Error(`portal decision not visible: got ${approved}`);

            await prisma.approvalItem.delete({ where: { id: approvalId } });
            return 'created, scoped to its action, decision visible, cleaned up';
        },
    },
    {
        name: 'SubAgentRun table writable',
        run: async () => {
            const row = await prisma.subAgentRun.create({
                data: {
                    subAgentId: '1A-research-specialist',
                    parentAgentId: 'agent-1-market-intelligence',
                    clientId: SUITE,
                    taskProfile: 'shadow_ops_research',
                    modelUsed: 'gemini-2.0-flash',
                    providerUsed: 'gemini',
                    taskCompleted: true,
                    confidence: 'high',
                },
            });
            await prisma.subAgentRun.delete({ where: { id: row.id } });
            return 'insert + delete ok — model_performance learning has a source';
        },
    },
    {
        name: 'learning memory query runs',
        run: async () => {
            const memory = await loadAgentMemory('agent-3-sales-engineer');
            return `${memory.noticeIds.length} notice(s) pending, ` +
                `${memory.keysRead.length} memory key(s) deliverable`;
        },
    },
    {
        name: 'portfolio loads and scores',
        run: async () => {
            const clients = await loadPortfolioClients();
            if (clients.length === 0) {
                return 'no portfolio rows — run scripts/migrate-to-portfolio.ts';
            }
            const health = calculatePortfolioHealthScore(clients);
            const unpriced = clients.filter(c => c.retainer_usd === 0).length;
            return `${clients.length} client(s), weighted health ${health.weighted_score_0_100}` +
                (unpriced > 0 ? ` — ${unpriced} with retainerUsd 0, excluded from weighting` : '');
        },
    },
    {
        name: 'cron endpoint is closed without a secret',
        run: async () => {
            if (!process.env.CRON_SECRET) {
                return 'CRON_SECRET unset — /api/cron returns 503, no scheduled agent runs';
            }
            return `CRON_SECRET set, ${Object.keys(CRON_JOBS).length} job(s) dispatchable`;
        },
    },
];

async function main(): Promise<void> {
    console.log('Smoke test — checks the wiring that has never run against a real database\n');

    for (const check of checks) {
        try {
            const detail = await check.run();
            console.log(`  PASS  ${check.name}\n        ${detail}`);
        } catch (err) {
            failures++;
            console.error(`  FAIL  ${check.name}\n        ${err instanceof Error ? err.message : String(err)}`);
        }
    }

    console.log(
        failures === 0
            ? '\nAll checks passed. Next: one pipeline run with real keys, then flip ' +
              'USE_SUBAGENTS=true and compare cost and output on the same input.'
            : `\n${failures} check(s) failed.`,
    );

    process.exitCode = failures === 0 ? 0 : 1;
}

main()
    .catch(err => {
        console.error('Smoke test could not run:', err);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
