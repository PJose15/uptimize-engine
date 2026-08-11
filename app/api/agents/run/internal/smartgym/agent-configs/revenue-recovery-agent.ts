/**
 * SmartGym Revenue Recovery Agent — STUB (Sprint 14.2)
 *
 * MISSION
 * Recover lost or at-risk revenue: failed-payment retries with personalized
 * outreach, win-back campaigns for recently-churned members, frozen-account
 * reactivation, and refund-leak detection.
 *
 * Full implementation is a future cycle.
 */

export type RevenueLossType =
  | 'failed_payment'
  | 'recent_cancellation'
  | 'frozen_account'
  | 'card_expiring'
  | 'unused_credit';

export interface RevenueLossRecord {
  memberId: string;
  lossType: RevenueLossType;
  amountUsd: number;
  occurredAt: string;          // ISO datetime
  failureReason?: string;      // for failed payments
  cancellationReason?: string; // for cancellations
  attemptCount?: number;
}

export interface RevenueRecoveryContext {
  gymLocation: string;
  losses: RevenueLossRecord[];
  notes?: string;
}

export interface RecoveryAction {
  memberId: string;
  channel: 'sms' | 'email' | 'phone_call' | 'in_app';
  timing: 'now' | string;
  messageDraft: string;
  offerType?: 'discount' | 'pause_extension' | 'service_swap' | 'none';
  offerValueUsd?: number;
  expectedRecoveryPct: number; // model estimate, 0-100
}

export interface RevenueRecoveryOutput {
  gymLocation: string;
  totalAtRiskUsd: number;
  estimatedRecoverableUsd: number;
  actions: RecoveryAction[];
  unrecoverableSummary?: string;
}

export interface RevenueRecoveryResult {
  success: boolean;
  message: string;
  data?: RevenueRecoveryOutput;
  error?: { type: string; details: string; timestamp: string };
}

export const REVENUE_RECOVERY_AGENT_CONFIG = {
  ventureId: 'smartgym',
  agentId: 'revenue-recovery',
  name: 'Revenue Recovery Agent',
  mission:
    'Recover lost and at-risk revenue through targeted outreach, win-back offers, and payment retries.',
  status: 'stub' as const,
  futureImplementationNotes:
    'Reads from Payment + Membership models. Daily cron 9 AM. Discount offers > $50 require Pedro approval (gate).',
} as const;

export async function runRevenueRecovery(
  _context: RevenueRecoveryContext,
): Promise<RevenueRecoveryResult> {
  return {
    success: false,
    message: 'Not implemented — Sprint 14.2 stub',
    error: {
      type: 'NOT_IMPLEMENTED',
      details: 'See REVENUE_RECOVERY_AGENT_CONFIG.futureImplementationNotes',
      timestamp: new Date().toISOString(),
    },
  };
}
