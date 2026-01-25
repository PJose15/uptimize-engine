/**
 * TypeScript types for UptimizeAI Agent 3: Sales Engineer & Offer Architect
 */

// ============================================================================
// PRE-CALL BRIEF
// ============================================================================

export interface PreCallBrief {
  lead_id: string;
  hypotheses: string[];
  must_answer_questions: string[];
  meeting_goal: string;
}

// ============================================================================
// DISCOVERY NOTES (STRUCTURED)
// ============================================================================

export interface Leak {
  leak_name: string;
  where_it_happens: string;
  symptoms: string;
  root_cause_guess: string;
}

export interface Impact {
  time_cost: string;
  revenue_cost: string;
  quality_cost: string;
}

export interface DecisionProcess {
  decision_maker: string;
  stakeholders: string[];
  budget_range_known: boolean;
  timeline: string;
  procurement_notes: string;
}

export interface DiscoveryNotesStructured {
  current_process_map: string[]; // Steps from lead/task intake to completion
  leaks: Leak[];
  impact: Impact;
  success_criteria: string[]; // Measurable outcomes
  constraints: string[]; // Tools, security, approvals, timeline, team limits
  decision_process: DecisionProcess;
}

// ============================================================================
// VALUE CALCULATION
// ============================================================================

export interface ValueCalc {
  assumptions: string[];
  time_saved_per_week_hours: number;
  cost_per_hour_assumption: number;
  monthly_value_estimate: number;
  notes: string;
}

// ============================================================================
// SOLUTION BLUEPRINT
// ============================================================================

export interface PhaseBlock {
  goal: string;
  deliverables: string[];
  time_to_value: string;
  dependencies: string[];
}

export interface SolutionBlueprint {
  phase_1: PhaseBlock;
  phase_2: PhaseBlock;
  phase_3_optional: PhaseBlock;
  kpis_to_track: string[];
}

// ============================================================================
// PROPOSAL / SOW
// ============================================================================

export interface PricingOption {
  option_name: string;
  price: string;
  what_included: string[];
  best_for: string;
}

export interface ProposalSOW {
  summary: string;
  deliverables: string[];
  timeline: string;
  pricing_options: PricingOption[];
  client_responsibilities: string[];
  assumptions_exclusions: string[];
  change_request_process: string;
  acceptance_criteria: string[];
  exception_paths_committed: string[]; // v2
  audit_trail_commitment: string[]; // v2
}

// ============================================================================
// CLOSE PLAN
// ============================================================================

export interface FollowUpSchedule {
  day_offset: number;
  message: string;
}

export interface ClosePlan {
  primary_objections_expected: string[];
  responses: string[];
  next_steps: string[];
  follow_up_schedule: FollowUpSchedule[];
}

// ============================================================================
// SHADOW OPS MAP (v2)
// ============================================================================

export interface ShadowOpsTask {
  task: string;
  frequency: "daily" | "weekly" | "monthly" | "ad_hoc";
  impact: "high" | "medium" | "low";
  why_it_exists: string;
}

export interface ShadowOpsMap {
  top_invisible_tasks_ranked: ShadowOpsTask[];
  off_system_channels: string[];
  context_loss_points: string[];
  audit_gaps: string[];
}

// ============================================================================
// EXCEPTION LIBRARY (v2)
// ============================================================================

export interface Exception {
  exception_name: string;
  frequency: "daily" | "weekly" | "monthly" | "ad_hoc";
  impact: "high" | "medium" | "low";
  current_handling: string;
  desired_handling: string;
}

export interface ExceptionLibrary {
  top_exceptions_ranked: Exception[];
  exception_metrics_assumptions: string[];
  exceptions_to_productize: string[];
}

// ============================================================================
// HANDOFF TO AGENT 4 (DELIVERY SPEC)
// ============================================================================

export interface HandoffToAgent4Spec {
  build_modules: string[];
  integrations: string[];
  agent_specs_needed: string[];
  risks: string[];
  definition_of_done: string[];
  top_exceptions_to_handle: string[]; // v2
  audit_trail_fields_required: string[]; // v2
}

// ============================================================================
// MAIN OUTPUT STRUCTURE
// ============================================================================

export interface Agent3Output {
  pre_call_brief: PreCallBrief;
  discovery_notes_structured: DiscoveryNotesStructured;
  shadow_ops_map: ShadowOpsMap; // v2
  exception_library: ExceptionLibrary; // v2
  value_calc: ValueCalc;
  solution_blueprint: SolutionBlueprint;
  proposal_sow: ProposalSOW;
  close_plan: ClosePlan;
  handoff_to_agent4_spec: HandoffToAgent4Spec;
}

// ============================================================================
// INPUT CONTEXT
// ============================================================================

export interface QualifiedLeadBrief {
  lead_id?: string;
  problem?: string;
  impact?: string;
  urgency?: string;
  authority?: string;
  stack?: string[];
  timeline?: string;
  tags?: string[];
  notes?: string;
}

export interface CallContext {
  call_transcript_summary?: string;
  call_notes?: string;
  call_duration_minutes?: number;
  attendees?: string[];
}

export interface OfferCatalog {
  packages?: Array<{
    name: string;
    description: string;
    pricing_range?: string;
    typical_deliverables?: string[];
  }>;
  pricing_philosophy?: string;
}

export interface Agent3Context {
  qualified_lead_brief?: QualifiedLeadBrief;
  call_context?: CallContext;
  offer_catalog?: OfferCatalog;
  mode?: "pre_call_prep" | "discovery_execution" | "proposal_generation" | "close_plan_only";
  custom_constraints?: string[];
  skip_pricing?: boolean; // If true, don't include pricing in proposal
}

// ============================================================================
// AGENT EXECUTION RESULT
// ============================================================================

export interface Agent3Result {
  success: boolean;
  message: string;
  data?: Agent3Output;
  metadata?: {
    provider: string;
    model: string;
    tokensUsed?: number;
    timestamp: string;
    latencyMs: number;
  };
  error?: {
    type: string;
    details: string;
    timestamp: string;
  };
}
