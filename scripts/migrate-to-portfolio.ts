/**
 * One-shot migration: populate ClientPortfolio rows from existing ClientConfig.
 *
 * Idempotent: clients that already have a ClientPortfolio row are skipped.
 * Pedro fills in retainerUsd / weeklyHoursEstimate / stage manually after migration.
 *
 * Run: npx tsx scripts/migrate-to-portfolio.ts
 */

import { prisma } from '../lib/prisma';

async function main() {
  console.log('=== migrate-to-portfolio ===\n');

  const configs = await prisma.clientConfig.findMany({
    select: { clientId: true, name: true, company: true, industry: true },
  });
  console.log(`Found ${configs.length} ClientConfig rows`);

  if (configs.length === 0) {
    console.log('Nothing to migrate.');
    return;
  }

  const existing = await prisma.clientPortfolio.findMany({
    where: { clientId: { in: configs.map(c => c.clientId) } },
    select: { clientId: true },
  });
  const existingIds = new Set(existing.map(e => e.clientId));
  console.log(`${existingIds.size} clients already have a ClientPortfolio row (will skip)`);

  const toCreate = configs.filter(c => !existingIds.has(c.clientId));
  console.log(`Creating ${toCreate.length} new ClientPortfolio rows\n`);

  let created = 0;
  for (const cfg of toCreate) {
    await prisma.clientPortfolio.create({
      data: {
        clientId: cfg.clientId,
        stage: 'active',
        vertical: cfg.industry || '',
        retainerUsd: 0,
        weeklyHoursEstimate: 0,
        currentHealthScore: 0,
        previousHealthScore: 0,
        healthTrend: 'stable',
        expansionReady: false,
        hasOpenAlert: false,
      },
    });
    console.log(`  + ${cfg.clientId}  ${cfg.name || cfg.company}  [${cfg.industry || '-'}]`);
    created++;
  }

  console.log(`\nDone. Created ${created}, skipped ${existingIds.size}.`);
  console.log('Next: edit each row in admin to set retainerUsd, weeklyHoursEstimate, and stage.');
}

main()
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
