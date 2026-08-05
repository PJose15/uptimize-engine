/**
 * Learning Collector — extracts learning events from Agent 4 output
 */

import { prisma } from '@/lib/prisma';
import { hasCollectedFor } from '../idempotency';
import { anonymizeLearningValue } from '../anonymizer';

interface Agent4Output {
  vertical: string;
  integrations_used?: Array<{ name: string; issues: string[]; added_hours: number }>;
  [key: string]: unknown;
}

export async function collectFromAgent4(output: Agent4Output, sourceRunId: string): Promise<string[]> {
  // Retries and multiple dispatch points can reach this for the same run;
  // duplicate events would inflate confidence scoring's data-point counts.
  if (await hasCollectedFor('agent-4-systems-builder', sourceRunId)) return [];

  const eventIds: string[] = [];

  if (output.integrations_used) {
    for (const integration of output.integrations_used) {
      if (integration.issues.length === 0) continue;
      const value = anonymizeLearningValue(JSON.stringify({
        integration: integration.name,
        issues: integration.issues,
        added_hours: integration.added_hours,
      }));

      const event = await prisma.learningEvent.create({
        data: {
          sourceAgentId: 'agent-4-systems-builder',
          sourceRunId,
          vertical: output.vertical,
          learningType: 'integration_quirk',
          key: 'issue',
          value,
        },
      });
      eventIds.push(event.id);
    }
  }

  return eventIds;
}
