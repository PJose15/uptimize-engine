/**
 * Agent 13 Worker — runs the daily 6:30 AM PR briefing job.
 *
 * Source: UPTIMIZE_OPERATIONAL_AGENTS_COMPLETE.md (Agent 13)
 */

import { prisma } from '@/lib/prisma';
import { runAgent13InternalOperations } from './agent';
import type {
  Agent13Input,
  CommitmentView,
  CommitmentPriority,
  CommitmentToType,
  CommitmentStatus,
  Agent13ExternalAlerts,
} from './types';

function daysOverdue(due: Date): number {
  const ms = Date.now() - due.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function asPriority(s: string): CommitmentPriority {
  return (s === 'P1' || s === 'P2' || s === 'P3' || s === 'P4') ? s : 'P3';
}
function asToType(s: string): CommitmentToType {
  return (s === 'client' || s === 'partner' || s === 'prospect' || s === 'team') ? s : 'client';
}
function asStatus(s: string): CommitmentStatus {
  return (s === 'open' || s === 'completed' || s === 'deferred') ? s : 'open';
}

export interface DailyBriefSummary {
  brief_date: string;
  calls_today: number;
  open_commitments: number;
  is_overloaded: boolean;
  cost_usd: number;
  generated_at: string;
}

/**
 * Cron-driven entry. Runs daily at 6:30 AM PR time.
 */
export async function runDailyBrief(briefDate?: string): Promise<DailyBriefSummary> {
  const today = briefDate ?? new Date().toISOString().split('T')[0];

  // Pull open commitments
  const dbCommitments = await prisma.commitment.findMany({
    where: { status: 'open' },
    orderBy: { dueDate: 'asc' },
    take: 100,
  });

  const open_commitments: CommitmentView[] = dbCommitments.map(c => {
    const due = c.dueDate;
    const overdue = daysOverdue(due);
    return {
      id: c.id,
      description: c.description,
      committed_to: c.committedTo,
      committed_to_type: asToType(c.committedToType),
      due_date: due.toISOString(),
      status: asStatus(c.status),
      priority: asPriority(c.priority),
      source: c.source,
      days_overdue: overdue > 0 ? overdue : undefined,
    };
  });

  // External alerts (best-effort — degrade if any source is unavailable)
  const externalAlerts = await collectExternalAlerts();

  const input: Agent13Input = {
    trigger: 'daily_brief',
    date: today,
    scheduled_calls: [], // No calendar integration yet — populated by external system
    open_commitments,
    external_alerts: externalAlerts,
  };

  const synthesis = await runAgent13InternalOperations(input);

  return {
    brief_date: today,
    calls_today: synthesis.final_output.calendar.calendar_summary.calls_today_count,
    open_commitments: synthesis.final_output.deliverables.open_commitments.length,
    is_overloaded: synthesis.final_output.daily_brief.is_overloaded,
    cost_usd: synthesis.total_cost_usd,
    generated_at: synthesis.final_output.generated_at,
  };
}

async function collectExternalAlerts(): Promise<Agent13ExternalAlerts> {
  const alerts: Agent13ExternalAlerts = {};

  try {
    const overdueInvoices = await prisma.invoice.count({ where: { paymentStatus: 'overdue' } });
    const healthDrops = await prisma.clientPortfolio.count({
      where: { stage: 'active', currentHealthScore: { lt: 60 } },
    });
    if (overdueInvoices > 0 || healthDrops > 0) {
      alerts.revenue = {
        overdue_invoices: overdueInvoices,
        health_drops: healthDrops,
        notes: [
          ...(overdueInvoices > 0 ? [`${overdueInvoices} overdue invoice(s)`] : []),
          ...(healthDrops > 0 ? [`${healthDrops} client(s) at risk (health < 60)`] : []),
        ],
      };
    }
  } catch (err) {
    console.error('[agent-13 worker] revenue alerts failed:', err);
  }

  try {
    const expiringSoon = await prisma.complianceRecord.count({
      where: {
        status: 'active',
        expiryDate: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          gte: new Date(),
        },
      },
    });
    const baaPending = await prisma.complianceRecord.count({
      where: { requiresBAA: true, baaSignedAt: null },
    });
    if (expiringSoon > 0 || baaPending > 0) {
      alerts.compliance = {
        renewals_approaching: expiringSoon,
        baa_pending: baaPending,
        notes: [
          ...(expiringSoon > 0 ? [`${expiringSoon} renewal(s) within 30 days`] : []),
          ...(baaPending > 0 ? [`${baaPending} pending BAA signature(s)`] : []),
        ],
      };
    }
  } catch (err) {
    console.error('[agent-13 worker] compliance alerts failed:', err);
  }

  try {
    const stalled = await prisma.bDRecord.count({
      where: {
        currentStage: { in: ['contacted', 'meeting_scheduled', 'proposal_sent', 'negotiating'] },
        OR: [
          { nextActionDue: { lt: new Date() } },
          { lastContact: { lt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } },
        ],
      },
    });
    if (stalled > 0) {
      alerts.bd = {
        stalled_prospects: stalled,
        new_referrals: 0,
        notes: [`${stalled} BD prospect(s) need attention`],
      };
    }
  } catch (err) {
    console.error('[agent-13 worker] BD alerts failed:', err);
  }

  try {
    const pendingApproval = await prisma.contentDraft.count({ where: { approvalStatus: 'pending_review' } });
    const publishedThisWeek = await prisma.contentDraft.count({
      where: {
        approvalStatus: 'published',
        publishedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });
    alerts.content = { pending_approval: pendingApproval, published_this_week: publishedThisWeek };
  } catch (err) {
    console.error('[agent-13 worker] content alerts failed:', err);
  }

  return alerts;
}

/**
 * On-demand: Pedro adds a commitment manually via /admin/commitments.
 */
export async function addCommitment(input: {
  description: string;
  committedTo: string;
  committedToType?: CommitmentToType;
  dueDate: Date;
  priority?: CommitmentPriority;
  source?: string;
}): Promise<{ id: string }> {
  const c = await prisma.commitment.create({
    data: {
      description: input.description,
      committedTo: input.committedTo,
      committedToType: input.committedToType ?? 'client',
      dueDate: input.dueDate,
      priority: input.priority ?? 'P3',
      source: input.source ?? 'manual',
    },
  });
  return { id: c.id };
}
