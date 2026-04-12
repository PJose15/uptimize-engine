/**
 * Sub-Agent Output Validator
 *
 * Parses and validates JSON output from sub-agent LLM responses.
 */

import type { SubAgentResult, SubAgentId, AgentId } from './types';
import type { LLMResponse } from '@/lib/providers/types';
import { buildP1Failure } from './recovery';

/**
 * Parse LLM response content as JSON and validate it produces a non-null result.
 * Returns a SubAgentResult with the parsed output or a P1 failure.
 */
export function parseAndValidate<T>(
  content: string,
  subAgentId: SubAgentId,
  parentAgentId: AgentId,
  response: LLMResponse,
): SubAgentResult<T> {
  const start = Date.now();

  try {
    // Try direct JSON parse
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Try extracting from markdown code block
      const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        parsed = JSON.parse(match[1].trim());
      } else {
        throw new Error('Response is not valid JSON');
      }
    }

    if (parsed === null || parsed === undefined) {
      return buildP1Failure<T>(subAgentId, parentAgentId, 'Parsed result is null');
    }

    return {
      sub_agent_id: subAgentId,
      parent_agent_id: parentAgentId,
      task_completed: true,
      result: parsed as T,
      confidence: 'medium',
      cost_usd: response.cost_usd,
      duration_ms: response.latency_ms,
      model_used: response.model_used,
      tokens_input: response.usage.input_tokens,
      tokens_output: response.usage.output_tokens,
      processing_notes: [],
      fallbacks_used: [],
      escalation_needed: false,
    };
  } catch (err) {
    return buildP1Failure<T>(
      subAgentId,
      parentAgentId,
      `JSON parse failed: ${err instanceof Error ? err.message : String(err)}`,
      Date.now() - start,
    );
  }
}

/**
 * Validate that a SubAgentResult has a non-null result and meets confidence threshold.
 */
export function validateSubAgentResult<T>(
  result: SubAgentResult<T>,
  requiredConfidence: 'high' | 'medium' | 'low' = 'medium',
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!result.task_completed) {
    issues.push('Task did not complete');
  }

  if (result.result === null) {
    issues.push('Result is null');
  }

  const confidenceRank = { high: 3, medium: 2, low: 1 };
  if (confidenceRank[result.confidence] < confidenceRank[requiredConfidence]) {
    issues.push(`Confidence ${result.confidence} below required ${requiredConfidence}`);
  }

  return { valid: issues.length === 0, issues };
}
