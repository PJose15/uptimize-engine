/**
 * Types for SmartGym Member Retention Agent
 *
 * Health-scores members, flags churn risk,
 * and recommends retention actions and win-back offers.
 */

// ========================================
// INPUT CONTEXT
// ========================================

export type ChurnRiskTier = "critical" | "high" | "medium" | "low" | "healthy";

export type EngagementSignal = "class_attendance" | "check_in_frequency" | "pt_sessions" | "app_usage" | "referrals_made" | "social_engagement" | "merchandise_purchases";

export interface MemberRetentionContext {
  /** Member profile */
  memberProfile?: {
    memberId?: string;
    name?: string;
    memberSince?: string;
    membershipType?: string;
    monthlyRate?: number;
  };
  /** Attendance history summary */
  attendanceHistory?: {
    visitsThisMonth?: number;
    visitsLastMonth?: number;
    averageVisitsPerWeek?: number;
    daysSinceLastVisit?: number;
    favoriteClasses?: string[];
  };
  /** Billing status */
  billingStatus?: {
    paymentCurrent?: boolean;
    failedPayments?: number;
    lastPaymentDate?: string;
  };
  /** Engagement signals */
  engagementSignals?: EngagementSignal[];
  /** Additional notes */
  notes?: string;
}

// ========================================
// OUTPUT STRUCTURES
// ========================================

export interface HealthScore {
  overallScore: number; // 0-100
  breakdown: {
    attendanceScore: number;     // 0-25
    engagementScore: number;     // 0-25
    billingScore: number;        // 0-25
    tenureScore: number;         // 0-25
  };
  trend: "improving" | "stable" | "declining";
}

export interface RetentionAction {
  actionType: string;
  priority: "immediate" | "this_week" | "this_month";
  description: string;
  assignedTo: string;
  expectedImpact: string;
}

export interface WinBackOffer {
  offerName: string;
  offerDetails: string;
  validDays: number;
  estimatedConversionRate: string;
}

export interface MemberRetentionOutput {
  memberId: string;
  healthScore: HealthScore;
  churnRiskTier: ChurnRiskTier;
  churnProbability: string;
  riskFactors: string[];
  retentionActions: RetentionAction[];
  winBackOffers: WinBackOffer[];
  personalizedMessage: string;
}

// ========================================
// AGENT RESULT
// ========================================

export interface MemberRetentionResult {
  success: boolean;
  message: string;
  data?: MemberRetentionOutput;
  metadata?: {
    provider: string;
    model: string;
    tokensUsed?: number;
    timestamp: string;
    latencyMs: number;
  };
  error?: {
    type: string;
    details: string;
    timestamp: string;
  };
}
