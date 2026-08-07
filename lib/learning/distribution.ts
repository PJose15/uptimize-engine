/**
 * Learning Distribution — routes validated learnings to relevant agents
 */

import { prisma } from '@/lib/prisma';
import type { AgentId } from '@/lib/subagent/types';

export const LEARNING_DISTRIBUTION_MAP: Record<string, AgentId[]> = {
  'money_leak:pillar_finding':       ['agent-1-market-intelligence', 'agent-3-sales-engineer'],
  'money_leak:value_estimate':       ['agent-3-sales-engineer', 'agent-6-closer'],
  'exception:new_pattern':           ['agent-3-sales-engineer', 'agent-5-client-success'],
  'exception:resolution':            ['agent-4-systems-builder', 'agent-5-client-success'],
  'integration_quirk:issue':         ['agent-4-systems-builder'],
  'integration_quirk:workaround':    ['agent-4-systems-builder'],
  'health_score_driver:quick_win':   ['agent-5-client-success'],
  'health_score_driver:risk_factor': ['agent-5-client-success', 'agent-9-revenue-intelligence'],
  'outreach_hook:effective':         ['agent-2-outbound-appointment', 'agent-7-nurture'],
  'outreach_hook:ineffective':       ['agent-2-outbound-appointment'],
  // model_performance learnings are routed to Pedro only (no agent distribution).
  // Agent 8's worker explicitly skips distribution for this learning_type.
};

export function getDistributionTargets(learningType: string, key: string): AgentId[] {
  const mapKey = `${learningType}:${key}`;
  return LEARNING_DISTRIBUTION_MAP[mapKey] ?? [];
}

export async function createDistributionNotices(
  agentLearningId: string,
  targets: AgentId[],
): Promise<void> {
  if (targets.length === 0) return;
  await prisma.learningDistribution.createMany({
    data: targets.map(agentId => ({
      agentLearningId,
      targetAgentId: agentId,
    })),
  });
}

export interface PendingNotice {
  /** LearningDistribution row id — pass to markNoticesDelivered once used */
  id: string;
  learningType: string;
  key: string;
  value: string;
  vertical: string;
  confidence: number;
  label: string;
}

/**
 * Read the notices waiting for an agent WITHOUT consuming them.
 *
 * Reading and consuming are separated on purpose: if an agent run fails after
 * its notices were marked delivered, that learning is gone and will never
 * reach the agent. Callers read here, run, and only mark delivered on success.
 *
 * `effectiveFrom` is honoured so a learning can be scheduled ahead of time.
 */
export async function peekPendingNotices(agentId: string, take = 50): Promise<PendingNotice[]> {
  const pending = await prisma.learningDistribution.findMany({
    where: {
      targetAgentId: agentId,
      delivered: false,
      effectiveFrom: { lte: new Date() },
    },
    include: { agentLearning: true },
    orderBy: { effectiveFrom: 'asc' },
    take,
  });

  return pending.map(n => ({
    id: n.id,
    learningType: n.agentLearning.learningType,
    key: n.agentLearning.key,
    value: n.agentLearning.value,
    vertical: n.agentLearning.vertical,
    confidence: n.agentLearning.confidence,
    label: n.agentLearning.label,
  }));
}

/** Mark notices delivered after the run that used them succeeded. */
export async function markNoticesDelivered(noticeIds: string[]): Promise<number> {
  if (noticeIds.length === 0) return 0;

  const result = await prisma.learningDistribution.updateMany({
    where: { id: { in: noticeIds } },
    data: { delivered: true, deliveredAt: new Date() },
  });

  return result.count;
}

/**
 * Read-and-consume in one step.
 *
 * Retained for callers that cannot defer the acknowledgement; prefer
 * peekPendingNotices + markNoticesDelivered, which does not lose learning when
 * the consuming run fails.
 */
export async function processPendingNotices(agentId: string): Promise<Array<{ key: string; value: string }>> {
  const pending = await peekPendingNotices(agentId);
  if (pending.length === 0) return [];

  await markNoticesDelivered(pending.map(n => n.id));

  return pending.map(n => ({ key: n.key, value: n.value }));
}
