/**
 * Sub-Agent Cost Aggregation
 *
 * Rolls up sub-agent costs into parent agent totals.
 */

import type { SubAgentResult } from './types';

export interface AgentCostSummary {
  total_cost_usd: number;
  total_duration_ms: number;
  total_input_tokens: number;
  total_output_tokens: number;
  sub_agent_costs: Array<{
    sub_agent_id: string;
    cost_usd: number;
    duration_ms: number;
  }>;
}

/**
 * Aggregate costs from sub-agent results into a summary.
 */
export function aggregateSubAgentCosts(
  results: SubAgentResult<unknown>[],
): AgentCostSummary {
  return {
    total_cost_usd: Number(
      results.reduce((sum, r) => sum + r.cost_usd, 0).toFixed(6),
    ),
    total_duration_ms: results.reduce((sum, r) => sum + r.duration_ms, 0),
    total_input_tokens: results.reduce((sum, r) => sum + r.tokens_input, 0),
    total_output_tokens: results.reduce((sum, r) => sum + r.tokens_output, 0),
    sub_agent_costs: results.map(r => ({
      sub_agent_id: r.sub_agent_id,
      cost_usd: r.cost_usd,
      duration_ms: r.duration_ms,
    })),
  };
}
