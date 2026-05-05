/**
 * UptimizeAI Agent 6 — Closer & Onboarding Coordinator
 * Main export module
 */

export { runAgent6Closer, AGENT_6_SYSTEM_PROMPT, type Agent6Config } from './agent';

export type {
  Agent6Input,
  CloseAndOnboardingOutput,
  PresentationCoachResult,
  ContractOrchestratorResult,
  PrePresentationGuide,
  PostPresentationDebrief,
  PresentationOutcome,
  PresentationOutcomeStatus,
  ContractStatus,
  CredentialStatus,
  ConfirmedCredential,
  CredentialBlocker,
  ClientSetup,
  ScopeModification,
  BuildDirective,
  AgreedScope,
  Agent4Briefing,
  ProposalPackage,
  ProposalTierOption,
  MoneyLeakMap,
  ClosePlan,
  AnticipatedObjection,
  ClientIntelligence,
  RequiredIntegration,
  BuildReadiness,
  Tier,
} from './types';
