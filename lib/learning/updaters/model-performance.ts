/**
 * Model Performance Learning Updater
 *
 * Tracks edit signals per task profile to identify when a model needs upgrading.
 * Always defers to Pedro — never auto-modifies TASK_PROFILES.
 *
 * Source: UPTIMIZE_CLAUDE_CODE_MASTER_V2.md (Sprint 11.3)
 */

export interface ModelPerformanceRecord {
  task_profile: string;
  model_used: string;
  total_runs: number;
  minor_edits: number;
  significant_edits: number;
  full_rewrites: number;
  rewrite_rate: number;            // full_rewrites / total_runs
  significant_edit_rate: number;   // (significant + full) / total_runs
}

export type ModelPerformanceAction = 'no_change' | 'flag_for_review' | 'recommend_upgrade';

export interface ModelPerformanceEvaluation {
  action: ModelPerformanceAction;
  recommendation?: string;
}

export const SIGNIFICANT_EDIT_UPGRADE_THRESHOLD = 0.30;
export const SIGNIFICANT_EDIT_FLAG_THRESHOLD = 0.15;
export const MIN_RUNS_FOR_UPGRADE = 10;
export const MIN_RUNS_FOR_FLAG = 5;

export function evaluateModelPerformance(record: ModelPerformanceRecord): ModelPerformanceEvaluation {
  if (record.total_runs >= MIN_RUNS_FOR_UPGRADE && record.significant_edit_rate > SIGNIFICANT_EDIT_UPGRADE_THRESHOLD) {
    return {
      action: 'recommend_upgrade',
      recommendation:
        `Task profile '${record.task_profile}' using ${record.model_used} has a ` +
        `${Math.round(record.significant_edit_rate * 100)}% edit rate across ${record.total_runs} runs. ` +
        `Consider upgrading to next tier.`,
    };
  }

  if (record.total_runs >= MIN_RUNS_FOR_FLAG && record.significant_edit_rate > SIGNIFICANT_EDIT_FLAG_THRESHOLD) {
    return {
      action: 'flag_for_review',
      recommendation:
        `Task profile '${record.task_profile}' using ${record.model_used} edit rate ` +
        `${Math.round(record.significant_edit_rate * 100)}% across ${record.total_runs} runs — within flag range.`,
    };
  }

  return { action: 'no_change' };
}

/**
 * Build a model_performance LearningEvent payload from an aggregated record.
 * The LearningEvent itself is created by the caller (typically the
 * harness that observes Pedro's edits to agent outputs).
 */
export function buildModelPerformanceLearningPayload(record: ModelPerformanceRecord): {
  learning_type: 'model_performance';
  key: string;
  value: string;
} {
  return {
    learning_type: 'model_performance',
    key: `${record.task_profile}:${record.model_used}`,
    value: JSON.stringify({
      total_runs: record.total_runs,
      minor_edits: record.minor_edits,
      significant_edits: record.significant_edits,
      full_rewrites: record.full_rewrites,
      rewrite_rate: record.rewrite_rate,
      significant_edit_rate: record.significant_edit_rate,
      evaluation: evaluateModelPerformance(record),
    }),
  };
}
