/**
 * SmartGym Equipment Intelligence Agent — STUB (Sprint 14.2)
 *
 * MISSION
 * Monitor equipment usage and condition signals to predict maintenance windows,
 * detect underused assets (capital efficiency), and recommend purchase /
 * disposal decisions based on demand patterns and ROI.
 *
 * Full implementation is a future cycle.
 */

export interface EquipmentReading {
  equipmentId: string;
  equipmentType: string;
  usageHours30d?: number;
  lastServiceDate?: string;        // ISO date
  reportedIssues?: string[];
  manufacturerExpectedHoursToService?: number;
}

export interface EquipmentIntelligenceContext {
  gymLocation: string;
  readings: EquipmentReading[];
  /** Recent member complaints relevant to equipment */
  complaintNotes?: string[];
  notes?: string;
}

export interface MaintenanceRecommendation {
  equipmentId: string;
  action: 'service_now' | 'schedule_service' | 'monitor' | 'retire' | 'add_unit';
  urgency: 'P1' | 'P2' | 'P3';
  reason: string;
  estimatedCostUsd?: number;
}

export interface EquipmentIntelligenceOutput {
  gymLocation: string;
  utilizationSummary: {
    underused: string[];        // equipmentIds
    overused: string[];         // equipmentIds (queue/wait risk)
    healthyUtilization: number; // count
  };
  recommendations: MaintenanceRecommendation[];
  capitalNotes?: string;
}

export interface EquipmentIntelligenceResult {
  success: boolean;
  message: string;
  data?: EquipmentIntelligenceOutput;
  error?: { type: string; details: string; timestamp: string };
}

export const EQUIPMENT_INTELLIGENCE_AGENT_CONFIG = {
  ventureId: 'smartgym',
  agentId: 'equipment-intelligence',
  name: 'Equipment Intelligence Agent',
  mission:
    'Predict maintenance, surface underutilized equipment, and recommend capital allocation based on usage data.',
  status: 'stub' as const,
  futureImplementationNotes:
    'Reads from EquipmentReading model (not yet created). Cron weekly. Output feeds Pedro brief + maintenance vendor handoff.',
} as const;

export async function runEquipmentIntelligence(
  _context: EquipmentIntelligenceContext,
): Promise<EquipmentIntelligenceResult> {
  return {
    success: false,
    message: 'Not implemented — Sprint 14.2 stub',
    error: {
      type: 'NOT_IMPLEMENTED',
      details: 'See EQUIPMENT_INTELLIGENCE_AGENT_CONFIG.futureImplementationNotes',
      timestamp: new Date().toISOString(),
    },
  };
}
