/**
 * UptimizeAI Agent 8 — Vertical Intelligence Keeper
 * Type definitions
 *
 * Source: UPTIMIZE_AGENT_PROMPTS_PIPELINE_V2.md (Agent 8 + 8A + 8B)
 * Source: UPTIMIZE_CLAUDE_CODE_MASTER_V2.md (Sprint 11.2 + 11.3)
 */

// ============================================================================
// LEARNING TYPES (matches lib/types/handoff-schemas-v2.ts)
// ============================================================================

export type LearningType =
  | 'shadow_ops_signal_weight'
  | 'fit_score_dimension_weight'
  | 'money_leak_multiplier'
  | 'exception_pattern'
  | 'outreach_hook_performance'
  | 'health_score_driver'
  | 'intervention_effectiveness'
  | 'vertical_benchmark_update'
  | 'integration_quirk'
  | 'model_performance';

export type Significance = 'flag_only' | 'emerging' | 'tentative' | 'validated' | 'contradicted';

// ============================================================================
// LEARNING EVENT INPUT (subset of Prisma LearningEvent shape)
// ============================================================================

export interface LearningEventView {
  id: string;
  source_agent_id: string;
  source_run_id?: string;
  vertical: string;
  learning_type: LearningType | string; // tolerate unknown types from old data
  key: string;
  value: string;       // JSON string (anonymized)
  data_points: number;
  confidence: number;
  significance: Significance | string;
  created_at: string;  // ISO 8601
}

// ============================================================================
// 8A — PATTERN COLLECTOR RESULT
// ============================================================================

export type SignificanceClassification = 'watch' | 'tentative' | 'validated' | 'flag';

export interface PatternEvaluation {
  learning_event_ids: string[];   // Events that contributed to this evaluation
  vertical: string;
  learning_type: LearningType | string;
  key: string;
  data_points_collected: number;  // Total existing + new for this pattern
  significance: SignificanceClassification;
  basis: string;                  // 1-2 sentence rationale
  contradicts_existing?: {
    existing_value_summary: string;
    new_value_summary: string;
  };
  quantification?: {
    estimated_value: string;
    actual_value: string;
    percentage_difference: number;
  };
  recommended_action: 'no_change' | 'tentative_update' | 'confirmed_update' | 'flag_for_pedro';
  recommended_update?: {
    target: string;             // e.g., "playbook:fitness:shadow_ops_signals"
    old_summary: string;
    new_summary: string;
  };
}

export interface PatternCollectorResult {
  evaluations: PatternEvaluation[];
  events_processed: number;
  contradictions_detected: number;
}

// ============================================================================
// 8B — PLAYBOOK UPDATER RESULT
// ============================================================================

export interface AppliedUpdate {
  evaluation_index: number;       // Index into PatternCollectorResult.evaluations
  target: string;                 // What was updated
  scope: 'playbook' | 'exception_library' | 'multiplier' | 'agent_learning' | 'fit_score_weights';
  old_content_summary: string;    // REQUIRED for audit
  new_content_summary: string;    // REQUIRED for audit
  applied_label: 'EMERGING' | 'VALIDATED'; // 8A flag_only never reaches 8B
  applied_at: string;             // ISO 8601
  data_points: number;
  agent_learning_id?: string;     // Link to AgentLearning row when applicable
  multiplier_change_pct?: number; // Capped to ±15% per cycle
}

export interface DistributionNotice {
  agent_learning_id: string;
  target_agent_id: string;
  effective_from: string;
}

export interface IntelligenceBriefSection {
  vertical: string;
  validated_updates: number;
  emerging_patterns: number;
  contradictions_for_pedro: number;
  highlights: string[];           // Specific behavioral changes
}

export interface ModelPerformanceSignal {
  task_profile: string;
  model_used: string;
  total_runs: number;
  significant_edit_rate: number;
  recommendation_action: 'no_change' | 'flag_for_review' | 'recommend_upgrade';
  recommendation_text?: string;
}

export interface PedroActionItem {
  category: 'contradiction' | 'large_multiplier_shift' | 'model_performance' | 'archival_candidate';
  description: string;            // Specific, actionable
  decision_required: string;      // The exact decision Pedro needs to make
  evaluation_indices: number[];   // Indexes into evaluations
}

export interface WeeklyIntelligenceBrief {
  week_of: string;                // ISO 8601
  sections: IntelligenceBriefSection[];
  model_performance_signals: ModelPerformanceSignal[];
  pedro_action_items: PedroActionItem[];
  total_events_processed: number;
  total_updates_applied: number;
}

export interface PlaybookUpdaterResult {
  updates_applied: AppliedUpdate[];
  distribution_notices: DistributionNotice[];
  weekly_brief?: WeeklyIntelligenceBrief; // Only on weekly run
  deferred_to_pedro: PedroActionItem[];
}

// ============================================================================
// AGENT 8 INPUT / OUTPUT
// ============================================================================

export interface Agent8Input {
  events: LearningEventView[];
  triggered_by: 'event' | 'cron_batch' | 'weekly_brief';
  weekly_window?: { week_of: string };
}

export interface IntelligenceKeeperOutput {
  pattern_collector: PatternCollectorResult;
  playbook_updater: PlaybookUpdaterResult;

  // Synthesized:
  events_to_mark_applied: string[];  // LearningEvent IDs to set applied=true
  pedro_review_required: PedroActionItem[];
  total_cost_usd: number;
  weekly_brief?: WeeklyIntelligenceBrief;
}
