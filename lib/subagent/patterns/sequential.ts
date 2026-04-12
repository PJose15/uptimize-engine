/**
 * Sequential Aggregation Pattern
 *
 * Sub-agent B depends on Sub-agent A's output.
 * Used by: Agents 1, 3, 4, 5, 6, 8, 12
 */

import type { SubAgentResult, SubAgentContext, SequentialConfig } from '../types';
import { buildP1Failure } from '../recovery';

export async function runSequential<TA, TB, TOutput>(
  ctx: SubAgentContext,
  config: SequentialConfig<TA, TB, TOutput>,
): Promise<{
  output: TOutput;
  resultA: SubAgentResult<TA>;
  resultB: SubAgentResult<TB>;
}> {
  const { totalTimeoutMs, timeSplitA, timeSplitB, runA, runB, synthesize } = config;

  // Phase A
  const ctxA: SubAgentContext = {
    ...ctx,
    time_budget_ms: Math.floor(totalTimeoutMs * timeSplitA),
  };

  let resultA: SubAgentResult<TA>;
  try {
    resultA = await runA(ctxA);
  } catch (err) {
    resultA = buildP1Failure<TA>(
      ctx.sub_agent_id, // Will be overridden by runA, but acts as fallback
      ctx.parent_agent_id,
      `Sub-agent A failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // If A failed critically, skip B
  if (!resultA.task_completed || resultA.result === null) {
    const failedB = buildP1Failure<TB>(
      ctx.sub_agent_id,
      ctx.parent_agent_id,
      'Skipped: Sub-agent A did not complete',
    );
    return {
      output: synthesize(resultA, failedB),
      resultA,
      resultB: failedB,
    };
  }

  // Phase B — receives A's result
  const ctxB: SubAgentContext = {
    ...ctx,
    time_budget_ms: Math.floor(totalTimeoutMs * timeSplitB),
    inputs: { ...ctx.inputs, sub_agent_a_result: resultA.result },
  };

  let resultB: SubAgentResult<TB>;
  try {
    resultB = await runB(ctxB, resultA.result);
  } catch (err) {
    resultB = buildP1Failure<TB>(
      ctx.sub_agent_id,
      ctx.parent_agent_id,
      `Sub-agent B failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  return {
    output: synthesize(resultA, resultB),
    resultA,
    resultB,
  };
}
