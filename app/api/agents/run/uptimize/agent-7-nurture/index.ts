/**
 * UptimizeAI Agent 7 — Nurture Intelligence
 * Main export module
 */

export { runAgent7Nurture, AGENT_7_SYSTEM_PROMPT, type Agent7Config } from './agent';

export {
  runNurtureIntelligenceBatch,
  onNurtureEntryAdded,
  type NurtureBatchSummary,
  type NurtureEntryInput,
} from './worker';

export type {
  Agent7Input,
  NurtureIntelligenceOutput,
  SignalMonitorResult,
  SequenceManagerResult,
  SignalAssessment,
  DraftedTouch,
  NurtureRecordView,
  NurtureCategory,
  SignalObservation,
  SignalKind,
  Recommendation,
  Angle,
  MessageLength,
} from './types';
