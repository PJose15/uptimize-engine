/**
 * UptimizeAI Agent 5 - Client Success, Retention & Expansion
 * TypeScript Types (v2 - Shadow Ops Edition)
 */

export interface TrainingSession {
  session_name: string;
  duration_minutes: number;
  agenda: string[];
}

export interface OnboardingPlan {
  day_1: string[];
  day_3: string[];
  day_7: string[];
  training_sessions: TrainingSession[];
}

export interface ExceptionMetrics {
  exceptions_count_week: number;
  top_exceptions: string[];
  avg_time_to_resolution: string;
}

export interface AuditabilityMetrics {
  audit_trail_completeness: string;
  missing_log_events: string[];
}

export interface AdoptionDashboard {
  kpis: string[];
  usage_signals: string[];
  exception_metrics: ExceptionMetrics;
  auditability_metrics: AuditabilityMetrics;
  trend_notes: string;
}

export interface WeeklyWinReport {
  week_of: string;
  wins: string[];
  metrics_snapshot: string[];
  what_broke: string[];
  next_actions: string[];
}

export type TicketSeverity = 'P1' | 'P2' | 'P3';
export type TicketStatus = 'open' | 'in_progress' | 'blocked' | 'resolved';
export type TicketOwner = 'agent4' | 'agent5' | 'client' | 'you';

export interface Ticket {
  ticket_id: string;
  severity: TicketSeverity;
  issue: string;
  exception_tag: string;
  status: TicketStatus;
  owner: TicketOwner;
  next_step: string;
}

export interface ShadowOpsReductionReport {
  before_list: string[];
  after_list: string[];
  delta_summary: string;
  new_shadow_ops_detected: string[];
}

export type ImpactLevel = 'high' | 'medium' | 'low';
export type EffortLevel = 'high' | 'medium' | 'low';

export interface OptimizationItem {
  item: string;
  impact: ImpactLevel;
  effort: EffortLevel;
  priority: number; // 1-10
}

export interface ExpansionMap {
  phase_2_recommendations: string[];
  phase_3_optional: string[];
  upsell_triggers: string[];
}

export interface ProofAssetPipeline {
  testimonial_request_plan: string[];
  case_study_draft_outline: string[];
  roi_snapshot_points: string[];
  proof_angles_to_market: string[];
}

export type RiskLevel = 'healthy' | 'watch' | 'at_risk';

export interface ClientHealthScore {
  score_0_100: number;
  risk_level: RiskLevel;
  drivers: string[];
  interventions: string[];
}

/**
 * Main Agent 5 Output Interface
 */
export interface Agent5ClientSuccessPackage {
  onboarding_plan: OnboardingPlan;
  adoption_dashboard: AdoptionDashboard;
  weekly_win_report: WeeklyWinReport;
  issues_and_tickets: Ticket[];
  shadow_ops_reduction_report: ShadowOpsReductionReport;
  optimization_backlog: OptimizationItem[];
  expansion_map: ExpansionMap;
  proof_asset_pipeline: ProofAssetPipeline;
  client_health_score: ClientHealthScore;
}

/**
 * Input Interface - Handoff from Agent 4
 */
export interface Agent4HandoffKit {
  project_id: string;
  account_id: string;
  client_name: string;
  quickstart_5min: string[];
  daily_sop: string[];
  weekly_sop: string[];
  exception_sop: string[];
  training_plan: string[];
  admin_notes: string[];
  baseline_kpis: {
    kpi_name: string;
    baseline_value: string;
    target_value: string;
    measurement_method: string;
  }[];
  workflows_delivered: {
    workflow_id: string;
    workflow_name: string;
    goal: string;
    exception_paths_top5: string[];
    kpis_affected: string[];
  }[];
  shadow_ops_baseline: string[];
  exception_library: {
    exception_name: string;
    frequency: string;
    impact: string;
    current_handling: string;
  }[];
}

/**
 * Helper Types for Client Health Scoring
 */
export interface HealthScoreFactors {
  adoption_score: number; // 0-30
  kpi_trend_score: number; // 0-25
  responsiveness_score: number; // 0-20
  friction_score: number; // 0-15
  expansion_readiness_score: number; // 0-10
}

export function calculateHealthScore(factors: HealthScoreFactors): number {
  return (
    factors.adoption_score +
    factors.kpi_trend_score +
    factors.responsiveness_score +
    factors.friction_score +
    factors.expansion_readiness_score
  );
}

export function determineRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'healthy';
  if (score >= 60) return 'watch';
  return 'at_risk';
}

/**
 * Template Helpers
 */
export interface FVi7Checkpoint {
  day: 1 | 3 | 7;
  tasks: string[];
  success_criteria: string[];
}

export interface WeeklyWinReportTemplate {
  client_name: string;
  week_of: string;
  wins: string[];
  metrics: {
    metric_name: string;
    baseline: string;
    current: string;
    trend: 'up' | 'down' | 'stable';
  }[];
  issues: string[];
  next_actions: string[];
  expansion_note?: string;
}

export interface TestimonialRequest {
  client_name: string;
  contact_name: string;
  win_achieved: string;
  metric_improved: string;
  request_message: string;
  follow_up_cadence: string[];
}

export interface CaseStudyOutline {
  client_name: string;
  industry: string;
  problem_before: string;
  solution_implemented: string;
  results: {
    metric: string;
    before: string;
    after: string;
  }[];
  quote: string;
  next_phase: string;
}
