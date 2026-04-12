/**
 * Learning Collector — extracts learning events from Agent 5 output
 */

import { prisma } from '@/lib/prisma';
import { anonymizeLearningValue } from '../anonymizer';

interface Agent5Output {
  vertical?: string;
  quick_win_used?: string;
  quick_win_worked?: boolean;
  dimension_improved?: number;
  score_improvement?: number;
  [key: string]: unknown;
}

export async function collectFromAgent5(output: Agent5Output, sourceRunId: string): Promise<string[]> {
  const eventIds: string[] = [];
  const vertical = output.vertical ?? 'unknown';

  if (output.quick_win_used) {
    const value = anonymizeLearningValue(JSON.stringify({
      quick_win: output.quick_win_used,
      worked: output.quick_win_worked ?? false,
      dimension: output.dimension_improved,
      improvement: output.score_improvement,
    }));

    const event = await prisma.learningEvent.create({
      data: {
        sourceAgentId: 'agent-5-client-success',
        sourceRunId,
        vertical,
        learningType: 'health_score_driver',
        key: output.quick_win_worked ? 'quick_win' : 'risk_factor',
        value,
      },
    });
    eventIds.push(event.id);
  }

  return eventIds;
}
