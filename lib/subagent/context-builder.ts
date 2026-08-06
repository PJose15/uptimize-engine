/**
 * Sub-Agent Context Builder
 *
 * Builds filtered context for sub-agents. Sub-agents receive
 * memory as pre-filtered formatted strings only — never raw objects.
 */

import type { SubAgentContext, SubAgentId, AgentId } from './types';
import type { TaskProfile } from '@/lib/config/models';

// ============================================================================
// MEMORY FILTER KEYS per sub-agent
// ============================================================================

export const SUBAGENT_MEMORY_KEYS: Record<string, string[]> = {
  // Agent 1
  '1A-research-specialist':    ['agent1:researched_companies', 'agent1:do_not_target', 'agent1:vertical', 'shared:vertical_intelligence'],
  '1B-scoring-analyst':        ['agent1:vertical', 'shared:money_leak_map', 'agent1:scoring_criteria'],

  // Agent 2
  '2A-message-architect':      ['agent2:lead', 'agent2:vertical', 'agent2:successful_hooks', 'shared:client_preferences'],
  '2B-pipeline-manager':       ['agent2:lead', 'shared:client_preferences', 'agent2:pipeline_state'],

  // Agent 3
  '3A-discovery-conductor':    ['agent3:prospect', 'agent3:vertical', 'shared:audit_framework', 'shared:money_leak_map'],
  '3B-proposal-writer':        ['agent3:prospect', 'agent3:vertical', 'agent3:audit_findings', 'shared:pricing_tiers'],

  // Agent 4
  '4A-spec-designer':          ['agent4:proposal', 'agent4:integrations', 'shared:client_preferences', 'agent4:vertical'],
  '4B-qa-engineer':            ['agent4:spec', 'agent4:integrations', 'agent4:vertical'],

  // Agent 5
  '5A-health-analyst':         ['agent5:client', 'agent5:kpis', 'agent5:health_history', 'shared:vertical_intelligence'],
  '5B-win-reporter':           ['agent5:client', 'agent5:health_data', 'agent5:proof_assets'],

  // Agent 6
  '6A-presentation-coach':     ['agent6:proposal', 'agent6:prospect', 'shared:objection_library'],
  '6B-contract-orchestrator':  ['agent6:proposal', 'agent6:prospect', 'agent6:presentation_guide', 'shared:sow_templates'],

  // Agent 7
  '7A-signal-monitor':         ['agent7:nurture_records', 'shared:vertical_intelligence'],
  '7B-sequence-manager':       ['agent7:nurture_records', 'agent7:signal_data', 'shared:touch_templates'],

  // Agent 8
  '8A-pattern-collector':      ['agent8:learning_events', 'agent8:existing_patterns', 'shared:vertical_intelligence'],
  '8B-playbook-updater':       ['agent8:validated_patterns', 'agent8:distribution_targets'],

  // Operational agents 9-13
  '9A-portfolio-monitor':      ['agent9:portfolios', 'shared:health_thresholds'],
  '9B-financial-metrics':      ['agent9:portfolios', 'agent9:invoices', 'agent9:pipeline_value'],
  '10A-research-finder':       ['agent10:proof_assets', 'agent10:content_calendar', 'shared:vertical_intelligence'],
  '10B-drafter-publisher':     ['agent10:research_data', 'agent10:content_calendar'],
  '11A-prospect-research':     ['agent11:bd_records', 'shared:vertical_intelligence'],
  '11B-pipeline-manager-bd':   ['agent11:bd_records', 'agent11:research_briefs'],
  '12A-compliance-tracker':    ['agent12:compliance_records', 'agent12:contracts'],
  '12B-invoice-manager':       ['agent12:invoices', 'agent12:payment_history'],
  '13A-calendar-intelligence': ['agent13:commitments', 'agent13:schedule', 'shared:portfolio_summary'],
  '13B-deliverable-tracker':   ['agent13:commitments', 'agent13:deliverables'],
};

// ============================================================================
// CONTEXT BUILDER
// ============================================================================

export interface BuildContextInput {
  parentAgentId: AgentId;
  subAgentId: SubAgentId;
  clientId: string;
  pipelineRunId?: string;
  pipelineSessionId?: string;
  task: string;
  taskProfile: TaskProfile;
  mode: 'fast' | 'balanced' | 'quality';
  timeBudgetMs: number;
  inputs?: Record<string, unknown>;
  memoryEntries?: Record<string, string>;
  maxResponseTokens?: number;
  confidenceRequired?: 'high' | 'medium' | 'low';
}

/**
 * Build a SubAgentContext with filtered memory.
 */
export function buildSubAgentContext(input: BuildContextInput): SubAgentContext {
  const {
    parentAgentId, subAgentId, clientId, pipelineRunId, pipelineSessionId,
    task, taskProfile, mode, timeBudgetMs, inputs = {},
    memoryEntries = {}, maxResponseTokens = 4000, confidenceRequired = 'medium',
  } = input;

  // Filter memory to only relevant keys for this sub-agent
  const allowedKeys = SUBAGENT_MEMORY_KEYS[subAgentId] ?? [];
  const filteredMemory = filterMemoryForSubAgent(memoryEntries, allowedKeys);

  return {
    parent_agent_id: parentAgentId,
    sub_agent_id: subAgentId,
    client_id: clientId,
    pipeline_run_id: pipelineRunId,
    pipeline_session_id: pipelineSessionId,
    task,
    memory_context: filteredMemory,
    inputs,
    max_response_tokens: maxResponseTokens,
    confidence_required: confidenceRequired,
    time_budget_ms: timeBudgetMs,
    mode,
    task_profile: taskProfile,
  };
}

/**
 * Filter memory entries to only keys the sub-agent is allowed to see,
 * then format as a single string.
 */
export function filterMemoryForSubAgent(
  memories: Record<string, string>,
  allowedKeys: string[],
): string {
  if (allowedKeys.length === 0) return '';

  const parts: string[] = [];
  for (const key of allowedKeys) {
    const value = memories[key];
    if (value) {
      parts.push(`[${key}]: ${value}`);
    }
  }

  return parts.length > 0 ? parts.join('\n\n') : '';
}

/**
 * Prepend a sub-agent's memory to its user prompt.
 *
 * Sub-agents were built with `memory_context` on the context object but none of
 * them read it, so filtered memory was assembled and discarded. This is the
 * single place that splices it in, so every sub-agent presents learned context
 * the same way and it cannot be silently forgotten in a new one.
 *
 * Returns the prompt unchanged when there is no memory, so a first run looks
 * exactly as it did before.
 */
export function withMemoryContext(userPrompt: string, memoryContext: string): string {
  if (!memoryContext || memoryContext.trim().length === 0) return userPrompt;

  return [
    '## LEARNED CONTEXT FROM PREVIOUS RUNS',
    'Patterns observed across earlier engagements. Weigh these by their stated',
    'confidence — treat a single observation as a hint, not a fact.',
    '',
    memoryContext,
    '',
    '---',
    '',
    userPrompt,
  ].join('\n');
}
