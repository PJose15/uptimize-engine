/**
 * Sub-Agent Library — Barrel Export
 */

// Types
export type {
  SubAgentId,
  AgentId,
  SubAgentResult,
  SubAgentContext,
  AgentSynthesisResult,
  AggregationPattern,
  SequentialConfig,
  ParallelConfig,
  ConditionalConfig,
} from './types';

// Patterns
export { runSequential } from './patterns/sequential';
export { runParallel } from './patterns/parallel';
export { runConditional } from './patterns/conditional';

// Recovery
export { buildP1Failure, buildFailedSynthesis, buildSynthesisResult } from './recovery';

// Context
export { buildSubAgentContext, filterMemoryForSubAgent, SUBAGENT_MEMORY_KEYS } from './context-builder';

// Logger
export { logSubAgentRun } from './logger';

// Cost
export { aggregateSubAgentCosts } from './cost';
export type { AgentCostSummary } from './cost';

// Validator
export { parseAndValidate, validateSubAgentResult } from './validator';
