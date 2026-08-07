/**
 * V2 Operational Cron Schedules
 *
 * Cron expressions are UTC — that is what Vercel Cron evaluates them in. The
 * comments give the intended America/Puerto_Rico local time (UTC-4 year round;
 * PR does not observe DST, so these do not drift seasonally).
 *
 * CRON_JOBS below is the registry the /api/cron/[job] route dispatches from.
 * A schedule with no registry entry never runs, so the two are kept together.
 */

export const AGENT_SCHEDULES = {
  AGENT13_DAILY:       '30 10 * * 1-5',  // 6:30 AM PR weekdays
  AGENT9_WEEKLY:       '0 11 * * 1',     // 7:00 AM PR Monday
  AGENT11_DAILY:       '30 11 * * 1-5',  // 7:30 AM PR weekdays
  AGENT12_DAILY:       '0 12 * * 1-5',   // 8:00 AM PR weekdays
  AGENT10_WEEKLY:      '0 12 * * 0',     // 8:00 AM PR Sunday
  AGENT8_WEEKLY:       '0 3 * * 1',      // 11:00 PM PR Sunday
  AGENT8_LEARNING:     '0 5 * * *',      // 1:00 AM PR daily
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
  const { expireStaleApprovals } = await import('@/lib/governance/approval-store');

  await prisma.rateLimitEntry.deleteMany({ where: { resetAt: { lt: new Date() } } });

  // Single definition of the expiry rule, shared with the gate's own check —
  // otherwise the sweep and the gate could disagree about what has lapsed.
  const expired = await expireStaleApprovals();
  if (expired > 0) console.log(`[cron maintenance] expired ${expired} stale approvals`);
}

export async function runAgent8LearningQueue(): Promise<void> {
  // Promotes LearningEvent rows into AgentLearning with confidence labels and
  // creates distribution notices. Distinct from the weekly brief, which only
  // reports on events and promotes nothing — without this job, collected
  // learning accumulates unprocessed forever.
  const { processLearningQueue } = await import('@/app/api/agents/run/uptimize/agent-8-intelligence/worker');
  const summary = await processLearningQueue();
  console.log('[cron agent-8] learning queue:', summary);
}

export async function runApprovalExpiry(): Promise<void> {
  const { expireStaleApprovals } = await import('@/lib/governance/approval-store');
  const expired = await expireStaleApprovals();
  if (expired > 0) console.log(`[cron approval-expiry] expired ${expired} stale approvals`);
}

// ============================================================================
// CRON JOB REGISTRY
// ============================================================================

export interface CronJob {
  /** Cron expression, UTC */
  schedule: string;
  /** What this job does, for the route's listing */
  description: string;
  run: () => Promise<void>;
}

/**
 * Every job the cron route can dispatch, keyed by the slug used in the URL:
 * GET /api/cron/<slug>. vercel.json must reference these same slugs.
 */
export const CRON_JOBS: Record<string, CronJob> = {
  'agent-13-daily-brief': {
    schedule: AGENT_SCHEDULES.AGENT13_DAILY,
    description: 'Agent 13 — daily internal ops brief',
    run: runAgent13DailyBrief,
  },
  'agent-9-weekly-portfolio': {
    schedule: AGENT_SCHEDULES.AGENT9_WEEKLY,
    description: 'Agent 9 — weekly portfolio and revenue review',
    run: runAgent9WeeklyPortfolio,
  },
  'agent-11-daily-bd': {
    schedule: AGENT_SCHEDULES.AGENT11_DAILY,
    description: 'Agent 11 — daily business development digest',
    run: runAgent11DailyBD,
  },
  'agent-12-daily-compliance': {
    schedule: AGENT_SCHEDULES.AGENT12_DAILY,
    description: 'Agent 12 — daily compliance and invoicing sweep',
    run: runAgent12DailyCompliance,
  },
  'agent-10-weekly-content': {
    schedule: AGENT_SCHEDULES.AGENT10_WEEKLY,
    description: 'Agent 10 — weekly content drafting',
    run: runAgent10WeeklyContent,
  },
  'agent-8-weekly-brief': {
    schedule: AGENT_SCHEDULES.AGENT8_WEEKLY,
    description: 'Agent 8 — weekly intelligence brief',
    run: runAgent8WeeklyBrief,
  },
  'agent-8-learning-queue': {
    schedule: AGENT_SCHEDULES.AGENT8_LEARNING,
    description: 'Agent 8 — promote collected learning events',
    run: runAgent8LearningQueue,
  },
  'maintenance': {
    schedule: AGENT_SCHEDULES.RATE_LIMIT_CLEANUP,
    description: 'Rate limit cleanup and approval expiry',
    run: runMaintenanceTasks,
  },
  'approval-expiry': {
    schedule: AGENT_SCHEDULES.APPROVAL_EXPIRY,
    description: 'Expire approvals nobody decided in time',
    run: runApprovalExpiry,
  },
};

export type CronJobName = keyof typeof CRON_JOBS;
