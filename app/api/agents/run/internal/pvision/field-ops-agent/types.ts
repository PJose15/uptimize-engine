/**
 * Types for PVision Field Ops Agent
 *
 * Manages plumbing/HVAC field technician dispatch,
 * route optimization, and emergency escalation.
 */

// ========================================
// INPUT CONTEXT
// ========================================

export type JobPriority = "emergency" | "urgent" | "standard" | "scheduled";

export type JobType = "plumbing_repair" | "plumbing_install" | "hvac_repair" | "hvac_install" | "hvac_maintenance" | "inspection" | "estimate" | "other";

export interface FieldOpsContext {
  /** Service area (city/region) */
  serviceArea?: string;
  /** Technician roster */
  technicianRoster?: {
    totalTechs?: number;
    availableNow?: number;
    specializations?: Record<string, string[]>;
  };
  /** Open jobs in queue */
  openJobs?: Array<{
    jobId?: string;
    jobType?: JobType;
    priority?: JobPriority;
    address?: string;
    customerName?: string;
    scheduledTime?: string;
    estimatedDuration?: string;
  }>;
  /** Current date/time for scheduling */
  currentDateTime?: string;
  /** Additional notes */
  notes?: string;
}

// ========================================
// OUTPUT STRUCTURES
// ========================================

export interface DispatchAssignment {
  jobId: string;
  technicianName: string;
  estimatedArrival: string;
  estimatedDuration: string;
  routeNotes: string;
}

export interface RouteOptimization {
  technicianName: string;
  jobSequence: string[];
  totalDriveTime: string;
  totalJobTime: string;
  efficiency: string;
}

export interface EscalationItem {
  jobId: string;
  reason: string;
  escalationLevel: "supervisor" | "manager" | "emergency";
  recommendedAction: string;
}

export interface FieldOpsOutput {
  dispatchDate: string;
  serviceArea: string;
  assignments: DispatchAssignment[];
  routeOptimization: RouteOptimization[];
  etaEstimates: Record<string, string>;
  escalations: EscalationItem[];
  unassignedJobs: string[];
  summary: string;
}

// ========================================
// AGENT RESULT
// ========================================

export interface FieldOpsResult {
  success: boolean;
  message: string;
  data?: FieldOpsOutput;
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
