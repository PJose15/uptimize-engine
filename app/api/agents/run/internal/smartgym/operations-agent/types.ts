/**
 * Types for SmartGym Operations Agent
 *
 * Tracks class schedules, equipment maintenance,
 * staff operations, and gym utilization metrics.
 */

// ========================================
// INPUT CONTEXT
// ========================================

export interface OperationsContext {
  /** Gym location identifier */
  gymLocation?: string;
  /** Class schedule summary */
  classSchedule?: {
    totalClassesThisWeek?: number;
    classTypes?: string[];
    averageAttendanceRate?: number;
    underperformingClasses?: string[];
  };
  /** Equipment inventory summary */
  equipmentInventory?: {
    totalPieces?: number;
    maintenanceDue?: string[];
    outOfService?: string[];
    recentlyServiced?: string[];
  };
  /** Staff roster summary */
  staffRoster?: {
    totalStaff?: number;
    trainersOnDuty?: number;
    openShifts?: number;
    certificationExpiring?: string[];
  };
  /** Time period for the report */
  reportPeriod?: "daily" | "weekly" | "monthly";
  /** Additional notes */
  notes?: string;
}

// ========================================
// OUTPUT STRUCTURES
// ========================================

export interface UtilizationMetrics {
  overallUtilization: number; // 0-100%
  peakHours: string[];
  offPeakHours: string[];
  spaceUtilization: number;
  equipmentUtilization: number;
}

export interface MaintenanceAlert {
  equipmentName: string;
  alertType: "preventive" | "urgent" | "overdue";
  description: string;
  estimatedCost: string;
  scheduledDate: string;
}

export interface StaffingGap {
  timeSlot: string;
  role: string;
  severity: "critical" | "moderate" | "minor";
  recommendation: string;
}

export interface ClassRecommendation {
  action: "add" | "remove" | "reschedule" | "resize";
  className: string;
  reason: string;
  expectedImpact: string;
}

export interface OperationsOutput {
  reportDate: string;
  gymLocation: string;
  utilization: UtilizationMetrics;
  maintenanceAlerts: MaintenanceAlert[];
  staffingGaps: StaffingGap[];
  classRecommendations: ClassRecommendation[];
  actionItems: string[];
  summary: string;
}

// ========================================
// AGENT RESULT
// ========================================

export interface OperationsResult {
  success: boolean;
  message: string;
  data?: OperationsOutput;
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
