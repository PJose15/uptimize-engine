/**
 * Agent 7 Background Worker
 *
 * Runs daily as a cron job. Pulls active NurtureRecords whose nextTouch
 * is due within the next 24 hours, processes them via Agent 7, and applies
 * the synthesized routing decisions to the database.
 *
 * Source: UPTIMIZE_CLAUDE_CODE_MASTER_V2.md (Sprint 11.1)
 */

import { prisma } from '@/lib/prisma';
import { runAgent7Nurture } from './agent';
import type { NurtureRecordView, NurtureCategory, SignalObservation } from './types';

// ============================================================================
// HELPERS
// ============================================================================

const DEFAULT_NEXT_TOUCH_DAYS: Record<NurtureCategory, number> = {
  hot: 14,
  warm: 30,
  cold: 90,
  lost_deal: 60,
};

function daysSince(d: Date | null | undefined): number {
  if (!d) return Number.POSITIVE_INFINITY;
  const ms = Date.now() - new Date(d).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function asNurtureCategory(s: string): NurtureCategory {
  if (s === 'hot' || s === 'warm' || s === 'cold' || s === 'lost_deal') return s;
  return 'warm';
}

function parseSignals(raw: string | null | undefined): SignalObservation[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SignalObservation[]) : [];
  } catch {
    return [];
  }
}

function parseStringArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(v => String(v)) : [];
  } catch {
    return [];
  }
}

function toView(r: {
  id: string; leadId: string; company: string; contactName: string | null;
  vertical: string; category: string; reason: string; originalPain: string;
  whatWasTried: string; readinessScore: number; reQualified: boolean;
  archived: boolean; lastTouch: Date | null; nextTouch: Date | null;
  touchCount: number; signalsFound: string | null; clientId: string;
}): NurtureRecordView {
  return {
    id: r.id,
    leadId: r.leadId,
    company: r.company,
    contactName: r.contactName ?? undefined,
    vertical: r.vertical,
    category: asNurtureCategory(r.category),
    reason: r.reason,
    originalPain: r.originalPain,
    whatWasTried: parseStringArray(r.whatWasTried),
    readinessScore: r.readinessScore,
    reQualified: r.reQualified,
    archived: r.archived,
    lastTouch: r.lastTouch?.toISOString(),
    nextTouch: r.nextTouch?.toISOString(),
    touchCount: r.touchCount,
    signalsFound: parseSignals(r.signalsFound),
    clientId: r.clientId,
    daysSinceLastContact: daysSince(r.lastTouch),
  };
}

// ============================================================================
// BATCH WORKER (cron-driven)
// ============================================================================

export interface NurtureBatchSummary {
  records_pulled: number;
  reintroductions_queued: number;
  approval_queue_entries: number;
  archived: number;
  next_touches_updated: number;
  errors: string[];
}

/**
 * Pull all due NurtureRecords across all clients and process them through Agent 7.
 * Called by lib/scheduler/operational-jobs.ts daily.
 */
export async function runNurtureIntelligenceBatch(
  options: { clientId?: string; horizonHours?: number } = {},
): Promise<NurtureBatchSummary> {
  const horizon = new Date();
  horizon.setHours(horizon.getHours() + (options.horizonHours ?? 24));

  const dbRecords = await prisma.nurtureRecord.findMany({
    where: {
      archived: false,
      OR: [
        { nextTouch: { lte: horizon } },
        { nextTouch: null }, // newly created — needs first scan
      ],
      ...(options.clientId ? { clientId: options.clientId } : {}),
    },
    take: 50, // batch cap to bound LLM cost
  });

  const summary: NurtureBatchSummary = {
    records_pulled: dbRecords.length,
    reintroductions_queued: 0,
    approval_queue_entries: 0,
    archived: 0,
    next_touches_updated: 0,
    errors: [],
  };

  if (dbRecords.length === 0) return summary;

  // Group by clientId so each Agent 7 run has a single client context
  const byClient = new Map<string, NurtureRecordView[]>();
  for (const r of dbRecords) {
    const view = toView(r);
    const list = byClient.get(view.clientId) ?? [];
    list.push(view);
    byClient.set(view.clientId, list);
  }

  for (const [clientId, records] of byClient.entries()) {
    try {
      const synthesis = await runAgent7Nurture(
        { records, triggered_by: 'cron', client_id: clientId },
      );

      const out = synthesis.final_output;
      summary.reintroductions_queued += out.reintroductions.length;
      summary.approval_queue_entries += out.approval_queue_entries.length;
      summary.archived += out.archived.length;
      summary.next_touches_updated += out.next_touches_updated.length;

      // Apply DB updates
      await applyOutputToDatabase(out);
    } catch (err) {
      summary.errors.push(
        `client=${clientId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return summary;
}

/**
 * Triggered by event-dispatcher when Agent 2 routes a prospect to nurture.
 * Creates the NurtureRecord and runs an immediate signal scan.
 */
export interface NurtureEntryInput {
  leadId: string;
  company: string;
  contactName?: string;
  vertical: string;
  category: NurtureCategory;
  reason: string;
  originalPain: string;
  whatWasTried: string[];
  clientId: string;
  sourceRunId?: string;
}

export async function onNurtureEntryAdded(entry: NurtureEntryInput): Promise<void> {
  const initialNextTouch = new Date();
  initialNextTouch.setDate(initialNextTouch.getDate() + DEFAULT_NEXT_TOUCH_DAYS[entry.category]);

  await prisma.nurtureRecord.create({
    data: {
      leadId: entry.leadId,
      company: entry.company,
      contactName: entry.contactName,
      vertical: entry.vertical,
      category: entry.category,
      reason: entry.reason,
      originalPain: entry.originalPain,
      whatWasTried: JSON.stringify(entry.whatWasTried),
      clientId: entry.clientId,
      sourceRunId: entry.sourceRunId,
      nextTouch: initialNextTouch,
    },
  });

  // Immediate scan for the newly added record
  await runNurtureIntelligenceBatch({ clientId: entry.clientId, horizonHours: 24 });
}

// ============================================================================
// DB APPLICATION
// ============================================================================

async function applyOutputToDatabase(out: Awaited<ReturnType<typeof runAgent7Nurture>>['final_output']): Promise<void> {
  // Archive
  if (out.archived.length > 0) {
    await prisma.nurtureRecord.updateMany({
      where: { id: { in: out.archived.map(a => a.nurture_record_id) } },
      data: { archived: true },
    });
  }

  // Update next-touch + readiness score for non-archived records
  for (const u of out.next_touches_updated) {
    const asmt = out.signal_monitor.assessments.find(a => a.nurture_record_id === u.nurture_record_id);
    await prisma.nurtureRecord.update({
      where: { id: u.nurture_record_id },
      data: {
        nextTouch: new Date(u.new_next_touch),
        lastProcessed: new Date(),
        ...(asmt
          ? {
              readinessScore: asmt.re_engagement_readiness,
              signalsFound: JSON.stringify(asmt.signals_observed),
            }
          : {}),
      },
    });
  }

  // Mark reQualified for records being reintroduced
  if (out.reintroductions.length > 0) {
    await prisma.nurtureRecord.updateMany({
      where: { id: { in: out.reintroductions.map(r => r.nurture_record_id) } },
      data: {
        reQualified: true,
        readinessScore: 8,
        lastProcessed: new Date(),
      },
    });
  }

  // Note: drafted touches are NOT auto-sent. The approval_queue_entries
  // are surfaced via Agent 7's synthesis result and routed to the portal
  // approval queue by the caller (event-dispatcher or worker harness).
}
