/**
 * PVision Diagnosis Pipeline — Stage 2: Pre-Job Documentation — STUB (Sprint 14.2)
 *
 * MISSION
 * Generate the pre-job documentation packet: site photo checklist, scope of
 * work derived from validated intake, materials/equipment list, safety brief,
 * customer acknowledgement form, and the technician runbook for the job.
 *
 * Consumes Stage 1 output. Output feeds Stage 3 (Change Order Management)
 * once the job is in progress.
 *
 * Full implementation is a future cycle.
 */

import type { IntakeValidationOutput } from './stage-1-intake-validation';

export interface PreJobDocumentationInput {
  jobId: string;
  /** Output of Stage 1 — required */
  validatedIntake: IntakeValidationOutput;
  /** Scheduled job date (ISO) */
  scheduledFor: string;
  /** Assigned technician(s) */
  assignedTechnicians: string[];
  /** Customer's preferred contact channel for D-1 reminder */
  customerContactChannel?: 'sms' | 'email' | 'phone_call';
}

export interface PhotoChecklistItem {
  area: string;
  description: string;
  required: boolean;
}

export interface MaterialItem {
  item: string;
  quantity: number;
  unit: string;
  estimatedCostUsd?: number;
}

export interface PreJobDocumentationOutput {
  jobId: string;
  scopeOfWork: string;
  photoChecklist: PhotoChecklistItem[];
  materialsList: MaterialItem[];
  safetyBrief: string;
  technicianRunbook: string;
  customerAcknowledgementText: string;
  /** D-1 reminder draft */
  customerReminderDraft: string;
}

export interface PreJobDocumentationResult {
  success: boolean;
  message: string;
  data?: PreJobDocumentationOutput;
  error?: { type: string; details: string; timestamp: string };
}

export const PVISION_STAGE_2_CONFIG = {
  ventureId: 'pvision',
  pipelineId: 'diagnosis',
  stageNumber: 2,
  stageId: 'pre-job-documentation',
  name: 'Pre-Job Documentation',
  mission:
    'Generate the technician runbook, photo checklist, materials list, and customer acknowledgement before job start.',
  status: 'stub' as const,
  previousStage: 'intake-validation',
  nextStage: 'change-order-management',
  futureImplementationNotes:
    'Triggered after Stage 1 returns status=ready_for_stage2. Photo checklist + materials list pushed to tech mobile app.',
} as const;

export async function runStage2PreJobDocumentation(
  _input: PreJobDocumentationInput,
): Promise<PreJobDocumentationResult> {
  return {
    success: false,
    message: 'Not implemented — Sprint 14.2 stub',
    error: {
      type: 'NOT_IMPLEMENTED',
      details: 'See PVISION_STAGE_2_CONFIG.futureImplementationNotes',
      timestamp: new Date().toISOString(),
    },
  };
}
