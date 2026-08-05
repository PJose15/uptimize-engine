/**
 * Learning Collection Idempotency
 *
 * Collection can be triggered more than once for the same agent run:
 *  - the pipeline route retries a failed agent (withRetry, maxAttempts 2), so
 *    a run that fails then succeeds reaches completion twice;
 *  - Agent 3's sub-agent orchestrator fires collectFromAgent3 itself, between
 *    3A and 3B, in addition to any dispatch by the caller.
 *
 * Duplicate LearningEvent rows do not just waste space — confidence scoring
 * counts data points, so the same observation recorded twice would look like
 * independent corroboration and inflate a learning toward "validated".
 */

import { prisma } from '@/lib/prisma';

/**
 * Whether this agent has already had learning collected for this run.
 * Returns false when there is no run id to key on — an uncorrelated run cannot
 * be deduplicated, and dropping the data would be worse than a rare duplicate.
 */
export async function hasCollectedFor(sourceAgentId: string, sourceRunId: string): Promise<boolean> {
    if (!sourceRunId) return false;

    const existing = await prisma.learningEvent.findFirst({
        where: { sourceAgentId, sourceRunId },
        select: { id: true },
    });

    return existing !== null;
}
