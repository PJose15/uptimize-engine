/**
 * V2 Operational Cron Schedules — America/Puerto_Rico timezone (UTC-4)
 */

export const AGENT_SCHEDULES = {
  AGENT13_DAILY:       '30 10 * * 1-5',  // 6:30 AM PR weekdays
  AGENT9_WEEKLY:       '0 11 * * 1',     // 7:00 AM PR Monday
  AGENT11_DAILY:       '30 11 * * 1-5',  // 7:30 AM PR weekdays
  AGENT12_DAILY:       '0 12 * * 1-5',   // 8:00 AM PR weekdays
  AGENT10_WEEKLY:      '0 12 * * 0',     // 8:00 AM PR Sunday
  AGENT8_WEEKLY:       '0 3 * * 1',      // 11:00 PM PR Sunday
  RATE_LIMIT_CLEANUP:  '0 7 * * *',      // 3:00 AM PR daily
  APPROVAL_EXPIRY:     '0 * * * *',      // Hourly
} as const;

// ============================================================================
// OPERATIONAL AGENT RUNNERS (Sprint 13)
// ============================================================================

export async function runAgent13DailyBrief(): Promise<void> {
  const { runDailyBrief } = await import('@/app/api/agents/run/operational/agent-13-internal-ops/worker');
  const summary = await runDailyBrief();
  console.log('[cron agent-13] daily brief:', summary);
}

export async function runAgent9WeeklyPortfolio(): Promise<void> {
  const { runAgent9WeeklyPortfolio: runner } = await import('@/app/api/agents/run/operational/agent-9-revenue-intelligence/worker');
  const summary = await runner();
  console.log('[cron agent-9] weekly portfolio:', summary);
}

export async function runAgent11DailyBD(): Promise<void> {
  const { runAgent11DailyBD: runner } = await import('@/app/api/agents/run/operational/agent-11-business-development/worker');
  const summary = await runner();
  console.log('[cron agent-11] daily BD:', summary);
}

export async function runAgent12DailyCompliance(): Promise<void> {
  const { runDailyCompliance } = await import('@/app/api/agents/run/operational/agent-12-compliance/worker');
  const summary = await runDailyCompliance();
  console.log('[cron agent-12] daily compliance:', summary);
}

export async function runAgent10WeeklyContent(): Promise<void> {
  const { runAgent10WeeklyContent: runner } = await import('@/app/api/agents/run/operational/agent-10-content/worker');
  const summary = await runner();
  console.log('[cron agent-10] weekly content:', summary);
}

export async function runAgent8WeeklyBrief(): Promise<void> {
  const { generateWeeklyBrief } = await import('@/app/api/agents/run/uptimize/agent-8-intelligence/worker');
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const result = await generateWeeklyBrief(weekStart.toISOString().split('T')[0]);
  console.log('[cron agent-8] weekly brief:', { brief: !!result.brief, cost: result.cost_usd });
}

export async function runMaintenanceTasks(): Promise<void> {
  const { prisma } = await import('@/lib/prisma');
  await prisma.rateLimitEntry.deleteMany({ where: { resetAt: { lt: new Date() } } });
  await prisma.approvalItem.updateMany({
    where: { status: 'pending', timestamp: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    data: { status: 'expired' },
  });
}
