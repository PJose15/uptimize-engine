/**
 * Sub-Agent Run Logger
 *
 * Persists every sub-agent execution to the SubAgentRun table.
 */

import { prisma } from '@/lib/prisma';
import type { SubAgentResult } from './types';

/**
 * Log a sub-agent run to the database.
 */
export async function logSubAgentRun(
  result: SubAgentResult<unknown>,
  meta: {
    clientId: string;
    pipelineRunId?: string;
    pipelineSessionId?: string;
    taskProfile: string;
  },
): Promise<string> {
  const record = await prisma.subAgentRun.create({
    data: {
      subAgentId: result.sub_agent_id,
      parentAgentId: result.parent_agent_id,
      pipelineRunId: meta.pipelineRunId ?? null,
      pipelineSessionId: meta.pipelineSessionId ?? null,
      clientId: meta.clientId,
      taskProfile: meta.taskProfile,
      modelUsed: result.model_used,
      providerUsed: result.model_used.split('-')[0] ?? 'unknown',
      taskCompleted: result.task_completed,
      confidence: result.confidence,
      processingNotes: JSON.stringify(result.processing_notes),
      fallbacksUsed: JSON.stringify(result.fallbacks_used),
      escalationNeeded: result.escalation_needed,
      escalationSeverity: result.escalation_severity ?? null,
      escalationReason: result.escalation_reason ?? null,
      costUsd: result.cost_usd,
      durationMs: result.duration_ms,
      inputTokens: result.tokens_input,
      outputTokens: result.tokens_output,
    },
  });

  return record.id;
}
