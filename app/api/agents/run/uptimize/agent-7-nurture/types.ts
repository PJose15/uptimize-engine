/**
 * UptimizeAI Agent 7 — Nurture Intelligence
 * Type definitions
 *
 * Source: UPTIMIZE_AGENT_PROMPTS_PIPELINE_V2.md (Agent 7 + 7A + 7B)
 * Source: UPTIMIZE_CLAUDE_CODE_MASTER_V2.md (Sprint 11.1)
 */

// ============================================================================
// NURTURE RECORD INPUT (subset of Prisma NurtureRecord shape)
// ============================================================================

export type NurtureCategory = 'hot' | 'warm' | 'cold' | 'lost_deal';

export interface NurtureRecordView {
  id: string;
  leadId: string;
  company: string;
  contactName?: string;
  vertical: string;
  category: NurtureCategory;
  reason: string;
  originalPain: string;
  whatWasTried: string[];
  readinessScore: number;
  reQualified: boolean;
  archived: boolean;
  lastTouch?: string;          // ISO 8601
  nextTouch?: string;          // ISO 8601
  touchCount: number;
  signalsFound: SignalObservation[];
  clientId: string;
  daysSinceLastContact: number;
}

// ============================================================================
// SIGNAL OBSERVATIONS
// ============================================================================

export type SignalKind =
  | 'new_review'
  | 'job_posting'
  | 'news_event'
  | 'social_activity'
  | 'competitor_signal'
  | 'status_change';

export interface SignalObservation {
  kind: SignalKind;
  description: string;
  observed_at: string;        // ISO 8601
  source?: string;            // URL or name
  raw?: string;               // Source text excerpt (anonymized)
}

// ============================================================================
// 7A — SIGNAL MONITOR RESULT
// ============================================================================

export type Recommendation =
  | 'continue_monitoring'
  | 'soft_touch'
  | 'reintroduce_to_pipeline'
  | 'archive';

export interface SignalAssessment {
  nurture_record_id: string;
  lead_id: string;
  company: string;
  vertical: string;
  category: NurtureCategory;
  signals_observed: Array<SignalObservation & { relevance_score: number }>;
  re_engagement_readiness: number; // 0-10
  recommendation: Recommendation;
  rationale: string;
  reintroduction_eligible: boolean; // ALL criteria met (Tier 1 signal + meaningfully different + min time)
}

export interface SignalMonitorResult {
  assessments: SignalAssessment[];
  batch_summary: {
    records_evaluated: number;
    signals_detected: number;
    reintroduce_count: number;
    soft_touch_count: number;
    monitor_count: number;
    archive_count: number;
  };
}

// ============================================================================
// 7B — SEQUENCE MANAGER RESULT
// ============================================================================

export type Angle =
  | 'shadow_ops'
  | 'exception_cost'
  | 'audit_trail'
  | 'knowledge_bottleneck'
  | 'handoff_failure'
  | 'channel_scatter'
  | 'vertical_trigger'
  | 'competitor_signal'
  | 'proof_result';

export type MessageLength = 'one_liner' | 'two_sentences' | 'short_paragraph';

export interface DraftedTouch {
  nurture_record_id: string;
  lead_id: string;
  company: string;
  category: NurtureCategory;
  channel: 'email' | 'linkedin' | 'sms' | 'whatsapp';
  angle: Angle;
  specific_reason: string;             // The completing sentence — required
  message_subject?: string;            // For email
  message_body: string;
  message_length: MessageLength;
  approval_required: true;             // ALWAYS true — non-configurable
  scheduled_for: string;               // ISO 8601
  next_touch_after_send: string;       // ISO 8601 — updated nextTouch
}

export interface SequenceManagerResult {
  touches_due: DraftedTouch[];
  records_archived: Array<{
    nurture_record_id: string;
    reason: string;
  }>;
  records_updated_next_touch: Array<{
    nurture_record_id: string;
    new_next_touch: string;
    reason: string;
  }>;
  batch_summary: {
    records_due: number;
    touches_drafted: number;
    archived_count: number;
    updated_count: number;
  };
}

// ============================================================================
// AGENT 7 INPUT / OUTPUT
// ============================================================================

export interface Agent7Input {
  records: NurtureRecordView[];
  triggered_by: 'cron' | 'on_demand' | 'agent2_added';
  client_id: string;
}

export interface NurtureIntelligenceOutput {
  signal_monitor: SignalMonitorResult;
  sequence_manager: SequenceManagerResult;

  // Synthesized routing decisions:
  reintroductions: Array<{
    nurture_record_id: string;
    lead_id: string;
    company: string;
    vertical: string;
    readiness_score: number;
    requalify_brief: string;       // Brief for Agent 1
  }>;

  approval_queue_entries: Array<{
    nurture_record_id: string;
    drafted_touch: DraftedTouch;   // From 7B — needs Pedro's approval
  }>;

  archived: Array<{
    nurture_record_id: string;
    reason: string;
  }>;

  next_touches_updated: Array<{
    nurture_record_id: string;
    new_next_touch: string;
  }>;

  escalations: Array<{
    severity: 'P2' | 'P3';
    nurture_record_id?: string;
    reason: string;
  }>;
}
