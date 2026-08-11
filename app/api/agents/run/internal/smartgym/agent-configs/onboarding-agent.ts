/**
 * SmartGym Onboarding Agent — STUB (Sprint 14.2)
 *
 * MISSION
 * Guide new members through their first 30 days: drive habit formation, surface
 * the right next-step (class booking, trainer intro, app setup), detect
 * early-warning churn signals (no-show in week 1, drop after intro), and
 * graduate the member to steady-state engagement.
 *
 * Full implementation is a future cycle.
 */

export interface OnboardingContext {
  memberId: string;
  gymLocation: string;
  joinDate: string;            // ISO date
  /** 1..30 — what day of the onboarding window we're on */
  onboardingDay: number;
  intakeGoals?: string[];
  /** Activity so far in onboarding window */
  activitySoFar?: {
    visits: number;
    classesBooked: number;
    trainerSessions: number;
    appOpens?: number;
  };
  /** Missed scheduled events (e.g., no-show intro) */
  missedTouchpoints?: string[];
  notes?: string;
}

export interface OnboardingNextStep {
  step: 'schedule_intro' | 'book_first_class' | 'app_setup' | 'check_in_call' | 'win_back' | 'graduate';
  channel: 'sms' | 'email' | 'push' | 'phone_call';
  timing: 'now' | string;
  messageDraft: string;
  rationale: string;
}

export interface OnboardingOutput {
  memberId: string;
  onboardingHealth: 'on_track' | 'at_risk' | 'stalled';
  habitFormationScore: number; // 0-100
  nextSteps: OnboardingNextStep[];
  /** True if member should exit onboarding into steady-state engagement */
  readyToGraduate: boolean;
  reasoning: string;
}

export interface OnboardingResult {
  success: boolean;
  message: string;
  data?: OnboardingOutput;
  error?: { type: string; details: string; timestamp: string };
}

export const ONBOARDING_AGENT_CONFIG = {
  ventureId: 'smartgym',
  agentId: 'onboarding',
  name: 'Onboarding Agent',
  mission:
    'Drive habit formation in a new member\'s first 30 days and detect early churn risk.',
  status: 'stub' as const,
  futureImplementationNotes:
    'Triggered by Member.created event. Runs daily for each member in days 1-30. Hands off to member-engagement-agent on graduation.',
} as const;

export async function runOnboarding(
  _context: OnboardingContext,
): Promise<OnboardingResult> {
  return {
    success: false,
    message: 'Not implemented — Sprint 14.2 stub',
    error: {
      type: 'NOT_IMPLEMENTED',
      details: 'See ONBOARDING_AGENT_CONFIG.futureImplementationNotes',
      timestamp: new Date().toISOString(),
    },
  };
}
