/**
 * Populate ClientPortfolio from existing ClientConfig rows.
 *
 *   npx tsx scripts/migrate-to-portfolio.ts [--dry-run]
 *
 * ClientConfig is the record of deployed client agents; ClientPortfolio is the
 * commercial view of the same clients (lifecycle stage, retainer, health).
 * Every configured client needs a portfolio row before the admin dashboard can
 * show anything.
 *
 * Idempotent: existing portfolio rows are left untouched, since they carry
 * operator-maintained fields (retainer, stage, health) that a re-run must not
 * reset. Use --dry-run to see what would be created.
 */

import { prisma } from '../lib/prisma';

/** Health seeds the portal already computed, so the dashboard is not all zeros. */
async function healthScoreFor(clientId: string): Promise<number> {
    const stats = await prisma.portalStats.findUnique({ where: { clientId } });
    return stats?.healthScore ?? 0;
}

/**
 * A client whose agent is paused or in maintenance is not simply "active" —
 * mapping those to at_risk surfaces them on the dashboard instead of hiding
 * them among healthy accounts.
 */
function stageForAgentStatus(agentStatus: string): string {
    switch (agentStatus) {
        case 'paused':
        case 'maintenance':
            return 'at_risk';
        default:
            return 'onboarding';
    }
}

async function main(): Promise<void> {
    const dryRun = process.argv.includes('--dry-run');

    const configs = await prisma.clientConfig.findMany();
    if (configs.length === 0) {
        console.log('No ClientConfig rows found — nothing to migrate.');
        return;
    }

    const existing = await prisma.clientPortfolio.findMany({ select: { clientId: true } });
    const alreadyHave = new Set(existing.map(p => p.clientId));

    const toCreate = configs.filter(c => !alreadyHave.has(c.clientId));

    console.log(`ClientConfig rows:      ${configs.length}`);
    console.log(`Already in portfolio:   ${alreadyHave.size}`);
    console.log(`To create:              ${toCreate.length}`);

    if (toCreate.length === 0) {
        console.log('\nPortfolio is already up to date.');
        return;
    }

    for (const config of toCreate) {
        const healthScore = await healthScoreFor(config.clientId);
        const stage = stageForAgentStatus(config.agentStatus);

        const row = {
            clientId: config.clientId,
            stage,
            vertical: config.industry,
            // Retainer is a commercial fact ClientConfig does not carry; it has
            // to be filled in by hand rather than guessed. Left at 0 so it is
            // visibly missing on the dashboard instead of quietly wrong — note
            // that portfolio health is retainer-weighted, so a 0 here excludes
            // the client from the weighting until it is set.
            retainerUsd: 0,
            startDate: config.deployedAt,
            currentHealthScore: healthScore,
            previousHealthScore: healthScore,
            healthTrend: 'stable',
        };

        if (dryRun) {
            console.log(`[dry-run] would create ${config.clientId} (${stage}, health ${healthScore})`);
            continue;
        }

        await prisma.clientPortfolio.create({ data: row });
        console.log(`created ${config.clientId} (${stage}, health ${healthScore})`);
    }

    if (dryRun) {
        console.log('\nDry run — nothing written.');
    } else {
        console.log(`\nCreated ${toCreate.length} portfolio rows.`);
        console.log('Set retainerUsd for each client — portfolio health is retainer-weighted.');
    }
}

main()
    .catch(err => {
        console.error('Migration failed:', err);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
