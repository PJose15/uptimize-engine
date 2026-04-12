/**
 * Conditional Aggregation Pattern
 *
 * Sub-agent B only runs if Sub-agent A meets a threshold condition.
 * Used by: Agents 5, 8
 */

import type { SubAgentResult, SubAgentContext, ConditionalConfig } from '../types';
import { buildP1Failure } from '../recovery';

export async function runConditional<TA, TB, TOutput>(
  ctx: SubAgentContext,
  config: ConditionalConfig<TA, TB, TOutput>,
): Promise<{
  output: TOutput;
  resultA: SubAgentResult<TA>;
  resultB: SubAgentResult<TB> | null;
  bSkipped: boolean;
}> {
  const { totalTimeoutMs, timeSplitA, timeSplitB, runA, shouldRunB, runB, synthesize } = config;

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
      ctx.sub_agent_id,
      ctx.parent_agent_id,
      `Sub-agent A failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // Check condition
  if (!shouldRunB(resultA)) {
    return {
      output: synthesize(resultA, null),
      resultA,
      resultB: null,
      bSkipped: true,
    };
  }

  // If A failed but condition still wants B (unlikely), guard against null result
  if (resultA.result === null) {
    return {
      output: synthesize(resultA, null),
      resultA,
      resultB: null,
      bSkipped: true,
    };
  }

  // Phase B — conditional execution
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
    bSkipped: false,
  };
}
