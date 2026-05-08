/**
 * Agent 10 — Content & Thought Leadership — Types
 * Source: UPTIMIZE_OPERATIONAL_AGENTS_COMPLETE.md (Part 3)
 */

export type ContentType = 'linkedin_post' | 'article' | 'case_study_hook' | 'thread' | 'email';
export type Platform = 'linkedin' | 'twitter' | 'email' | 'blog';
export type ApprovalStatus = 'draft' | 'pending_pedro_review' | 'approved' | 'published' | 'rejected';

export type AngleSource =
  | 'agent5_recent_win'
  | 'agent8_validated_pattern'
  | 'industry_trigger'
  | 'pedro_framework'
  | 'vertical_pattern';

// ============================================================================
// 10A — RESEARCH FINDER RESULT
// ============================================================================

export interface ContentAngle {
  angle_id: string;
  angle_summary: string;             // The hook in 1-2 sentences
  content_type: ContentType;
  source: AngleSource;
  source_insight: string;            // Where the data came from (anonymized)
  why_now: string;
  target_audience: string;
  estimated_resonance_0_10: number;
  vertical?: string;
  framework_used?: string;
}

export interface ResearchFinderResult {
  angles: ContentAngle[];           // 5-7 per cycle per spec
  research_notes: string;
}

// ============================================================================
// 10B — DRAFTER & PUBLISHER RESULT
// ============================================================================

export interface ContentDraftView {
  draft_id: string;
  angle_id: string;
  content_type: ContentType;
  platform: Platform;
  title?: string;
  body_text: string;
  word_count: number;
  scheduled_for_recommendation?: string;  // ISO 8601
  approval_status: ApprovalStatus;        // Always 'pending_pedro_review' on draft
  source_insight: string;
  client_id_for_anonymized_data?: string; // Track-back only, not published
}

export interface ContentCalendarStatus {
  scheduled_count: number;
  pending_review_count: number;
  published_this_week: number;
  weeks_of_queue_remaining: number;
  queue_low_warning: boolean;             // True if < 1 week of approved content
}

export interface DrafterPublisherResult {
  drafts: ContentDraftView[];
  calendar_status: ContentCalendarStatus;
}

// ============================================================================
// AGENT 10 INPUT / OUTPUT
// ============================================================================

export type Agent10Trigger = 'cron_weekly' | 'on_proof_asset_ready' | 'on_demand';

export interface Agent10AgentSourceInputs {
  agent5_recent_wins?: Array<{
    client_anonymized_label: string;       // e.g., "fitness studio in PR"
    metric_before: string;
    metric_after: string;
    intervention_summary: string;
    pillar: string;
  }>;
  agent8_validated_patterns?: Array<{
    pattern_summary: string;
    vertical: string;
    confirmations: number;
    quantification?: string;
  }>;
  industry_triggers?: string[];
  pedro_frameworks_recently_used?: string[];
}

export interface Agent10Input {
  trigger: Agent10Trigger;
  week_of: string;
  source_inputs: Agent10AgentSourceInputs;
  current_calendar: ContentCalendarStatus;
}

export interface ContentIntelligenceOutput {
  research: ResearchFinderResult;
  drafter: DrafterPublisherResult;
  pedro_review_queue: ContentDraftView[];   // Always = drafter.drafts (none auto-approved)
  generated_at: string;
}
