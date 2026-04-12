/**
 * Learning Updaters — update AgentLearning records
 */

import { prisma } from '@/lib/prisma';
import { getConfidenceLevel } from '../confidence';
import { anonymizeLearningValue, validateNoClientPII } from '../anonymizer';
import { getDistributionTargets, createDistributionNotices } from '../distribution';

const MAX_ADJUSTMENT = 0.15; // ±15% cap

export async function updateSignalWeight(params: {
  vertical: string;
  agentId: string;
  learningType: string;
  key: string;
  value: string;
}): Promise<{ id: string; label: string; isNew: boolean }> {
  const { vertical, agentId, learningType, key, value } = params;

  const anonymized = anonymizeLearningValue(value);
  const { clean, issues } = validateNoClientPII(anonymized);
  if (!clean) throw new Error(`PII detected: ${issues.join(', ')}`);

  const existing = await prisma.agentLearning.findUnique({
    where: { vertical_agentId_learningType_key: { vertical, agentId, learningType, key } },
  });

  if (!existing) {
    const { confidence, label } = getConfidenceLevel(1, false);
    const record = await prisma.agentLearning.create({
      data: { vertical, agentId, learningType, key, value: anonymized, confidence, label, dataPoints: 1 },
    });
    return { id: record.id, label, isNew: true };
  }

  const newDataPoints = existing.dataPoints + 1;
  const { confidence, label } = getConfidenceLevel(newDataPoints, false);

  const record = await prisma.agentLearning.update({
    where: { id: existing.id },
    data: { value: anonymized, confidence, label, dataPoints: newDataPoints },
  });

  // Distribute validated learnings
  if (label === 'validated' && existing.label !== 'validated') {
    const targets = getDistributionTargets(learningType, key);
    await createDistributionNotices(record.id, targets);
  }

  return { id: record.id, label, isNew: false };
}

export function clampMultiplier(current: number, adjustment: number): number {
  const capped = Math.max(-MAX_ADJUSTMENT, Math.min(MAX_ADJUSTMENT, adjustment));
  return Number((current + capped).toFixed(4));
}

export async function updateMultiplier(params: {
  vertical: string;
  agentId: string;
  key: string;
  adjustment: number;
}): Promise<void> {
  const { vertical, agentId, key, adjustment } = params;
  const existing = await prisma.agentLearning.findUnique({
    where: { vertical_agentId_learningType_key: { vertical, agentId, learningType: 'multiplier', key } },
  });

  const currentVal = existing ? parseFloat(existing.value) || 1.0 : 1.0;
  const newVal = clampMultiplier(currentVal, adjustment);

  if (existing) {
    await prisma.agentLearning.update({
      where: { id: existing.id },
      data: { value: String(newVal), dataPoints: existing.dataPoints + 1 },
    });
  } else {
    await prisma.agentLearning.create({
      data: { vertical, agentId, learningType: 'multiplier', key, value: String(newVal), confidence: 0.5, label: 'single_observation', dataPoints: 1 },
    });
  }
}
