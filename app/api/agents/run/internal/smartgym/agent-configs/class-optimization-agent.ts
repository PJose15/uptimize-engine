/**
 * SmartGym Class Optimization Agent — STUB (Sprint 14.2)
 *
 * MISSION
 * Analyze class attendance, demand, and instructor capacity to optimize the
 * weekly schedule: add high-demand slots, retire chronically-empty classes,
 * rebalance instructors, and detect emerging program demand.
 *
 * Full implementation is a future cycle.
 */

export interface ClassSession {
  sessionId: string;
  className: string;
  instructor: string;
  dayOfWeek: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
  startTime: string;          // "HH:MM" 24h
  durationMin: number;
  capacity: number;
  averageAttendance30d: number;
  noShowRate?: number;        // 0-1
}

export interface ClassOptimizationContext {
  gymLocation: string;
  currentSchedule: ClassSession[];
  /** Member-survey or DM-reported class requests not yet on schedule */
  unmetDemand?: Array<{ className: string; requestCount: number }>;
  notes?: string;
}

export interface ScheduleChange {
  type: 'add' | 'remove' | 'reschedule' | 'reassign_instructor';
  className: string;
  current?: { dayOfWeek: string; startTime: string; instructor?: string };
  proposed?: { dayOfWeek: string; startTime: string; instructor?: string };
  rationale: string;
  expectedAttendanceLift?: number;
}

export interface ClassOptimizationOutput {
  gymLocation: string;
  weekOf: string;             // ISO week, e.g. "2026-W19"
  proposedChanges: ScheduleChange[];
  retireRecommendations: string[]; // sessionIds chronically empty
  growthOpportunities: string[];   // narrative
}

export interface ClassOptimizationResult {
  success: boolean;
  message: string;
  data?: ClassOptimizationOutput;
  error?: { type: string; details: string; timestamp: string };
}

export const CLASS_OPTIMIZATION_AGENT_CONFIG = {
  ventureId: 'smartgym',
  agentId: 'class-optimization',
  name: 'Class Optimization Agent',
  mission:
    'Optimize weekly class schedule based on attendance, demand signals, and instructor capacity.',
  status: 'stub' as const,
  futureImplementationNotes:
    'Reads from ClassSession + Attendance models. Weekly cron Sun PM. Output goes to Pedro for approval before publishing schedule.',
} as const;

export async function runClassOptimization(
  _context: ClassOptimizationContext,
): Promise<ClassOptimizationResult> {
  return {
    success: false,
    message: 'Not implemented — Sprint 14.2 stub',
    error: {
      type: 'NOT_IMPLEMENTED',
      details: 'See CLASS_OPTIMIZATION_AGENT_CONFIG.futureImplementationNotes',
      timestamp: new Date().toISOString(),
    },
  };
}
