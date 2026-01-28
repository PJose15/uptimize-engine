/**
 * UptimizeAI Agent Validation Module
 *
 * Central exports for checklist validation and ship gate systems.
 */

// Checklist Validator
export {
  default as ChecklistValidator,
  // Types
  type ChecklistItemStatus,
  type ChecklistOverallStatus,
  type AgentType,
  type ShadowOpsOutput,
  type OpsSpineEntity,
  type SensitiveDataType,
  type MCPPermission,
  type BlockerPriority,
  type ChecklistItem,
  type ExceptionPath,
  type ToolFailureFallback,
  type HumanEscalationRule,
  type AuditEvent,
  type MCPToolPermission,
  type SensitiveDataRule,
  type KPI,
  type Quickstart,
  type SOPs,
  type MicroCommitment,
  type Blocker,
  type DifferentiationStandard,
  type OutputContractStandard,
  type ReliabilityStandard,
  type AuditabilityStandard,
  type SecurityAccessStandard,
  type KPIStandard,
  type AdoptionStandard,
  type CoreStandards,
  type RoleStandards,
  type QAResults,
  type BuildReadiness,
  type BusinessReadiness,
  type OpsSpineReadiness,
  type FinalApproval,
  type ShipGate as ShipGateType,
  type AgentChecklist,
  type ValidationIssue,
  type CategoryValidationResult,
  type ValidationReport,
  // Utilities
  createChecklistItem,
  createEmptyChecklist,
  formatReportAsMarkdown,
  isShipReady,
} from './checklist-validator';

// Ship Gate
export {
  default as ShipGate,
  // Types
  type ShipGateStatus,
  type ShipGateDecision,
  type ShipGateResult,
  type ShipGateConfig,
  type ShipGateRegistry,
  // Constants
  DEFAULT_SHIP_GATE_CONFIG,
  // Utilities
  createShipGateRegistry,
  updateRegistry,
  getRegistrySummary,
  formatShipGateResultAsMarkdown,
  formatRegistrySummaryAsMarkdown,
} from './ship-gate';

// CLI Runner
export {
  runChecklistValidation,
  runShipGateEvaluation,
  generateFullReport,
  type CLIOptions,
  type FullReport,
} from './cli-runner';
