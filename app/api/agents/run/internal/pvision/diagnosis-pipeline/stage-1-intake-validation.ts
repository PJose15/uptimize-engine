/**
 * PVision Diagnosis Pipeline — Stage 1: Intake Validation — STUB (Sprint 14.2)
 *
 * MISSION
 * Validate customer intake before a job is scheduled: confirm property type,
 * scope clarity, access requirements, customer expectations, and risk flags
 * (asbestos era, lead paint, structural concerns). Reject or escalate intakes
 * that aren't job-ready.
 *
 * Output feeds Stage 2 (Pre-Job Documentation).
 *
 * Full implementation is a future cycle.
 */

export interface IntakeValidationInput {
  jobId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  propertyAddress: string;
  propertyType?: 'single_family' | 'multi_family' | 'commercial' | 'other';
  yearBuilt?: number;
  /** Raw scope description as provided by customer */
  rawScope: string;
  /** Customer-stated budget range, if any */
  budgetRangeUsd?: { min: number; max: number };
  /** Access details (gate code, pet on premises, occupancy, etc.) */
  accessNotes?: string;
  attachments?: Array<{ kind: 'photo' | 'plan' | 'doc'; url: string }>;
}

export interface IntakeRiskFlag {
  flag: 'asbestos_era' | 'lead_paint_era' | 'structural_concern' | 'permit_required' | 'access_unclear' | 'scope_too_vague' | 'budget_misaligned';
  severity: 'P1' | 'P2' | 'P3';
  detail: string;
}

export interface IntakeValidationOutput {
  jobId: string;
  status: 'ready_for_stage2' | 'needs_followup' | 'reject';
  /** Normalized scope after parsing rawScope */
  normalizedScope?: string;
  riskFlags: IntakeRiskFlag[];
  /** Questions to ask the customer before proceeding */
  followupQuestions?: string[];
  /** If rejected, why */
  rejectionReason?: string;
}

export interface IntakeValidationResult {
  success: boolean;
  message: string;
  data?: IntakeValidationOutput;
  error?: { type: string; details: string; timestamp: string };
}

export const PVISION_STAGE_1_CONFIG = {
  ventureId: 'pvision',
  pipelineId: 'diagnosis',
  stageNumber: 1,
  stageId: 'intake-validation',
  name: 'Intake Validation',
  mission:
    'Validate customer intake against scope clarity, access, and risk era flags before scheduling.',
  status: 'stub' as const,
  nextStage: 'pre-job-documentation',
  futureImplementationNotes:
    'Triggered on Lead.created. Uses TASK_PROFILES["sub-classifier"]. P1 flags route to Pedro before customer contact.',
} as const;

export async function runStage1IntakeValidation(
  _input: IntakeValidationInput,
): Promise<IntakeValidationResult> {
  return {
    success: false,
    message: 'Not implemented — Sprint 14.2 stub',
    error: {
      type: 'NOT_IMPLEMENTED',
      details: 'See PVISION_STAGE_1_CONFIG.futureImplementationNotes',
      timestamp: new Date().toISOString(),
    },
  };
}
