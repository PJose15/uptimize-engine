/**
 * Agent 11 Worker — daily BD digest at 7:30 AM PR time.
 */

import { prisma } from '@/lib/prisma';
import { runAgent11BusinessDevelopment } from './agent';
import type { Agent11Input, BdRecordView, BdRecordType, BdStage } from './types';

function asBdType(s: string): BdRecordType {
  return (s === 'prospect' || s === 'partner' || s === 'referral') ? s : 'prospect';
}
function asBdStage(s: string): BdStage {
  if (
    s === 'identified' || s === 'researched' || s === 'contacted' ||
    s === 'meeting_scheduled' || s === 'proposal_sent' || s === 'negotiating' ||
    s === 'won' || s === 'lost'
  ) return s;
  return 'identified';
}

function daysSince(d: Date | null | undefined): number {
  if (!d) return Number.POSITIVE_INFINITY;
  return Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24));
}

export interface BdDigestSummary {
  records: number;
  stalled: number;
  new_referrals: number;
  pipeline_value_usd: number;
  cost_usd: number;
}

export async function runAgent11DailyBD(): Promise<BdDigestSummary> {
  const today = new Date().toISOString().split('T')[0];

  const dbRecords = await prisma.bDRecord.findMany({
    where: {
      currentStage: { notIn: ['won', 'lost'] },
    },
    take: 200,
    orderBy: { nextActionDue: 'asc' },
  });

  const records: BdRecordView[] = dbRecords.map(r => {
    const dsl = daysSince(r.lastContact);
    return {
      id: r.id,
      type: asBdType(r.type),
      current_stage: asBdStage(r.currentStage),
      pipeline_value_usd: r.pipelineValueUsd,
      company_name: r.companyName,
      contact_name: r.contactName ?? undefined,
      contact_email: r.contactEmail ?? undefined,
      vertical: r.vertical,
      last_contact: r.lastContact?.toISOString(),
      next_action: r.nextAction ?? undefined,
      next_action_due: r.nextActionDue?.toISOString(),
      research_brief_id: r.researchBriefId ?? undefined,
      referred_by: r.referredBy ?? undefined,
      days_since_last_contact: dsl,
      is_stalled: dsl >= 7,
    };
  });

  const input: Agent11Input = {
    trigger: 'cron_daily',
    today,
    records,
    upcoming_calls: [],
  };

  const synthesis = await runAgent11BusinessDevelopment(input);
  const out = synthesis.final_output;

  return {
    records: out.pipeline.records.length,
    stalled: out.pipeline.stalled.length,
    new_referrals: out.pipeline.new_referrals.length,
    pipeline_value_usd: out.daily_digest.pipeline_value_usd,
    cost_usd: synthesis.total_cost_usd,
  };
}
