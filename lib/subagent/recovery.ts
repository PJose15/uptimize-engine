/**
 * Sub-Agent Error Recovery
 *
 * Builds standardized failure responses for P1 failures
 * and failed synthesis results.
 */

import type { SubAgentResult, AgentSynthesisResult, SubAgentId, AgentId } from './types';

/**
 * Build a P1 critical failure result for a sub-agent.
 */
export function buildP1Failure<T>(
  subAgentId: SubAgentId,
  parentAgentId: AgentId,
  error: string,
  durationMs: number = 0,
): SubAgentResult<T> {
  return {
    sub_agent_id: subAgentId,
    parent_agent_id: parentAgentId,
    task_completed: false,
    result: null,
    confidence: 'low',
    cost_usd: 0,
    duration_ms: durationMs,
    model_used: 'none',
    tokens_input: 0,
    tokens_output: 0,
    processing_notes: [`P1 FAILURE: ${error}`],
    fallbacks_used: [],
    escalation_needed: true,
    escalation_reason: error,
    escalation_severity: 'P1',
  };
}

/**
 * Build a failed synthesis result when the parent agent cannot
 * assemble a valid output from sub-agent results.
 */
export function buildFailedSynthesis<T>(
  agentId: AgentId,
  subAgentResults: SubAgentResult<unknown>[],
  error: string,
): AgentSynthesisResult<T> {
  return {
    agent_id: agentId,
    final_output: null as unknown as T,
    sub_agent_results: subAgentResults,
    total_cost_usd: subAgentResults.reduce((sum, r) => sum + r.cost_usd, 0),
    total_duration_ms: subAgentResults.reduce((sum, r) => sum + r.duration_ms, 0),
    synthesis_notes: [`SYNTHESIS FAILED: ${error}`],
    overall_confidence: 'low',
    requires_human_attention: true,
    human_attention_reason: error,
  };
}

/**
 * Build a successful synthesis result from sub-agent outputs.
 */
export function buildSynthesisResult<T>(
  agentId: AgentId,
  output: T,
  subAgentResults: SubAgentResult<unknown>[],
  notes: string[] = [],
): AgentSynthesisResult<T> {
  const hasEscalation = subAgentResults.some(r => r.escalation_needed);
  const lowestConfidence = subAgentResults.reduce<'high' | 'medium' | 'low'>(
    (lowest, r) => {
      if (r.confidence === 'low') return 'low';
      if (r.confidence === 'medium' && lowest !== 'low') return 'medium';
      return lowest;
    },
    'high',
  );

  return {
    agent_id: agentId,
    final_output: output,
    sub_agent_results: subAgentResults,
    total_cost_usd: subAgentResults.reduce((sum, r) => sum + r.cost_usd, 0),
    total_duration_ms: subAgentResults.reduce((sum, r) => sum + r.duration_ms, 0),
    synthesis_notes: notes,
    overall_confidence: lowestConfidence,
    requires_human_attention: hasEscalation,
    human_attention_reason: hasEscalation
      ? subAgentResults.filter(r => r.escalation_needed).map(r => r.escalation_reason).join('; ')
      : undefined,
  };
}
