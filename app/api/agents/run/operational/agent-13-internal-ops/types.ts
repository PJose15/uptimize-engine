/**
 * Agent 13 — Internal Operations & Scheduling — Types
 *
 * Source: UPTIMIZE_OPERATIONAL_AGENTS_COMPLETE.md (Part 6)
 */

export type CommitmentPriority = 'P1' | 'P2' | 'P3' | 'P4';
export type CommitmentStatus = 'open' | 'completed' | 'deferred';
export type CommitmentToType = 'client' | 'partner' | 'prospect' | 'team';

export interface CommitmentView {
  id: string;
  description: string;
  committed_to: string;
  committed_to_type: CommitmentToType;
  due_date: string;          // ISO 8601
  status: CommitmentStatus;
  priority: CommitmentPriority;
  source: string;
  days_overdue?: number;     // Computed if past due_date
}

// ============================================================================
// 13A — CALENDAR INTELLIGENCE RESULT
// ============================================================================

export interface ClientCallPrepBrief {
  client_name: string;
  company: string;
  scheduled_at: string;
  current_health_score?: number;
  health_trend?: 'up' | 'down' | 'stable';
  last_week_headline_win?: string;
  what_client_is_waiting_for?: string;
  what_client_needs_from_call: string;
  three_key_talking_points: string[];
  what_not_to_bring_up: string[];
  suggested_opening_line: string;
}

export interface BdCallPrepBrief {
  prospect_name: string;
  company: string;
  scheduled_at: string;
  research_summary?: string;
  research_missing: boolean;
  shadow_ops_hypothesis: string;
  recommended_opening_angle: string;
  three_questions_to_ask: string[];
  recommended_next_step: string;
}

export interface CalendarSummary {
  calls_today_count: number;
  calls_today_names: string[];
  calls_this_week_count: number;
  prep_briefs_ready: number;
  prep_briefs_missing: string[]; // List of call IDs missing research
}

export interface CalendarIntelligenceResult {
  client_call_prep_briefs: ClientCallPrepBrief[];
  bd_call_prep_briefs: BdCallPrepBrief[];
  calendar_summary: CalendarSummary;
}

// ============================================================================
// 13B — DELIVERABLE & COMMITMENT TRACKER RESULT
// ============================================================================

export interface DailyFocusItem {
  action: string;
  estimated_minutes: number;
  related_commitment_id?: string;
}

export interface OverloadTriage {
  is_overloaded: boolean;
  overdue_or_today_count: number;
  must_happen_today: string[];     // Commitment IDs (max 3)
  can_be_deferred: Array<{
    commitment_id: string;
    suggested_communication: string;
  }>;
}

export interface DeliverableTrackerResult {
  open_commitments: Array<CommitmentView & { recommended_action?: string }>;
  due_today: string[];     // Commitment IDs
  overdue: string[];
  this_week: string[];
  daily_focus_list: DailyFocusItem[];
  overload_triage: OverloadTriage;
}

// ============================================================================
// AGENT 13 INPUT / OUTPUT
// ============================================================================

export type Agent13TriggerType = 'daily_brief' | 'on_demand' | 'commitment_added';

export interface Agent13ExternalAlerts {
  revenue?: { overdue_invoices: number; health_drops: number; notes: string[] };
  compliance?: { renewals_approaching: number; baa_pending: number; notes: string[] };
  bd?: { stalled_prospects: number; new_referrals: number; notes: string[] };
  content?: { pending_approval: number; published_this_week: number };
}

export interface Agent13Input {
  trigger: Agent13TriggerType;
  date: string;                    // ISO 8601 (the day this brief is for)
  scheduled_calls: Array<{
    call_id: string;
    type: 'client_call' | 'bd_call';
    counterparty_name: string;
    counterparty_company: string;
    scheduled_at: string;
    notes?: string;
  }>;
  open_commitments: CommitmentView[];
  external_alerts: Agent13ExternalAlerts;
  recent_client_signals?: Record<string, unknown>;  // From Agent 5
  recent_bd_research?: Record<string, unknown>;     // From Agent 11A
}

export interface DailyBriefSection {
  todays_priority: string;        // SECTION 1 — single most important thing
  todays_calls: ClientCallPrepBrief[];
  todays_bd_calls: BdCallPrepBrief[];
  open_commitments_summary: Array<CommitmentView & { recommended_action?: string }>;
  quick_alerts: {
    revenue: string[];
    compliance: string[];
    bd: string[];
    content: string[];
  };
  this_week_view: string[];
  is_overloaded: boolean;
  overload_triage_recommendation?: string;
}

export interface InternalOpsOutput {
  date: string;
  daily_brief: DailyBriefSection;
  calendar: CalendarIntelligenceResult;
  deliverables: DeliverableTrackerResult;
  generated_at: string;
}
