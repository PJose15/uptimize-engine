/**
 * Parallel Aggregation Pattern
 *
 * Sub-agents A and B run simultaneously and independently.
 * Used by: Agents 2, 7, 11, 13
 */

import type { SubAgentResult, SubAgentContext, ParallelConfig } from '../types';
import { buildP1Failure } from '../recovery';

export async function runParallel<TA, TB, TOutput>(
  ctx: SubAgentContext,
  config: ParallelConfig<TA, TB, TOutput>,
): Promise<{
  output: TOutput;
  resultA: SubAgentResult<TA>;
  resultB: SubAgentResult<TB>;
}> {
  const { totalTimeoutMs, timeSharedBudget, runA, runB, synthesize } = config;

  const sharedBudgetMs = Math.floor(totalTimeoutMs * timeSharedBudget);
  const ctxShared: SubAgentContext = {
    ...ctx,
    time_budget_ms: sharedBudgetMs,
  };

  // Run A and B in parallel using Promise.allSettled
  const [settledA, settledB] = await Promise.allSettled([
    runA(ctxShared),
    runB(ctxShared),
  ]);

  const resultA: SubAgentResult<TA> = settledA.status === 'fulfilled'
    ? settledA.value
    : buildP1Failure<TA>(
        ctx.sub_agent_id,
        ctx.parent_agent_id,
        `Sub-agent A failed: ${settledA.reason instanceof Error ? settledA.reason.message : String(settledA.reason)}`,
      );

  const resultB: SubAgentResult<TB> = settledB.status === 'fulfilled'
    ? settledB.value
    : buildP1Failure<TB>(
        ctx.sub_agent_id,
        ctx.parent_agent_id,
        `Sub-agent B failed: ${settledB.reason instanceof Error ? settledB.reason.message : String(settledB.reason)}`,
      );

  return {
    output: synthesize(resultA, resultB),
    resultA,
    resultB,
  };
}
