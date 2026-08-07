/**
 * Learning Collector — extracts learning events from Agent 6 output
 */

import { prisma } from '@/lib/prisma';
import { hasCollectedFor } from '../idempotency';
import { anonymizeLearningValue } from '../anonymizer';

interface Agent6Output {
  vertical?: string;
  close_approach?: string;
  objection_encountered?: string;
  objection_resolution?: string;
  [key: string]: unknown;
}

export async function collectFromAgent6(output: Agent6Output, sourceRunId: string): Promise<string[]> {
  // Retries and multiple dispatch points can reach this for the same run;
  // duplicate events would inflate confidence scoring's data-point counts.
  if (await hasCollectedFor('agent-6-closer', sourceRunId)) return [];

  const eventIds: string[] = [];
  const vertical = output.vertical ?? 'unknown';

  if (output.close_approach) {
    const value = anonymizeLearningValue(JSON.stringify({
      approach: output.close_approach,
      objection: output.objection_encountered,
      resolution: output.objection_resolution,
    }));

    const event = await prisma.learningEvent.create({
      data: {
        sourceAgentId: 'agent-6-closer',
        sourceRunId,
        vertical,
        learningType: 'outreach_hook',
        key: 'effective',
        value,
      },
    });
    eventIds.push(event.id);
  }

  return eventIds;
}
