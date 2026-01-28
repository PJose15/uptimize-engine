/**
 * UptimizeAI Agent Checklist Validator V2
 *
 * Validates agents against the Agent Upgrade Checklist V2 standards.
 * This is the quality + differentiation gate that keeps agents niche-deep and production-ready.
 */

// ============================================================================
// TYPES
// ============================================================================

export type ChecklistItemStatus =
  | 'not_started'
  | 'in_progress'
  | 'passed'
  | 'blocked'
  | 'not_applicable';

export type ChecklistOverallStatus =
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'shipped'
  | 'deprecated';

export type AgentType =
  | 'agent-1-market-intelligence'
  | 'agent-2-outbound-appointment'
  | 'agent-3-sales-engineer'
  | 'agent-4-systems-delivery'
  | 'agent-5-client-success'
  | 'agent-6-brand-content'
  | 'agent-7-paid-acquisition'
  | 'agent-8-partnerships'
  | 'agent-9-finance-pricing'
  | 'agent-10-platform-infrastructure';

export type ShadowOpsOutput =
  | 'shadow_ops_map'
  | 'shadow_ops_density'
  | 'exception_library'
  | 'exception_forecast'
  | 'shadow_ops_reduction_report';

export type OpsSpineEntity =
  | 'lead'
  | 'account'
  | 'opportunity'
  | 'project'
  | 'workflow'
  | 'deliverable'
  | 'ticket'
  | 'audit_event';

export type SensitiveDataType = 'pii' | 'payment' | 'credentials' | 'health' | 'financial' | 'other';

export type MCPPermission = 'read' | 'write' | 'read_write' | 'none';

export type BlockerPriority = 'P1' | 'P2' | 'P3';

export interface ChecklistItem {
  id: string;
  description: string;
  why_it_matters?: string;
  status: ChecklistItemStatus;
  evidence?: string;
  blocker_ticket?: string;
  verified_by?: string;
  verified_at?: string;
}

export interface ExceptionPath {
  name: string;
  trigger: string;
  behavior: string;
  tested?: boolean;
}

export interface ToolFailureFallback {
  tool: string;
  failure_mode: string;
  fallback_action: string;
  tested?: boolean;
}

export interface HumanEscalationRule {
  condition: string;
  escalation_channel: string;
  sla_minutes: number;
}

export interface AuditEvent {
  event_type: string;
  entity_type: string;
  fields_logged: string[];
  retention_days?: number;
}

export interface MCPToolPermission {
  tool_name: string;
  permission: MCPPermission;
}

export interface SensitiveDataRule {
  data_type: SensitiveDataType;
  handling_rule: string;
}

export interface KPI {
  name: string;
  definition: string;
  measurement_method: string;
  target: string;
  ops_spine_kpi_id?: string;
  baseline?: string;
}

export interface Quickstart {
  document_path?: string;
  estimated_minutes?: number;
  tested_with_client?: boolean;
}

export interface SOPs {
  daily_sop_path?: string;
  weekly_sop_path?: string;
  exception_sop_path?: string;
}

export interface MicroCommitment {
  description?: string;
  action_required?: string;
  expected_outcome?: string;
}

export interface Blocker {
  checklist_item_id: string;
  description: string;
  ticket_id: string;
  created_at: string;
  assigned_to?: string;
  priority?: BlockerPriority;
  resolved_at?: string;
}

// ============================================================================
// CORE STANDARDS
// ============================================================================

export interface DifferentiationStandard {
  items: ChecklistItem[];
  shadow_ops_outputs?: ShadowOpsOutput[];
}

export interface OutputContractStandard {
  items: ChecklistItem[];
  output_schema_ref?: string;
  ops_spine_entities?: OpsSpineEntity[];
}

export interface ReliabilityStandard {
  items: ChecklistItem[];
  happy_path_definition?: string;
  exception_paths?: ExceptionPath[];
  tool_failure_fallbacks?: ToolFailureFallback[];
  human_escalation_rules?: HumanEscalationRule[];
  rollback_procedure?: string;
}

export interface AuditabilityStandard {
  items: ChecklistItem[];
  audit_events?: AuditEvent[];
  log_storage_location?: string;
  retention_policy?: string;
}

export interface SecurityAccessStandard {
  items: ChecklistItem[];
  permissions?: {
    allowed_actions?: string[];
    disallowed_actions?: string[];
    mcp_tools?: MCPToolPermission[];
  };
  sensitive_data_rules?: SensitiveDataRule[];
}

export interface KPIStandard {
  items: ChecklistItem[];
  kpis?: KPI[];
}

export interface AdoptionStandard {
  items: ChecklistItem[];
  is_client_facing?: boolean;
  quickstart?: Quickstart;
  sops?: SOPs;
  micro_commitment?: MicroCommitment;
}

export interface CoreStandards {
  differentiation: DifferentiationStandard;
  output_contract: OutputContractStandard;
  reliability: ReliabilityStandard;
  auditability: AuditabilityStandard;
  security_access: SecurityAccessStandard;
  kpi: KPIStandard;
  adoption: AdoptionStandard;
}

// ============================================================================
// ROLE STANDARDS
// ============================================================================

export interface RoleStandards {
  agent_type: AgentType;
  required_items: ChecklistItem[];
  addon_items: ChecklistItem[];
}

// ============================================================================
// SHIP GATE
// ============================================================================

export interface QAResults {
  happy_path_passed?: boolean;
  exception_paths_passed?: boolean;
  tool_failures_passed?: boolean;
  test_run_date?: string;
  test_report_path?: string;
}

export interface BuildReadiness {
  items: ChecklistItem[];
  qa_results?: QAResults;
}

export interface BusinessReadiness {
  items: ChecklistItem[];
  proof_angle?: string;
  sell_sheet_path?: string;
  demo_script_path?: string;
  pricing_approved?: boolean;
  capacity_approved?: boolean;
}

export interface OpsSpineReadiness {
  items: ChecklistItem[];
  entity_links_verified?: boolean;
  ticket_process_defined?: boolean;
  kpi_dashboard_ready?: boolean;
  dashboard_path?: string;
}

export interface FinalApproval {
  approved?: boolean;
  approved_by?: string;
  approved_at?: string;
  ship_date?: string;
  release_notes?: string;
}

export interface ShipGate {
  build_readiness: BuildReadiness;
  business_readiness: BusinessReadiness;
  ops_spine_readiness: OpsSpineReadiness;
  final_approval?: FinalApproval;
}

// ============================================================================
// FULL CHECKLIST
// ============================================================================

export interface AgentChecklist {
  schema_version: '2.0.0';
  agent_id: string;
  agent_name: string;
  checklist_version: string;
  last_updated: string;
  owner?: string;
  status?: ChecklistOverallStatus;
  core_standards: CoreStandards;
  role_standards: RoleStandards;
  ship_gate: ShipGate;
  blockers?: Blocker[];
  notes?: string;
}

// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  category: string;
  item_id?: string;
  message: string;
  suggestion?: string;
}

export interface CategoryValidationResult {
  category: string;
  passed: boolean;
  total_items: number;
  passed_items: number;
  blocked_items: number;
  not_started_items: number;
  in_progress_items: number;
  issues: ValidationIssue[];
}

export interface ValidationReport {
  agent_id: string;
  agent_name: string;
  validation_timestamp: string;
  is_ship_ready: boolean;
  overall_score: number; // 0-100
  core_standards_passed: boolean;
  role_standards_passed: boolean;
  ship_gate_passed: boolean;
  category_results: CategoryValidationResult[];
  blockers: Blocker[];
  summary: {
    total_items: number;
    passed_items: number;
    blocked_items: number;
    not_started_items: number;
    in_progress_items: number;
    pass_rate: number;
  };
  recommendations: string[];
}

// ============================================================================
// VALIDATOR CLASS
// ============================================================================

export class ChecklistValidator {
  private checklist: AgentChecklist;
  private issues: ValidationIssue[] = [];

  constructor(checklist: AgentChecklist) {
    this.checklist = checklist;
  }

  /**
   * Run full validation and return report
   */
  validate(): ValidationReport {
    this.issues = [];

    const categoryResults: CategoryValidationResult[] = [];

    // Validate Core Standards
    categoryResults.push(this.validateDifferentiation());
    categoryResults.push(this.validateOutputContract());
    categoryResults.push(this.validateReliability());
    categoryResults.push(this.validateAuditability());
    categoryResults.push(this.validateSecurityAccess());
    categoryResults.push(this.validateKPI());
    categoryResults.push(this.validateAdoption());

    // Validate Role Standards
    categoryResults.push(this.validateRoleStandards());

    // Validate Ship Gate
    categoryResults.push(this.validateBuildReadiness());
    categoryResults.push(this.validateBusinessReadiness());
    categoryResults.push(this.validateOpsSpineReadiness());

    // Calculate summary
    const allItems = this.getAllChecklistItems();
    const summary = this.calculateSummary(allItems);

    // Determine pass states
    const coreCategories = categoryResults.slice(0, 7);
    const roleCategory = categoryResults[7];
    const shipGateCategories = categoryResults.slice(8);

    const coreStandardsPassed = coreCategories.every(c => c.passed);
    const roleStandardsPassed = roleCategory.passed;
    const shipGatePassed = shipGateCategories.every(c => c.passed);

    const isShipReady = coreStandardsPassed && roleStandardsPassed && shipGatePassed;
    const overallScore = Math.round((summary.passed_items / summary.total_items) * 100);

    return {
      agent_id: this.checklist.agent_id,
      agent_name: this.checklist.agent_name,
      validation_timestamp: new Date().toISOString(),
      is_ship_ready: isShipReady,
      overall_score: overallScore,
      core_standards_passed: coreStandardsPassed,
      role_standards_passed: roleStandardsPassed,
      ship_gate_passed: shipGatePassed,
      category_results: categoryResults,
      blockers: this.checklist.blockers || [],
      summary,
      recommendations: this.generateRecommendations(categoryResults, summary),
    };
  }

  // ============================================================================
  // CORE STANDARD VALIDATORS
  // ============================================================================

  private validateDifferentiation(): CategoryValidationResult {
    const category = 'Core: Differentiation (Shadow Ops + Exceptions)';
    const items = this.checklist.core_standards.differentiation.items;
    const issues: ValidationIssue[] = [];

    // Check required items exist
    const requiredDescriptions = [
      'shadow ops',
      'exception',
      'output',
      'operator-grade',
    ];

    requiredDescriptions.forEach(keyword => {
      const hasItem = items.some(i =>
        i.description.toLowerCase().includes(keyword)
      );
      if (!hasItem) {
        issues.push({
          severity: 'warning',
          category,
          message: `Missing checklist item related to: ${keyword}`,
          suggestion: `Add an item that addresses ${keyword} requirements`,
        });
      }
    });

    // Check shadow ops outputs
    const outputs = this.checklist.core_standards.differentiation.shadow_ops_outputs;
    if (!outputs || outputs.length === 0) {
      issues.push({
        severity: 'error',
        category,
        message: 'No Shadow Ops outputs defined',
        suggestion: 'Define at least one: shadow_ops_map, shadow_ops_density, exception_library, exception_forecast, or shadow_ops_reduction_report',
      });
    }

    return this.buildCategoryResult(category, items, issues);
  }

  private validateOutputContract(): CategoryValidationResult {
    const category = 'Core: Output Contract';
    const items = this.checklist.core_standards.output_contract.items;
    const issues: ValidationIssue[] = [];

    // Check schema reference
    if (!this.checklist.core_standards.output_contract.output_schema_ref) {
      issues.push({
        severity: 'error',
        category,
        message: 'No output schema reference defined',
        suggestion: 'Reference the JSON schema for this agent\'s structured output',
      });
    }

    // Check Ops Spine entities
    const entities = this.checklist.core_standards.output_contract.ops_spine_entities;
    if (!entities || entities.length === 0) {
      issues.push({
        severity: 'error',
        category,
        message: 'No Ops Spine entities specified',
        suggestion: 'Define which Ops Spine entities this agent writes to (lead, account, opportunity, etc.)',
      });
    }

    return this.buildCategoryResult(category, items, issues);
  }

  private validateReliability(): CategoryValidationResult {
    const category = 'Core: Reliability';
    const items = this.checklist.core_standards.reliability.items;
    const issues: ValidationIssue[] = [];

    // Check exception paths (must have at least 5)
    const exceptionPaths = this.checklist.core_standards.reliability.exception_paths;
    if (!exceptionPaths || exceptionPaths.length < 5) {
      issues.push({
        severity: 'error',
        category,
        message: `Only ${exceptionPaths?.length || 0} exception paths defined (minimum 5 required)`,
        suggestion: 'Define at least 5 exception paths with trigger conditions and behaviors',
      });
    } else {
      // Check if all exception paths are tested
      const untestedPaths = exceptionPaths.filter(p => !p.tested);
      if (untestedPaths.length > 0) {
        issues.push({
          severity: 'warning',
          category,
          message: `${untestedPaths.length} exception paths not marked as tested`,
          suggestion: `Test and mark these exception paths: ${untestedPaths.map(p => p.name).join(', ')}`,
        });
      }
    }

    // Check tool failure fallbacks
    const fallbacks = this.checklist.core_standards.reliability.tool_failure_fallbacks;
    if (!fallbacks || fallbacks.length === 0) {
      issues.push({
        severity: 'error',
        category,
        message: 'No tool failure fallbacks defined',
        suggestion: 'Define fallback behaviors for when tools fail',
      });
    }

    // Check human escalation rules
    const escalationRules = this.checklist.core_standards.reliability.human_escalation_rules;
    if (!escalationRules || escalationRules.length === 0) {
      issues.push({
        severity: 'error',
        category,
        message: 'No human escalation rules defined',
        suggestion: 'Define when and how to escalate to humans',
      });
    }

    // Check rollback procedure
    if (!this.checklist.core_standards.reliability.rollback_procedure) {
      issues.push({
        severity: 'warning',
        category,
        message: 'No rollback procedure defined',
        suggestion: 'Document how to disable or rollback this agent',
      });
    }

    return this.buildCategoryResult(category, items, issues);
  }

  private validateAuditability(): CategoryValidationResult {
    const category = 'Core: Auditability';
    const items = this.checklist.core_standards.auditability.items;
    const issues: ValidationIssue[] = [];

    // Check audit events
    const auditEvents = this.checklist.core_standards.auditability.audit_events;
    if (!auditEvents || auditEvents.length === 0) {
      issues.push({
        severity: 'error',
        category,
        message: 'No audit events defined',
        suggestion: 'Define audit events with event_type, entity_type, and fields_logged',
      });
    } else {
      // Check each audit event has required fields
      auditEvents.forEach((event, idx) => {
        if (!event.fields_logged || event.fields_logged.length === 0) {
          issues.push({
            severity: 'warning',
            category,
            message: `Audit event "${event.event_type}" has no fields_logged`,
            suggestion: 'Add fields to log for answering "what happened and why"',
          });
        }
      });
    }

    // Check log storage location
    if (!this.checklist.core_standards.auditability.log_storage_location) {
      issues.push({
        severity: 'warning',
        category,
        message: 'Log storage location not specified',
        suggestion: 'Specify where logs are stored',
      });
    }

    // Check retention policy
    if (!this.checklist.core_standards.auditability.retention_policy) {
      issues.push({
        severity: 'warning',
        category,
        message: 'Data retention policy not specified',
        suggestion: 'Define how long logs are retained',
      });
    }

    return this.buildCategoryResult(category, items, issues);
  }

  private validateSecurityAccess(): CategoryValidationResult {
    const category = 'Core: Security & Access';
    const items = this.checklist.core_standards.security_access.items;
    const issues: ValidationIssue[] = [];

    const permissions = this.checklist.core_standards.security_access.permissions;

    // Check disallowed actions are explicit
    if (!permissions?.disallowed_actions || permissions.disallowed_actions.length === 0) {
      issues.push({
        severity: 'error',
        category,
        message: 'No disallowed actions defined',
        suggestion: 'Explicitly define what actions this agent cannot perform',
      });
    }

    // Check MCP tool permissions
    if (!permissions?.mcp_tools || permissions.mcp_tools.length === 0) {
      issues.push({
        severity: 'warning',
        category,
        message: 'No MCP tool permissions specified',
        suggestion: 'Define read/write permissions for MCP tools',
      });
    }

    // Check sensitive data rules
    const dataRules = this.checklist.core_standards.security_access.sensitive_data_rules;
    if (!dataRules || dataRules.length === 0) {
      issues.push({
        severity: 'warning',
        category,
        message: 'No sensitive data handling rules defined',
        suggestion: 'Define rules for PII, payments, credentials, etc.',
      });
    }

    return this.buildCategoryResult(category, items, issues);
  }

  private validateKPI(): CategoryValidationResult {
    const category = 'Core: KPI';
    const items = this.checklist.core_standards.kpi.items;
    const issues: ValidationIssue[] = [];

    const kpis = this.checklist.core_standards.kpi.kpis;

    // Check 3-5 KPIs exist
    if (!kpis || kpis.length < 3) {
      issues.push({
        severity: 'error',
        category,
        message: `Only ${kpis?.length || 0} KPIs defined (minimum 3 required)`,
        suggestion: 'Define 3-5 KPIs that prove value',
      });
    } else if (kpis.length > 5) {
      issues.push({
        severity: 'warning',
        category,
        message: `${kpis.length} KPIs defined (maximum 5 recommended)`,
        suggestion: 'Focus on the 5 most important KPIs',
      });
    }

    // Check each KPI has all required fields
    kpis?.forEach((kpi, idx) => {
      if (!kpi.measurement_method) {
        issues.push({
          severity: 'warning',
          category,
          message: `KPI "${kpi.name}" missing measurement_method`,
          suggestion: 'Define how this KPI is measured',
        });
      }
      if (!kpi.target) {
        issues.push({
          severity: 'warning',
          category,
          message: `KPI "${kpi.name}" missing target`,
          suggestion: 'Define a measurable target for this KPI',
        });
      }
    });

    return this.buildCategoryResult(category, items, issues);
  }

  private validateAdoption(): CategoryValidationResult {
    const category = 'Core: Adoption';
    const items = this.checklist.core_standards.adoption.items;
    const issues: ValidationIssue[] = [];

    const isClientFacing = this.checklist.core_standards.adoption.is_client_facing;

    if (isClientFacing) {
      // Check quickstart
      const quickstart = this.checklist.core_standards.adoption.quickstart;
      if (!quickstart?.document_path) {
        issues.push({
          severity: 'error',
          category,
          message: 'Client-facing agent missing quickstart documentation',
          suggestion: 'Create a 5-10 minute quickstart guide',
        });
      } else if (quickstart.estimated_minutes && quickstart.estimated_minutes > 10) {
        issues.push({
          severity: 'warning',
          category,
          message: `Quickstart takes ${quickstart.estimated_minutes} minutes (should be 5-10)`,
          suggestion: 'Simplify the quickstart to be completable in 5-10 minutes',
        });
      }

      // Check SOPs
      const sops = this.checklist.core_standards.adoption.sops;
      if (!sops?.daily_sop_path && !sops?.weekly_sop_path) {
        issues.push({
          severity: 'error',
          category,
          message: 'Missing daily and weekly SOPs',
          suggestion: 'Create SOPs for daily and weekly usage',
        });
      }
      if (!sops?.exception_sop_path) {
        issues.push({
          severity: 'warning',
          category,
          message: 'Missing exception handling SOP',
          suggestion: 'Create SOP for handling exceptions',
        });
      }

      // Check micro-commitment
      if (!this.checklist.core_standards.adoption.micro_commitment?.description) {
        issues.push({
          severity: 'warning',
          category,
          message: 'No micro-commitment defined',
          suggestion: 'Define a small client action that improves adoption',
        });
      }
    }

    return this.buildCategoryResult(category, items, issues);
  }

  // ============================================================================
  // ROLE STANDARD VALIDATORS
  // ============================================================================

  private validateRoleStandards(): CategoryValidationResult {
    const agentType = this.checklist.role_standards.agent_type;
    const category = `Role: ${agentType}`;
    const items = this.checklist.role_standards.required_items;
    const issues: ValidationIssue[] = [];

    // Get minimum required items for this agent type
    const minimumItems = ROLE_MINIMUM_ITEMS[agentType];
    if (items.length < minimumItems) {
      issues.push({
        severity: 'error',
        category,
        message: `Only ${items.length} role items defined (minimum ${minimumItems} required for ${agentType})`,
        suggestion: `Add required role-specific items for ${agentType}`,
      });
    }

    // Check agent-specific requirements
    const agentValidator = AGENT_VALIDATORS[agentType];
    if (agentValidator) {
      issues.push(...agentValidator(this.checklist));
    }

    return this.buildCategoryResult(category, items, issues);
  }

  // ============================================================================
  // SHIP GATE VALIDATORS
  // ============================================================================

  private validateBuildReadiness(): CategoryValidationResult {
    const category = 'Ship Gate: Build Readiness';
    const items = this.checklist.ship_gate.build_readiness.items;
    const issues: ValidationIssue[] = [];

    const qaResults = this.checklist.ship_gate.build_readiness.qa_results;

    if (!qaResults) {
      issues.push({
        severity: 'error',
        category,
        message: 'No QA results recorded',
        suggestion: 'Run QA tests and record results',
      });
    } else {
      if (!qaResults.happy_path_passed) {
        issues.push({
          severity: 'error',
          category,
          message: 'Happy path QA not passed',
          suggestion: 'Fix issues and re-run happy path tests',
        });
      }
      if (!qaResults.exception_paths_passed) {
        issues.push({
          severity: 'error',
          category,
          message: 'Exception paths QA not passed',
          suggestion: 'Fix issues and re-run exception path tests',
        });
      }
      if (!qaResults.tool_failures_passed) {
        issues.push({
          severity: 'error',
          category,
          message: 'Tool failure QA not passed',
          suggestion: 'Fix fallback behaviors and re-run tool failure tests',
        });
      }
    }

    return this.buildCategoryResult(category, items, issues);
  }

  private validateBusinessReadiness(): CategoryValidationResult {
    const category = 'Ship Gate: Business Readiness';
    const items = this.checklist.ship_gate.business_readiness.items;
    const issues: ValidationIssue[] = [];

    const br = this.checklist.ship_gate.business_readiness;

    if (!br.proof_angle) {
      issues.push({
        severity: 'error',
        category,
        message: 'No proof angle defined',
        suggestion: 'Identify what makes this agent unique and sellable',
      });
    }

    if (!br.sell_sheet_path) {
      issues.push({
        severity: 'warning',
        category,
        message: 'No sell sheet created',
        suggestion: 'Create sell sheet for this agent',
      });
    }

    if (!br.pricing_approved) {
      issues.push({
        severity: 'error',
        category,
        message: 'Pricing not approved',
        suggestion: 'Get pricing approved by Agent 9 (Finance)',
      });
    }

    if (!br.capacity_approved) {
      issues.push({
        severity: 'warning',
        category,
        message: 'Capacity not approved',
        suggestion: 'Get delivery capacity approval',
      });
    }

    return this.buildCategoryResult(category, items, issues);
  }

  private validateOpsSpineReadiness(): CategoryValidationResult {
    const category = 'Ship Gate: Ops Spine Readiness';
    const items = this.checklist.ship_gate.ops_spine_readiness.items;
    const issues: ValidationIssue[] = [];

    const osr = this.checklist.ship_gate.ops_spine_readiness;

    if (!osr.entity_links_verified) {
      issues.push({
        severity: 'error',
        category,
        message: 'Entity links not verified',
        suggestion: 'Verify Lead → Opp → Project → Workflow links are correct',
      });
    }

    if (!osr.ticket_process_defined) {
      issues.push({
        severity: 'error',
        category,
        message: 'Ticket process not defined',
        suggestion: 'Define the ticketing and CR process',
      });
    }

    if (!osr.kpi_dashboard_ready) {
      issues.push({
        severity: 'warning',
        category,
        message: 'KPI dashboard not ready',
        suggestion: 'Set up KPI tracking dashboard',
      });
    }

    return this.buildCategoryResult(category, items, issues);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private buildCategoryResult(
    category: string,
    items: ChecklistItem[],
    additionalIssues: ValidationIssue[]
  ): CategoryValidationResult {
    const issues: ValidationIssue[] = [...additionalIssues];

    // Check each item's status
    items.forEach(item => {
      if (item.status === 'not_started') {
        issues.push({
          severity: 'error',
          category,
          item_id: item.id,
          message: `Item not started: ${item.description}`,
          suggestion: 'Complete this checklist item',
        });
      } else if (item.status === 'blocked') {
        issues.push({
          severity: 'error',
          category,
          item_id: item.id,
          message: `Item blocked: ${item.description}`,
          suggestion: item.blocker_ticket
            ? `Resolve blocker ticket: ${item.blocker_ticket}`
            : 'Create a ticket for this blocker',
        });
      } else if (item.status === 'in_progress') {
        issues.push({
          severity: 'warning',
          category,
          item_id: item.id,
          message: `Item in progress: ${item.description}`,
          suggestion: 'Complete this item before shipping',
        });
      }
    });

    const passedItems = items.filter(i => i.status === 'passed' || i.status === 'not_applicable').length;
    const blockedItems = items.filter(i => i.status === 'blocked').length;
    const notStartedItems = items.filter(i => i.status === 'not_started').length;
    const inProgressItems = items.filter(i => i.status === 'in_progress').length;

    const hasErrors = issues.some(i => i.severity === 'error');
    const passed = !hasErrors && passedItems === items.length;

    return {
      category,
      passed,
      total_items: items.length,
      passed_items: passedItems,
      blocked_items: blockedItems,
      not_started_items: notStartedItems,
      in_progress_items: inProgressItems,
      issues,
    };
  }

  private getAllChecklistItems(): ChecklistItem[] {
    const core = this.checklist.core_standards;
    const role = this.checklist.role_standards;
    const ship = this.checklist.ship_gate;

    return [
      ...core.differentiation.items,
      ...core.output_contract.items,
      ...core.reliability.items,
      ...core.auditability.items,
      ...core.security_access.items,
      ...core.kpi.items,
      ...core.adoption.items,
      ...role.required_items,
      ...role.addon_items,
      ...ship.build_readiness.items,
      ...ship.business_readiness.items,
      ...ship.ops_spine_readiness.items,
    ];
  }

  private calculateSummary(items: ChecklistItem[]) {
    const passed_items = items.filter(i => i.status === 'passed' || i.status === 'not_applicable').length;
    const blocked_items = items.filter(i => i.status === 'blocked').length;
    const not_started_items = items.filter(i => i.status === 'not_started').length;
    const in_progress_items = items.filter(i => i.status === 'in_progress').length;
    const total_items = items.length;

    return {
      total_items,
      passed_items,
      blocked_items,
      not_started_items,
      in_progress_items,
      pass_rate: total_items > 0 ? Math.round((passed_items / total_items) * 100) : 0,
    };
  }

  private generateRecommendations(
    categoryResults: CategoryValidationResult[],
    summary: { blocked_items: number; not_started_items: number }
  ): string[] {
    const recommendations: string[] = [];

    // Priority 1: Fix blockers
    if (summary.blocked_items > 0) {
      recommendations.push(
        `PRIORITY: Resolve ${summary.blocked_items} blocked items before proceeding`
      );
    }

    // Priority 2: Start not-started items
    if (summary.not_started_items > 0) {
      recommendations.push(
        `Begin work on ${summary.not_started_items} items that haven't been started`
      );
    }

    // Category-specific recommendations
    categoryResults.forEach(result => {
      if (!result.passed) {
        const errorCount = result.issues.filter(i => i.severity === 'error').length;
        if (errorCount > 0) {
          recommendations.push(
            `Fix ${errorCount} errors in "${result.category}"`
          );
        }
      }
    });

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('All standards met - ready for final approval');
    }

    return recommendations;
  }
}

// ============================================================================
// AGENT-SPECIFIC VALIDATORS
// ============================================================================

const ROLE_MINIMUM_ITEMS: Record<AgentType, number> = {
  'agent-1-market-intelligence': 5,
  'agent-2-outbound-appointment': 5,
  'agent-3-sales-engineer': 6,
  'agent-4-systems-delivery': 5,
  'agent-5-client-success': 5,
  'agent-6-brand-content': 5,
  'agent-7-paid-acquisition': 5,
  'agent-8-partnerships': 5,
  'agent-9-finance-pricing': 5,
  'agent-10-platform-infrastructure': 5,
};

type AgentValidator = (checklist: AgentChecklist) => ValidationIssue[];

const AGENT_VALIDATORS: Partial<Record<AgentType, AgentValidator>> = {
  'agent-1-market-intelligence': (checklist) => {
    const issues: ValidationIssue[] = [];
    const items = checklist.role_standards.required_items;

    // Must have Shadow Ops Evidence item
    if (!items.some(i => i.description.toLowerCase().includes('shadow ops evidence'))) {
      issues.push({
        severity: 'error',
        category: 'Role: agent-1-market-intelligence',
        message: 'Missing "Shadow Ops Evidence" requirement',
        suggestion: 'Each lead must include at least 1 concrete Shadow Ops signal',
      });
    }

    // Must have Exception Hypotheses item
    if (!items.some(i => i.description.toLowerCase().includes('exception hypothes'))) {
      issues.push({
        severity: 'error',
        category: 'Role: agent-1-market-intelligence',
        message: 'Missing "Exception Hypotheses" requirement',
        suggestion: 'Each lead must include top 3 exception hypotheses',
      });
    }

    // Must have Pattern-Interrupt Question
    if (!items.some(i => i.description.toLowerCase().includes('pattern-interrupt'))) {
      issues.push({
        severity: 'error',
        category: 'Role: agent-1-market-intelligence',
        message: 'Missing "Pattern-Interrupt Question" requirement',
        suggestion: 'Each lead must include a pattern-interrupt question',
      });
    }

    return issues;
  },

  'agent-2-outbound-appointment': (checklist) => {
    const issues: ValidationIssue[] = [];
    const items = checklist.role_standards.required_items;

    // Must have mini Shadow Ops Audit
    if (!items.some(i => i.description.toLowerCase().includes('mini shadow ops audit') ||
                        i.description.toLowerCase().includes('shadow ops audit'))) {
      issues.push({
        severity: 'error',
        category: 'Role: agent-2-outbound-appointment',
        message: 'Missing "Mini Shadow Ops Audit" requirement',
        suggestion: 'Must use 2-4 qualifying questions before booking',
      });
    }

    // Must have no-show protocol
    if (!items.some(i => i.description.toLowerCase().includes('no-show'))) {
      issues.push({
        severity: 'error',
        category: 'Role: agent-2-outbound-appointment',
        message: 'Missing "No-show protocol" requirement',
        suggestion: 'Include micro-commitment for no-show recovery',
      });
    }

    return issues;
  },

  'agent-3-sales-engineer': (checklist) => {
    const issues: ValidationIssue[] = [];
    const items = checklist.role_standards.required_items;

    // Must have discovery order
    if (!items.some(i => i.description.toLowerCase().includes('discovery order'))) {
      issues.push({
        severity: 'error',
        category: 'Role: agent-3-sales-engineer',
        message: 'Missing "Discovery order" requirement',
        suggestion: 'Follow: Process → Shadow Ops → Exceptions → Impact → Constraints → Close plan',
      });
    }

    // Must have exception-to-deliverable mapping
    if (!items.some(i => i.description.toLowerCase().includes('exception') &&
                        i.description.toLowerCase().includes('deliverable'))) {
      issues.push({
        severity: 'error',
        category: 'Role: agent-3-sales-engineer',
        message: 'Missing "Exception-to-Deliverable mapping" requirement',
        suggestion: 'SOW must map exceptions to specific deliverables',
      });
    }

    // Must have deal risk flags
    if (!items.some(i => i.description.toLowerCase().includes('risk') ||
                        i.description.toLowerCase().includes('do not close'))) {
      issues.push({
        severity: 'warning',
        category: 'Role: agent-3-sales-engineer',
        message: 'Missing "Deal risk flags" requirement',
        suggestion: 'Define "do not close" rules for risky deals',
      });
    }

    return issues;
  },

  'agent-4-systems-delivery': (checklist) => {
    const issues: ValidationIssue[] = [];
    const items = checklist.role_standards.required_items;

    // Must have workflow spec requirements
    if (!items.some(i => i.description.toLowerCase().includes('workflow spec'))) {
      issues.push({
        severity: 'error',
        category: 'Role: agent-4-systems-delivery',
        message: 'Missing "Workflow spec" requirement',
        suggestion: 'Must include inputs/outputs/tools/happy path for each workflow',
      });
    }

    // Must have observability
    if (!items.some(i => i.description.toLowerCase().includes('observability'))) {
      issues.push({
        severity: 'error',
        category: 'Role: agent-4-systems-delivery',
        message: 'Missing "Observability" requirement',
        suggestion: 'Must ship volume, exceptions, fallbacks, success rate tracking',
      });
    }

    return issues;
  },

  'agent-5-client-success': (checklist) => {
    const issues: ValidationIssue[] = [];
    const items = checklist.role_standards.required_items;

    // Must have First Value in 7 Days
    if (!items.some(i => i.description.toLowerCase().includes('first value') ||
                        i.description.toLowerCase().includes('fvi7') ||
                        i.description.toLowerCase().includes('day 1') ||
                        i.description.toLowerCase().includes('7 day'))) {
      issues.push({
        severity: 'error',
        category: 'Role: agent-5-client-success',
        message: 'Missing "First Value in 7 Days" requirement',
        suggestion: 'Define Day 1/3/7 plan for first value delivery',
      });
    }

    // Must have Weekly Win Report
    if (!items.some(i => i.description.toLowerCase().includes('weekly win') ||
                        i.description.toLowerCase().includes('win report'))) {
      issues.push({
        severity: 'error',
        category: 'Role: agent-5-client-success',
        message: 'Missing "Weekly Win Report" requirement',
        suggestion: 'Generate weekly reports from KPI deltas + logs',
      });
    }

    // Must have Shadow Ops Drift detection
    if (!items.some(i => i.description.toLowerCase().includes('drift'))) {
      issues.push({
        severity: 'warning',
        category: 'Role: agent-5-client-success',
        message: 'Missing "Shadow Ops Drift detection" requirement',
        suggestion: 'Detect when clients revert to shadow ops behavior',
      });
    }

    return issues;
  },

  'agent-6-brand-content': (checklist) => {
    const issues: ValidationIssue[] = [];
    const items = checklist.role_standards.required_items;

    // Must have content pillars
    if (!items.some(i => i.description.toLowerCase().includes('content pillar'))) {
      issues.push({
        severity: 'error',
        category: 'Role: agent-6-brand-content',
        message: 'Missing "Content pillars" requirement',
        suggestion: 'Build content pillars around Shadow Ops + Exceptions',
      });
    }

    // Must have Proof-to-Post SLA
    if (!items.some(i => i.description.toLowerCase().includes('proof-to-post') ||
                        (i.description.toLowerCase().includes('win') &&
                         i.description.toLowerCase().includes('content')))) {
      issues.push({
        severity: 'error',
        category: 'Role: agent-6-brand-content',
        message: 'Missing "Proof-to-Post SLA" requirement',
        suggestion: 'Win → content within 72 hours',
      });
    }

    return issues;
  },

  'agent-7-paid-acquisition': (checklist) => {
    const issues: ValidationIssue[] = [];
    const items = checklist.role_standards.required_items;

    // Must have funnel angle based on shadow workflow
    if (!items.some(i => i.description.toLowerCase().includes('funnel angle') ||
                        i.description.toLowerCase().includes('shadow workflow'))) {
      issues.push({
        severity: 'error',
        category: 'Role: agent-7-paid-acquisition',
        message: 'Missing shadow workflow-based funnel angle requirement',
        suggestion: 'Funnel angle must be based on specific shadow workflow or exception',
      });
    }

    // Must have lead quality loop
    if (!items.some(i => i.description.toLowerCase().includes('lead quality') ||
                        i.description.toLowerCase().includes('close data'))) {
      issues.push({
        severity: 'error',
        category: 'Role: agent-7-paid-acquisition',
        message: 'Missing "Lead quality loop" requirement',
        suggestion: 'Use downstream close data, not just CPL',
      });
    }

    return issues;
  },

  'agent-8-partnerships': (checklist) => {
    const issues: ValidationIssue[] = [];
    const items = checklist.role_standards.required_items;

    // Must have partner lanes
    if (!items.some(i => i.description.toLowerCase().includes('partner lane'))) {
      issues.push({
        severity: 'error',
        category: 'Role: agent-8-partnerships',
        message: 'Missing "Partner lanes" requirement',
        suggestion: 'Define lanes: vendors, consultants, communities',
      });
    }

    // Must have white-label offering
    if (!items.some(i => i.description.toLowerCase().includes('white-label') ||
                        i.description.toLowerCase().includes('audit offering'))) {
      issues.push({
        severity: 'warning',
        category: 'Role: agent-8-partnerships',
        message: 'Missing "White-label Shadow Ops Audit" offering',
        suggestion: 'Create white-label audit offering for partners',
      });
    }

    return issues;
  },

  'agent-9-finance-pricing': (checklist) => {
    const issues: ValidationIssue[] = [];
    const items = checklist.role_standards.required_items;

    // Must have Complexity Index
    if (!items.some(i => i.description.toLowerCase().includes('complexity index'))) {
      issues.push({
        severity: 'error',
        category: 'Role: agent-9-finance-pricing',
        message: 'Missing "Complexity Index" requirement',
        suggestion: 'Complexity Index must drive pricing (exceptions + integrations + shadow ops density)',
      });
    }

    // Must have WIP limits
    if (!items.some(i => i.description.toLowerCase().includes('wip limit'))) {
      issues.push({
        severity: 'error',
        category: 'Role: agent-9-finance-pricing',
        message: 'Missing "WIP limits" requirement',
        suggestion: 'Set and enforce work-in-progress limits',
      });
    }

    return issues;
  },

  'agent-10-platform-infrastructure': (checklist) => {
    const issues: ValidationIssue[] = [];
    const items = checklist.role_standards.required_items;

    // Must have MCP Integration Catalog
    if (!items.some(i => i.description.toLowerCase().includes('mcp') &&
                        i.description.toLowerCase().includes('catalog'))) {
      issues.push({
        severity: 'error',
        category: 'Role: agent-10-platform-infrastructure',
        message: 'Missing "MCP Integration Catalog" requirement',
        suggestion: 'Maintain catalog of MCP capabilities + failure modes',
      });
    }

    // Must have logging schema
    if (!items.some(i => i.description.toLowerCase().includes('logging schema'))) {
      issues.push({
        severity: 'error',
        category: 'Role: agent-10-platform-infrastructure',
        message: 'Missing "Standard logging schema" requirement',
        suggestion: 'Enforce standard logging schema across all agents',
      });
    }

    // Must have versioning/release gates
    if (!items.some(i => i.description.toLowerCase().includes('version') ||
                        i.description.toLowerCase().includes('release gate'))) {
      issues.push({
        severity: 'warning',
        category: 'Role: agent-10-platform-infrastructure',
        message: 'Missing "Versioning + release gates" requirement',
        suggestion: 'Define stable vs beta release gates',
      });
    }

    return issues;
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a new checklist item with defaults
 */
export function createChecklistItem(
  id: string,
  description: string,
  options?: Partial<ChecklistItem>
): ChecklistItem {
  return {
    id,
    description,
    status: 'not_started',
    ...options,
  };
}

/**
 * Create an empty checklist for an agent
 */
export function createEmptyChecklist(
  agentId: string,
  agentName: string,
  agentType: AgentType
): AgentChecklist {
  return {
    schema_version: '2.0.0',
    agent_id: agentId,
    agent_name: agentName,
    checklist_version: '0.1.0',
    last_updated: new Date().toISOString(),
    status: 'draft',
    core_standards: {
      differentiation: {
        items: [
          createChecklistItem('diff-1', 'Agent explicitly targets Shadow Ops (off-system work: WhatsApp/DMs/Sheets/memory)'),
          createChecklistItem('diff-2', 'Agent explicitly targets Exceptions (edge cases that break normal flows)'),
          createChecklistItem('diff-3', 'Agent output includes at least one Shadow Ops output type'),
          createChecklistItem('diff-4', 'Agent avoids generic automation language and uses operator-grade outcomes'),
        ],
      },
      output_contract: {
        items: [
          createChecklistItem('out-1', 'Agent outputs a single structured object (JSON schema aligned)'),
          createChecklistItem('out-2', 'Agent includes required IDs to write into Ops Spine'),
          createChecklistItem('out-3', 'Agent states assumptions clearly (no invented tools, no fake numbers)'),
        ],
      },
      reliability: {
        items: [
          createChecklistItem('rel-1', 'Happy path defined'),
          createChecklistItem('rel-2', 'Top 5 exception paths defined'),
          createChecklistItem('rel-3', 'Tool failure fallback defined'),
          createChecklistItem('rel-4', 'Human escalation rules defined'),
          createChecklistItem('rel-5', 'Rollback/disable switch defined'),
        ],
      },
      auditability: {
        items: [
          createChecklistItem('aud-1', 'Agent emits audit events (event_type, entity_id, actor, result)'),
          createChecklistItem('aud-2', 'Logs include enough context to answer "what happened and why"'),
          createChecklistItem('aud-3', 'Data retention + where logs live is specified'),
        ],
      },
      security_access: {
        items: [
          createChecklistItem('sec-1', 'Least-privilege access model is defined'),
          createChecklistItem('sec-2', 'Disallowed actions are explicit'),
          createChecklistItem('sec-3', 'Sensitive data handling rules exist (PII, payments, credentials)'),
          createChecklistItem('sec-4', 'MCP tool permissions are specified (read/write boundaries)'),
        ],
      },
      kpi: {
        items: [
          createChecklistItem('kpi-1', 'Agent has 3-5 KPIs that prove value'),
          createChecklistItem('kpi-2', 'KPI definitions are measurable and tied to Ops Spine KPI entity'),
        ],
      },
      adoption: {
        items: [
          createChecklistItem('adp-1', 'Quickstart usable in 5-10 minutes'),
          createChecklistItem('adp-2', 'SOPs: daily + weekly + exception SOP'),
          createChecklistItem('adp-3', 'Micro-commitment step exists (client action that improves adoption)'),
        ],
      },
    },
    role_standards: {
      agent_type: agentType,
      required_items: [],
      addon_items: [],
    },
    ship_gate: {
      build_readiness: {
        items: [
          createChecklistItem('build-1', 'All Core Standards pass'),
          createChecklistItem('build-2', 'Role Standards pass'),
          createChecklistItem('build-3', 'QA passed for: happy path + exceptions + tool failures'),
          createChecklistItem('build-4', 'Audit events verified and traceable'),
          createChecklistItem('build-5', 'Client quickstart works in ≤10 minutes'),
        ],
      },
      business_readiness: {
        items: [
          createChecklistItem('biz-1', 'Proof angle identified (what makes this unique)'),
          createChecklistItem('biz-2', 'Sell sheet + demo script created'),
          createChecklistItem('biz-3', 'Pricing + capacity approved'),
        ],
      },
      ops_spine_readiness: {
        items: [
          createChecklistItem('ops-1', 'IDs and links correct across Lead → Opp → Project → Workflow'),
          createChecklistItem('ops-2', 'Tickets/CR process defined'),
          createChecklistItem('ops-3', 'KPI tracking and dashboard ready'),
        ],
      },
    },
  };
}

/**
 * Format validation report as markdown
 */
export function formatReportAsMarkdown(report: ValidationReport): string {
  const lines: string[] = [];

  lines.push(`# Agent Checklist Validation Report`);
  lines.push(``);
  lines.push(`**Agent:** ${report.agent_name} (${report.agent_id})`);
  lines.push(`**Validated:** ${report.validation_timestamp}`);
  lines.push(`**Ship Ready:** ${report.is_ship_ready ? '✅ YES' : '❌ NO'}`);
  lines.push(`**Overall Score:** ${report.overall_score}%`);
  lines.push(``);

  lines.push(`## Summary`);
  lines.push(``);
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total Items | ${report.summary.total_items} |`);
  lines.push(`| Passed | ${report.summary.passed_items} |`);
  lines.push(`| Blocked | ${report.summary.blocked_items} |`);
  lines.push(`| Not Started | ${report.summary.not_started_items} |`);
  lines.push(`| In Progress | ${report.summary.in_progress_items} |`);
  lines.push(`| Pass Rate | ${report.summary.pass_rate}% |`);
  lines.push(``);

  lines.push(`## Standards Status`);
  lines.push(``);
  lines.push(`| Standard | Status |`);
  lines.push(`|----------|--------|`);
  lines.push(`| Core Standards | ${report.core_standards_passed ? '✅ PASSED' : '❌ FAILED'} |`);
  lines.push(`| Role Standards | ${report.role_standards_passed ? '✅ PASSED' : '❌ FAILED'} |`);
  lines.push(`| Ship Gate | ${report.ship_gate_passed ? '✅ PASSED' : '❌ FAILED'} |`);
  lines.push(``);

  lines.push(`## Category Details`);
  lines.push(``);

  for (const category of report.category_results) {
    const status = category.passed ? '✅' : '❌';
    lines.push(`### ${status} ${category.category}`);
    lines.push(``);
    lines.push(`- Passed: ${category.passed_items}/${category.total_items}`);

    if (category.issues.length > 0) {
      lines.push(`- Issues:`);
      for (const issue of category.issues) {
        const icon = issue.severity === 'error' ? '🔴' : issue.severity === 'warning' ? '🟡' : 'ℹ️';
        lines.push(`  - ${icon} ${issue.message}`);
        if (issue.suggestion) {
          lines.push(`    - 💡 ${issue.suggestion}`);
        }
      }
    }
    lines.push(``);
  }

  if (report.blockers.length > 0) {
    lines.push(`## Blockers`);
    lines.push(``);
    for (const blocker of report.blockers) {
      lines.push(`- **${blocker.checklist_item_id}**: ${blocker.description}`);
      lines.push(`  - Ticket: ${blocker.ticket_id}`);
      if (blocker.priority) {
        lines.push(`  - Priority: ${blocker.priority}`);
      }
    }
    lines.push(``);
  }

  lines.push(`## Recommendations`);
  lines.push(``);
  for (const rec of report.recommendations) {
    lines.push(`- ${rec}`);
  }

  return lines.join('\n');
}

/**
 * Quick check if an agent checklist is ship-ready
 */
export function isShipReady(checklist: AgentChecklist): boolean {
  const validator = new ChecklistValidator(checklist);
  const report = validator.validate();
  return report.is_ship_ready;
}

export default ChecklistValidator;
