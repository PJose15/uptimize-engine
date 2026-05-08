/**
 * Agent 4: Systems Builder & Delivery Orchestrator
 *
 * Public exports for the Systems Delivery agent
 */

export { runAgent4SystemsDelivery } from "./agent";
export { runAgent4SubAgent, type RunAgent4SubAgentConfig } from "./subagent-orchestrator";
export type { SpecDesignerResult, SpecDesignerInput } from "./subagents/4a-spec-designer";
export type { QaEngineerResult } from "./subagents/4b-qa-engineer";
export type {
  Agent4Context,
  Agent4Result,
  DeliveryPackageOutput,
  BuildPlan,
  PhasePlan,
  Milestone,
  DataModel,
  WorkflowSpec,
  ExceptionPath,
  ClientAgentSpec,
  QAPlanAndResults,
  TestCase,
  FallbackMode,
  ClientHandoffKit,
  PostLaunchMonitoring,
  Agent3HandoffSpec,
  ClientToolsAccess,
  BusinessRules,
  TeamRole,
} from "./types";
