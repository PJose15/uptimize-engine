/**
 * PVision Diagnosis Pipeline — Stage 3: Change Order Management — STUB (Sprint 14.2)
 *
 * MISSION
 * Handle in-job scope changes: technician discovers unexpected condition,
 * customer requests added work, or original scope proves incorrect. Generate
 * a typed change order with cost delta, customer-readable explanation, and
 * approval routing. Approved orders update the active job scope; rejected
 * orders trigger graceful technician fallback.
 *
 * Consumes Stage 2 output as baseline. Output feeds Stage 4 (Completion & Billing).
 *
 * Full implementation is a future cycle.
 */

export interface ChangeOrderTrigger {
  jobId: string;
  triggeredBy: 'technician' | 'customer' | 'automated_inspection';
  /** What changed vs the original scope */
  discoveredCondition: string;
  /** Photos/docs supporting the change */
  evidence?: Array<{ kind: 'photo' | 'doc' | 'reading'; url: string }>;
  /** Technician's preliminary estimate of added scope */
  proposedAddedWork: string;
  technicianEstimateUsd?: number;
}

export interface ChangeOrderManagementInput {
  jobId: string;
  triggers: ChangeOrderTrigger[];
  /** Baseline scope from Stage 2 */
  originalScopeOfWork: string;
  originalQuoteUsd: number;
}

export interface ChangeOrderProposal {
  changeOrderId: string;
  addedScope: string;
  reason: string;
  costDeltaUsd: number;
  timeDeltaMinutes: number;
  customerFacingExplanation: string;
  approvalPath: 'auto_approve' | 'customer_approval' | 'pedro_approval';
  approvalReasoning: string;
}

export interface ChangeOrderManagementOutput {
  jobId: string;
  proposals: ChangeOrderProposal[];
  combinedCostDeltaUsd: number;
  /** Updated scope assuming all auto-approve + customer-approved orders accepted */
  projectedFinalScope: string;
  projectedFinalQuoteUsd: number;
}

export interface ChangeOrderManagementResult {
  success: boolean;
  message: string;
  data?: ChangeOrderManagementOutput;
  error?: { type: string; details: string; timestamp: string };
}

export const PVISION_STAGE_3_CONFIG = {
  ventureId: 'pvision',
  pipelineId: 'diagnosis',
  stageNumber: 3,
  stageId: 'change-order-management',
  name: 'Change Order Management',
  mission:
    'Convert mid-job discoveries into typed change orders with proper approval routing.',
  status: 'stub' as const,
  previousStage: 'pre-job-documentation',
  nextStage: 'completion-billing',
  approvalThresholds: {
    auto_approve_max_usd: 50,
    customer_approval_max_usd: 500,
    // Anything above 500 USD → pedro_approval
  },
  futureImplementationNotes:
    'Triggered from technician mobile app or automated inspection. Approval gates wire into existing approval queue infra.',
} as const;

export async function runStage3ChangeOrderManagement(
  _input: ChangeOrderManagementInput,
): Promise<ChangeOrderManagementResult> {
  return {
    success: false,
    message: 'Not implemented — Sprint 14.2 stub',
    error: {
      type: 'NOT_IMPLEMENTED',
      details: 'See PVISION_STAGE_3_CONFIG.futureImplementationNotes',
      timestamp: new Date().toISOString(),
    },
  };
}
