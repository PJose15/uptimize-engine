/**
 * SmartGym Member Engagement Agent — STUB (Sprint 14.2)
 *
 * MISSION
 * Keep active members engaged across their lifecycle: check-ins at meaningful
 * intervals, celebrate milestones (streaks, PRs, anniversaries), surface
 * personalized class/trainer recommendations, detect early disengagement signals
 * before they become churn risk.
 *
 * Full implementation is a future cycle. The shape below is the contract that
 * downstream code and the worker dispatcher will rely on.
 */

export interface MemberEngagementContext {
  memberId: string;
  gymLocation?: string;
  /** Days since member joined */
  tenureDays?: number;
  /** Visits in the last 30 days (used to flag drop-off) */
  recentVisitCount?: number;
  /** Most recent milestone the system has not yet acknowledged */
  pendingMilestone?: {
    type: 'streak' | 'anniversary' | 'goal_hit' | 'class_count';
    value: number | string;
  };
  /** Member's stated goals (from intake) */
  goals?: string[];
  notes?: string;
}

export interface EngagementAction {
  channel: 'sms' | 'email' | 'push' | 'in_app';
  timing: 'now' | string; // ISO datetime
  messageDraft: string;
  intent: 'check_in' | 'celebrate' | 'recommend' | 'win_back';
}

export interface MemberEngagementOutput {
  memberId: string;
  engagementScore: number;          // 0-100
  disengagementRisk: 'low' | 'medium' | 'high';
  recommendedActions: EngagementAction[];
  reasoning: string;
}

export interface MemberEngagementResult {
  success: boolean;
  message: string;
  data?: MemberEngagementOutput;
  error?: { type: string; details: string; timestamp: string };
}

export const MEMBER_ENGAGEMENT_AGENT_CONFIG = {
  ventureId: 'smartgym',
  agentId: 'member-engagement',
  name: 'Member Engagement Agent',
  mission:
    'Keep active members engaged through milestone celebrations, timely check-ins, and early disengagement detection.',
  status: 'stub' as const,
  futureImplementationNotes:
    'Wire to MemberActivity events. Use TASK_PROFILES["sub-customer-success"]. Output drives SMS/email queue.',
} as const;

export async function runMemberEngagement(
  _context: MemberEngagementContext,
): Promise<MemberEngagementResult> {
  return {
    success: false,
    message: 'Not implemented — Sprint 14.2 stub',
    error: {
      type: 'NOT_IMPLEMENTED',
      details: 'See MEMBER_ENGAGEMENT_AGENT_CONFIG.futureImplementationNotes',
      timestamp: new Date().toISOString(),
    },
  };
}
