/**
 * Types for Agent 4: Systems Builder & Delivery Orchestrator
 *
 * This agent converts signed scopes into stable, usable systems.
 */

// ========================================
// INPUT CONTEXT
// ========================================

export interface Agent4Context {
  /**
   * Handoff specification from Agent 3 (Sales Engineer)
   * Contains build modules, integrations, risks, and definition of done
   */
  handoffSpec?: Agent3HandoffSpec;

  /**
   * List of client tools and access constraints
   */
  clientTools?: ClientToolsAccess;

  /**
   * Business rules: hours, policies, routing rules, team roles
   */
  businessRules?: BusinessRules;

  /**
   * Optional notes or special instructions
   */
  notes?: string;

  /**
   * Target delivery timeline (defaults to 7-14 days for Phase 1)
   */
  targetTimelineDays?: number;
}

export interface Agent3HandoffSpec {
  buildModules: string[];
  integrations: string[];
  risks: string[];
  definitionOfDone: string[];
  scopeReference?: string;
  signedDate?: string;
}

export interface ClientToolsAccess {
  available: string[];
  restricted: string[];
  credentials?: Record<string, string>;
  accessConstraints?: string[];
}

export interface BusinessRules {
  operatingHours?: string;
  policies?: string[];
  routingRules?: string[];
  teamRoles?: TeamRole[];
}

export interface TeamRole {
  role: string;
  responsibilities: string[];
  permissions: string[];
}

// ========================================
// OUTPUT STRUCTURES
// ========================================

export interface Agent4Result {
  success: boolean;
  message: string;
  data?: DeliveryPackageOutput;
  metadata?: ResponseMetadata;
  error?: ErrorInfo;
}

export interface ResponseMetadata {
  provider: string;
  model: string;
  tokensUsed?: number;
  timestamp: string;
  latencyMs: number;
}

export interface ErrorInfo {
  type: string;
  details: string;
  timestamp: string;
}

// ========================================
// DELIVERY PACKAGE OUTPUT
// ========================================

export interface DeliveryPackageOutput {
  build_plan: BuildPlan;
  data_model: DataModel;
  workflow_specs: WorkflowSpec[];
  agent_spec_sheets: AgentSpecSheet[];
  qa_plan_and_results: QAPlanAndResults;
  fallback_modes: FallbackMode[];
  client_handoff_kit: ClientHandoffKit;
  post_launch_monitoring: PostLaunchMonitoring;
}

// ========================================
// BUILD PLAN
// ========================================

export interface BuildPlan {
  phase_1: PhasePlan;
  phase_2_optional: PhasePlan;
  milestones: Milestone[];
  dependencies: string[];
  change_request_linkage: string;
}

export interface PhasePlan {
  goal: string;
  deliverables: string[];
  time_to_value: string;
  dependencies: string[];
}

export interface Milestone {
  milestone_name: string;
  deliverables: string[];
  eta_days: number;
  acceptance_criteria: string[];
}

// ========================================
// DATA MODEL
// ========================================

export interface DataModel {
  entities: string[];
  fields: string[];
  logging_fields: string[];
  pipeline_stages: string[];
}

// ========================================
// WORKFLOW SPEC
// ========================================

export interface WorkflowSpec {
  workflow_name: string;
  goal: string;
  inputs: string[];
  outputs: string[];
  tools: string[];
  happy_path_steps: string[];
  exception_paths: ExceptionPath[];
  kpis_affected: string[];
}

export interface ExceptionPath {
  exception_name: string;
  trigger: string;
  behavior: string;
  escalation: string;
}

// ========================================
// AGENT SPEC SHEET
// ========================================

export interface AgentSpecSheet {
  agent_name: string;
  purpose: string;
  allowed_actions: string[];
  disallowed_actions: string[];
  tool_permissions: string[];
  input_contract: string[];
  output_contract: string[];
  guardrails: string[];
  escalation_rules: string[];
  logging: string[];
}

// ========================================
// QA PLAN AND RESULTS
// ========================================

export interface QAPlanAndResults {
  qa_checklist: string[];
  test_cases: TestCase[];
  results_summary: string;
  open_issues: string[];
}

export interface TestCase {
  test_name: string;
  type: "happy_path" | "missing_input" | "wrong_input" | "tool_failure" | "safety";
  steps: string[];
  expected_result: string;
  status: "pass" | "fail" | "blocked";
}

// ========================================
// FALLBACK MODES
// ========================================

export interface FallbackMode {
  workflow_name: string;
  failure_mode: string;
  fallback_behavior: string;
  human_action_required: string;
  logging: string;
}

// ========================================
// CLIENT HANDOFF KIT
// ========================================

export interface ClientHandoffKit {
  quickstart_5min: string[];
  daily_sop: string[];
  weekly_sop: string[];
  exception_sop: string[];
  training_plan: string[];
  admin_notes: string[];
}

// ========================================
// POST-LAUNCH MONITORING
// ========================================

export interface PostLaunchMonitoring {
  kpis: string[];
  alerts: string[];
  support_process: string[];
  weekly_review_format: string[];
}
