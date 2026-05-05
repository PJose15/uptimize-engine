/**
 * UptimizeAI Agent 8 — Vertical Intelligence Keeper
 * Main export module
 */

export { runAgent8IntelligenceKeeper, AGENT_8_SYSTEM_PROMPT, type Agent8Config } from './agent';

export {
  processLearningQueue,
  processLearningEventsForRun,
  generateWeeklyBrief,
  type LearningQueueSummary,
} from './worker';

export type {
  Agent8Input,
  IntelligenceKeeperOutput,
  PatternCollectorResult,
  PlaybookUpdaterResult,
  PatternEvaluation,
  AppliedUpdate,
  DistributionNotice,
  WeeklyIntelligenceBrief,
  IntelligenceBriefSection,
  ModelPerformanceSignal,
  PedroActionItem,
  LearningEventView,
  LearningType,
  Significance,
  SignificanceClassification,
} from './types';
