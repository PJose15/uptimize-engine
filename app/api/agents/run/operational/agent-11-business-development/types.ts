/**
 * Agent 11 — Business Development & Pipeline — Types
 * Source: UPTIMIZE_OPERATIONAL_AGENTS_COMPLETE.md (Part 4)
 */

export type BdRecordType = 'prospect' | 'partner' | 'referral';
export type BdStage =
  | 'identified' | 'researched' | 'contacted' | 'meeting_scheduled'
  | 'proposal_sent' | 'negotiating' | 'won' | 'lost';

export interface BdRecordView {
  id: string;
  type: BdRecordType;
  current_stage: BdStage;
  pipeline_value_usd: number;
  company_name: string;
  contact_name?: string;
  contact_email?: string;
  vertical?: string;
  last_contact?: string;             // ISO 8601
  next_action?: string;
  next_action_due?: string;          // ISO 8601
  research_brief_id?: string;
  referred_by?: string;              // clientId or partner_id
  days_since_last_contact?: number;  // Computed
  is_stalled: boolean;               // 7+ days no movement
}

// ============================================================================
// 11A — PROSPECT RESEARCH RESULT
// ============================================================================

export interface BdResearchBrief {
  bd_record_id: string;
  company: string;
  contact?: string;
  vertical?: string;
  shadow_ops_signals_observed: string[];
  shadow_ops_hypothesis: string;
  observable_pain_evidence: string[];
  recommended_opening_angle: string;
  three_questions_to_ask: string[];
  estimated_uptimize_fit_0_10: number;
  research_completed_at: string;
}

export interface ProspectResearchResult {
  briefs: BdResearchBrief[];
  research_missing_for: string[];   // BD record IDs without enough data to research
}

// ============================================================================
// 11B — PIPELINE STAGE MANAGER RESULT
// ============================================================================

export interface BdAction {
  bd_record_id: string;
  urgency: 'P1' | 'P2' | 'P3';
  description: string;
  due_by: string;
}

export interface PipelineStageManagerResult {
  records: BdRecordView[];
  actions_today: BdAction[];
  stalled: BdRecordView[];
  new_referrals: BdRecordView[];
  partnerships_in_progress: BdRecordView[];
  weekly_metrics: {
    calls_booked: number;
    proposals_in_close: number;
    referrals_active: number;
    pipeline_value_usd: number;
  };
}

// ============================================================================
// AGENT 11 INPUT / OUTPUT
// ============================================================================

export type Agent11Trigger = 'cron_daily' | 'on_referral_added' | 'on_demand';

export interface Agent11Input {
  trigger: Agent11Trigger;
  today: string;
  records: BdRecordView[];
  upcoming_calls: Array<{           // BD calls scheduled today/tomorrow
    bd_record_id: string;
    scheduled_at: string;
    counterparty_name: string;
  }>;
}

export interface BusinessDevelopmentOutput {
  research: ProspectResearchResult;
  pipeline: PipelineStageManagerResult;
  daily_digest: {
    actions_today: BdAction[];
    stalled_count: number;
    new_referrals_count: number;
    pipeline_value_usd: number;
  };
  generated_at: string;
}
