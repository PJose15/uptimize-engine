/**
 * UptimizeAI Agent 5 - Client Success, Retention & Expansion
 * Main export module
 */

export {
  Agent5ClientSuccess,
  runAgent5,
  AGENT_5_SYSTEM_PROMPT,
  type Agent5Config,
  type Agent5Input,
} from './agent';

export type {
  Agent5ClientSuccessPackage,
  Agent4HandoffKit,
  OnboardingPlan,
  TrainingSession,
  AdoptionDashboard,
  ExceptionMetrics,
  AuditabilityMetrics,
  WeeklyWinReport,
  Ticket,
  TicketSeverity,
  TicketStatus,
  TicketOwner,
  ShadowOpsReductionReport,
  OptimizationItem,
  ImpactLevel,
  EffortLevel,
  ExpansionMap,
  ProofAssetPipeline,
  ClientHealthScore,
  RiskLevel,
  HealthScoreFactors,
  FVi7Checkpoint,
  WeeklyWinReportTemplate,
  TestimonialRequest,
  CaseStudyOutline,
} from './types';

export { calculateHealthScore, determineRiskLevel } from './types';
