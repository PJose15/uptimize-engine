/**
 * PVision Diagnosis Pipeline — Stage 4: Completion & Billing — STUB (Sprint 14.2)
 *
 * MISSION
 * Close out a completed job: validate completion-photo checklist coverage,
 * reconcile actual vs. quoted scope including approved change orders, generate
 * the final invoice, draft the customer wrap-up message + review request, and
 * hand off to the billing system (PVision uses existing billing-agent for the
 * actual invoice send).
 *
 * Final stage of diagnosis pipeline. Consumes Stage 2 baseline + Stage 3
 * approved change orders.
 *
 * Full implementation is a future cycle.
 */

import type { PreJobDocumentationOutput } from './stage-2-pre-job-documentation';
import type { ChangeOrderProposal } from './stage-3-change-order-management';

export interface CompletionPhoto {
  area: string;
  url: string;
  takenAt: string;             // ISO datetime
}

export interface CompletionBillingInput {
  jobId: string;
  /** Snapshot of the Stage 2 baseline used for this job */
  baseline: PreJobDocumentationOutput;
  /** Approved change orders from Stage 3 */
  approvedChangeOrders: ChangeOrderProposal[];
  /** Completion photos uploaded by technician */
  completionPhotos: CompletionPhoto[];
  /** Actual time on site */
  actualDurationMinutes: number;
  /** Technician's completion notes */
  technicianNotes?: string;
  /** Final material consumption (may differ from baseline) */
  actualMaterialsUsed?: Array<{ item: string; quantity: number; unit: string }>;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amountUsd: number;
}

export interface CompletionBillingOutput {
  jobId: string;
  completionStatus: 'ready_to_invoice' | 'documentation_gap' | 'dispute_risk';
  documentationGaps?: string[];     // missing photos, missing notes, etc.
  invoiceLineItems: InvoiceLineItem[];
  invoiceTotalUsd: number;
  customerWrapupMessage: string;
  reviewRequestMessage: string;
  /** True if Pedro needs to look at this before sending invoice */
  requiresPedroReview: boolean;
  reviewReason?: string;
}

export interface CompletionBillingResult {
  success: boolean;
  message: string;
  data?: CompletionBillingOutput;
  error?: { type: string; details: string; timestamp: string };
}

export const PVISION_STAGE_4_CONFIG = {
  ventureId: 'pvision',
  pipelineId: 'diagnosis',
  stageNumber: 4,
  stageId: 'completion-billing',
  name: 'Completion & Billing',
  mission:
    'Validate completion documentation, reconcile final scope, generate invoice, and hand off to billing-agent.',
  status: 'stub' as const,
  previousStage: 'change-order-management',
  nextStage: null,                  // terminal
  futureImplementationNotes:
    'Triggered when technician marks job complete. Output handed to existing pvision/billing-agent for the actual invoice send. Documentation gaps block invoice generation.',
} as const;

export async function runStage4CompletionBilling(
  _input: CompletionBillingInput,
): Promise<CompletionBillingResult> {
  return {
    success: false,
    message: 'Not implemented — Sprint 14.2 stub',
    error: {
      type: 'NOT_IMPLEMENTED',
      details: 'See PVISION_STAGE_4_CONFIG.futureImplementationNotes',
      timestamp: new Date().toISOString(),
    },
  };
}
