/**
 * Learning Collector — extracts learning events from Agent 3 output
 */

import { prisma } from '@/lib/prisma';
import { hasCollectedFor } from '../idempotency';
import { anonymizeLearningValue, validateNoClientPII } from '../anonymizer';

interface Agent3Output {
  vertical: string;
  pillar_findings?: Array<{ pillar: string; estimated_usd: number }>;
  new_exceptions?: Array<{ type: string; severity: string; resolution: string }>;
  [key: string]: unknown;
}

export async function collectFromAgent3(output: Agent3Output, sourceRunId: string): Promise<string[]> {
  // Retries and multiple dispatch points can reach this for the same run;
  // duplicate events would inflate confidence scoring's data-point counts.
  if (await hasCollectedFor('agent-3-sales-engineer', sourceRunId)) return [];

  const eventIds: string[] = [];

  // Money leak findings
  if (output.pillar_findings) {
    for (const finding of output.pillar_findings) {
      const value = JSON.stringify({ pillar: finding.pillar, estimated_usd: finding.estimated_usd });
      const anonymized = anonymizeLearningValue(value);
      const { clean } = validateNoClientPII(anonymized);
      if (!clean) continue;

      const event = await prisma.learningEvent.create({
        data: {
          sourceAgentId: 'agent-3-sales-engineer',
          sourceRunId,
          vertical: output.vertical,
          learningType: 'money_leak',
          key: 'pillar_finding',
          value: anonymized,
        },
      });
      eventIds.push(event.id);
    }
  }

  // New exceptions
  if (output.new_exceptions) {
    for (const exc of output.new_exceptions) {
      const value = JSON.stringify({ type: exc.type, severity: exc.severity, resolution: exc.resolution });
      const anonymized = anonymizeLearningValue(value);

      const event = await prisma.learningEvent.create({
        data: {
          sourceAgentId: 'agent-3-sales-engineer',
          sourceRunId,
          vertical: output.vertical,
          learningType: 'exception',
          key: 'new_pattern',
          value: anonymized,
        },
      });
      eventIds.push(event.id);
    }
  }

  return eventIds;
}
