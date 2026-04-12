/**
 * SmartGym Member Retention Agent — Public exports
 */

export { runSmartGymMemberRetention } from "./agent";
export type {
  MemberRetentionContext,
  MemberRetentionResult,
  MemberRetentionOutput,
  HealthScore,
  RetentionAction,
  WinBackOffer,
  ChurnRiskTier,
  EngagementSignal,
} from "./types";
