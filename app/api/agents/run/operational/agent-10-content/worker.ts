/**
 * Agent 10 Worker — weekly content generation (Sundays).
 */

import { prisma } from '@/lib/prisma';
import { runAgent10Content } from './agent';
import type { Agent10Input, ContentCalendarStatus } from './types';

async function buildCalendarStatus(): Promise<ContentCalendarStatus> {
  const scheduled = await prisma.contentDraft.count({ where: { approvalStatus: 'approved', publishedAt: null } });
  const pending = await prisma.contentDraft.count({ where: { approvalStatus: 'pending_review' } });
  const publishedThisWeek = await prisma.contentDraft.count({
    where: {
      approvalStatus: 'published',
      publishedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
  });
  // Assume ~3 posts per week typical cadence
  const weeks = scheduled / 3;
  return {
    scheduled_count: scheduled,
    pending_review_count: pending,
    published_this_week: publishedThisWeek,
    weeks_of_queue_remaining: weeks,
    queue_low_warning: weeks < 1,
  };
}

export interface ContentSummary {
  angles: number;
  drafts: number;
  queued_for_pedro: number;
  cost_usd: number;
}

export async function runAgent10WeeklyContent(): Promise<ContentSummary> {
  const week_of = new Date().toISOString().split('T')[0];
  const calendar = await buildCalendarStatus();

  const input: Agent10Input = {
    trigger: 'cron_weekly',
    week_of,
    source_inputs: {
      agent5_recent_wins: [],
      agent8_validated_patterns: [],
      industry_triggers: [],
      pedro_frameworks_recently_used: [],
    },
    current_calendar: calendar,
  };

  const synthesis = await runAgent10Content(input);
  const out = synthesis.final_output;

  // Persist drafts as ContentDraft rows for the portal review queue
  for (const d of out.drafter.drafts) {
    try {
      await prisma.contentDraft.create({
        data: {
          contentType: d.content_type,
          platform: d.platform,
          angle: d.angle_id,
          draftText: d.body_text,
          sourceInsight: d.source_insight,
          approvalStatus: 'pending_review',
          scheduledFor: d.scheduled_for_recommendation ? new Date(d.scheduled_for_recommendation) : undefined,
        },
      });
    } catch (err) {
      console.error('[agent-10 worker] persist draft failed:', err);
    }
  }

  return {
    angles: out.research.angles.length,
    drafts: out.drafter.drafts.length,
    queued_for_pedro: out.pedro_review_queue.length,
    cost_usd: synthesis.total_cost_usd,
  };
}
