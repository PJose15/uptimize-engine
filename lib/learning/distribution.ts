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

export async function processPendingNotices(agentId: string): Promise<Array<{ key: string; value: string }>> {
  const pending = await prisma.learningDistribution.findMany({
    where: { targetAgentId: agentId, delivered: false },
    include: { agentLearning: true },
    take: 50,
  });
  if (pending.length === 0) return [];

  const results = pending.map(n => ({
    key: n.agentLearning.key,
    value: n.agentLearning.value,
  }));

  await prisma.learningDistribution.updateMany({
    where: { id: { in: pending.map(n => n.id) } },
    data: { delivered: true, deliveredAt: new Date() },
  });

  return results;
}
