/**
 * Sub-Agent Type System
 *
 * Core types for all 26 sub-agents across 13 parent agents.
 */

import type { TaskProfile } from '@/lib/config/models';

// ============================================================================
// SUB-AGENT IDENTIFIERS
// ============================================================================

export type SubAgentId =
  | '1A-research-specialist'    | '1B-scoring-analyst'
  | '2A-message-architect'      | '2B-pipeline-manager'
  | '3A-discovery-conductor'    | '3B-proposal-writer'
  | '4A-spec-designer'          | '4B-qa-engineer'
  | '5A-health-analyst'         | '5B-win-reporter'
  | '6A-presentation-coach'     | '6B-contract-orchestrator'
  | '7A-signal-monitor'         | '7B-sequence-manager'
  | '8A-pattern-collector'      | '8B-playbook-updater'
  | '9A-portfolio-monitor'      | '9B-financial-metrics'
  | '10A-research-finder'       | '10B-drafter-publisher'
  | '11A-prospect-research'     | '11B-pipeline-manager-bd'
  | '12A-compliance-tracker'    | '12B-invoice-manager'
  | '13A-calendar-intelligence' | '13B-deliverable-tracker';

export type AgentId =
  | 'agent-1-market-intelligence'
  | 'agent-2-outbound-appointment'
  | 'agent-3-sales-engineer'
  | 'agent-4-systems-builder'
  | 'agent-5-client-success'
  | 'agent-6-closer'
  | 'agent-7-nurture'
  | 'agent-8-intelligence'
  | 'agent-9-revenue-intelligence'
  | 'agent-10-content'
  | 'agent-11-business-development'
  | 'agent-12-compliance'
  | 'agent-13-internal-ops';

// ============================================================================
// SUB-AGENT RESULT
// ============================================================================

export interface SubAgentResult<TResult> {
  sub_agent_id: SubAgentId;
  parent_agent_id: AgentId;
  task_completed: boolean;
  result: TResult | null;
  confidence: 'high' | 'medium' | 'low';
  cost_usd: number;
  duration_ms: number;
  model_used: string;
  tokens_input: number;
  tokens_output: number;
  processing_notes: string[];
  fallbacks_used: string[];
  evidence_tier?: 'tier_1_high' | 'tier_2_medium' | 'tier_3_low';
  escalation_needed: boolean;
  escalation_reason?: string;
  escalation_severity?: 'P1' | 'P2' | 'P3';
}

// ============================================================================
// SUB-AGENT CONTEXT (input to every sub-agent)
// ============================================================================

export interface SubAgentContext<TInputs = Record<string, unknown>> {
  parent_agent_id: AgentId;
  sub_agent_id: SubAgentId;
  client_id: string;
  pipeline_run_id?: string;
  pipeline_session_id?: string;

  task: string;
  memory_context: string;
  inputs: TInputs;
  max_response_tokens: number;
  confidence_required: 'high' | 'medium' | 'low';
  time_budget_ms: number;
  mode: 'fast' | 'balanced' | 'quality';
  task_profile: TaskProfile;
}

// ============================================================================
// AGENT SYNTHESIS RESULT (parent agent final output)
// ============================================================================

export interface AgentSynthesisResult<TOutput> {
  agent_id: AgentId;
  final_output: TOutput;
  sub_agent_results: SubAgentResult<unknown>[];
  total_cost_usd: number;
  total_duration_ms: number;
  synthesis_notes: string[];
  overall_confidence: 'high' | 'medium' | 'low';
  requires_human_attention: boolean;
  human_attention_reason?: string;
}

// ============================================================================
// AGGREGATION PATTERN CONFIG
// ============================================================================

export type AggregationPattern = 'sequential' | 'parallel' | 'conditional';

export interface SequentialConfig<TA, TB, TOutput> {
  pattern: 'sequential';
  totalTimeoutMs: number;
  timeSplitA: number;
  timeSplitB: number;
  runA: (ctx: SubAgentContext) => Promise<SubAgentResult<TA>>;
  runB: (ctx: SubAgentContext, aResult: TA) => Promise<SubAgentResult<TB>>;
  synthesize: (a: SubAgentResult<TA>, b: SubAgentResult<TB>) => TOutput;
}

export interface ParallelConfig<TA, TB, TOutput> {
  pattern: 'parallel';
  totalTimeoutMs: number;
  timeSharedBudget: number;
  runA: (ctx: SubAgentContext) => Promise<SubAgentResult<TA>>;
  runB: (ctx: SubAgentContext) => Promise<SubAgentResult<TB>>;
  synthesize: (a: SubAgentResult<TA>, b: SubAgentResult<TB>) => TOutput;
}

export interface ConditionalConfig<TA, TB, TOutput> {
  pattern: 'conditional';
  totalTimeoutMs: number;
  timeSplitA: number;
  timeSplitB: number;
  runA: (ctx: SubAgentContext) => Promise<SubAgentResult<TA>>;
  shouldRunB: (aResult: SubAgentResult<TA>) => boolean;
  runB: (ctx: SubAgentContext, aResult: TA) => Promise<SubAgentResult<TB>>;
  synthesize: (a: SubAgentResult<TA>, b: SubAgentResult<TB> | null) => TOutput;
}
