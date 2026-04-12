/**
 * V2 Handoff Schemas — Inter-agent envelopes and gate decisions
 */

// ============================================================================
// PIPELINE STAGE & STATUS
// ============================================================================

export type PipelineStage =
  | 'INITIATED' | 'AGENT1_RUNNING' | 'GATE1_REVIEW'
  | 'AGENT2_RUNNING' | 'GATE2_REVIEW'
  | 'AGENT3_RUNNING' | 'GATE3_REVIEW'
  | 'AGENT6_RUNNING' | 'GATE4_REVIEW'
  | 'AGENT4_RUNNING' | 'GATE5_REVIEW'
  | 'AGENT5_ACTIVE' | 'COMPLETE' | 'ABANDONED' | 'BLOCKED';

export type SessionStatus = 'ACTIVE' | 'PAUSED' | 'BLOCKED' | 'COMPLETE' | 'ABANDONED';

// ============================================================================
// VALID TRANSITIONS
// ============================================================================

export const VALID_TRANSITIONS: Record<string, PipelineStage[]> = {
  INITIATED:       ['AGENT1_RUNNING'],
  AGENT1_RUNNING:  ['GATE1_REVIEW', 'BLOCKED'],
  GATE1_REVIEW:    ['AGENT2_RUNNING', 'ABANDONED'],
  AGENT2_RUNNING:  ['GATE2_REVIEW', 'BLOCKED'],
  GATE2_REVIEW:    ['AGENT3_RUNNING', 'ABANDONED'],
  AGENT3_RUNNING:  ['GATE3_REVIEW', 'BLOCKED'],
  GATE3_REVIEW:    ['AGENT6_RUNNING', 'ABANDONED'],
  AGENT6_RUNNING:  ['GATE4_REVIEW', 'BLOCKED'],
  GATE4_REVIEW:    ['AGENT4_RUNNING', 'ABANDONED'],
  AGENT4_RUNNING:  ['GATE5_REVIEW', 'BLOCKED'],
  GATE5_REVIEW:    ['AGENT5_ACTIVE', 'ABANDONED'],
  AGENT5_ACTIVE:   ['COMPLETE'],
  BLOCKED:         ['AGENT1_RUNNING', 'AGENT2_RUNNING', 'AGENT3_RUNNING', 'AGENT6_RUNNING', 'AGENT4_RUNNING', 'ABANDONED'],
};

// ============================================================================
// GATE DECISIONS
// ============================================================================

export interface Gate1Decision {
  approvedLeadIds: string[];
  skippedLeadIds: string[];
  angleOverride?: string;
  notes?: string;
}

export interface Gate2Decision {
  approvedBookingIds: string[];
  nurtureLeadIds: string[];
  notes?: string;
}

export interface Gate3Decision {
  proposalApproved: boolean;
  scopeModifications?: string[];
  pricingAdjustment?: number;
  tierRecommendation?: 'starter' | 'growth' | 'full_system';
  notes?: string;
}

export interface Gate4Decision {
  contractConfirmed: boolean;
  credentialsVerified: boolean;
  kickoffScheduled: boolean;
  notes?: string;
}

export interface Gate5Decision {
  buildApproved: boolean;
  openIssuesAccepted?: string[];
  deploymentDate?: string;
  notes?: string;
}

export type GateDecision = Gate1Decision | Gate2Decision | Gate3Decision | Gate4Decision | Gate5Decision;

// ============================================================================
// STAGE / AGENT / GATE MAPS
// ============================================================================

export const GATE_TRANSITIONS: Record<number, { from: PipelineStage; to: PipelineStage }> = {
  1: { from: 'GATE1_REVIEW', to: 'AGENT2_RUNNING' },
  2: { from: 'GATE2_REVIEW', to: 'AGENT3_RUNNING' },
  3: { from: 'GATE3_REVIEW', to: 'AGENT6_RUNNING' },
  4: { from: 'GATE4_REVIEW', to: 'AGENT4_RUNNING' },
  5: { from: 'GATE5_REVIEW', to: 'AGENT5_ACTIVE' },
};

export const STAGE_TO_AGENT: Partial<Record<PipelineStage, string>> = {
  AGENT1_RUNNING: 'agent-1-market-intelligence',
  AGENT2_RUNNING: 'agent-2-outbound-appointment',
  AGENT3_RUNNING: 'agent-3-sales-engineer',
  AGENT6_RUNNING: 'agent-6-closer',
  AGENT4_RUNNING: 'agent-4-systems-builder',
  AGENT5_ACTIVE:  'agent-5-client-success',
};

export const STAGE_OUTPUT_FIELD: Partial<Record<PipelineStage, string>> = {
  AGENT1_RUNNING: 'agent1Output',
  AGENT2_RUNNING: 'agent2Output',
  AGENT3_RUNNING: 'agent3Output',
  AGENT6_RUNNING: 'agent6Output',
  AGENT4_RUNNING: 'agent4Output',
  AGENT5_ACTIVE:  'agent5Output',
};

export const GATE_DECISION_FIELD: Record<number, string> = {
  1: 'gate1Decision',
  2: 'gate2Decision',
  3: 'gate3Decision',
  4: 'gate4Decision',
  5: 'gate5Decision',
};

// ============================================================================
// HANDOFF ENVELOPES (V2 inter-agent payloads)
// ============================================================================

export interface Agent3ToAgent6Handoff {
  proposal: unknown;
  auditFindings: unknown;
  vertical: string;
  clientId: string;
  gate3Decision: Gate3Decision;
}

export interface Agent6ToAgent4Handoff {
  contractSigned: boolean;
  credentials: Record<string, unknown>;
  kickoffDate?: string;
  vertical: string;
  clientId: string;
  gate4Decision: Gate4Decision;
}

export interface Agent7ToAgent1Handoff {
  leadId: string;
  company: string;
  vertical: string;
  readinessScore: number;
  requalifyBrief: string;
}

export interface Agent7ToAgent2Handoff {
  leadId: string;
  company: string;
  vertical: string;
  touchSequence: string[];
  angle: string;
}

export interface Agent5ToAgent6ExpansionHandoff {
  clientId: string;
  currentHealthScore: number;
  expansionOpportunity: string;
  vertical: string;
}

export interface Agent8LearningDistributionHandoff {
  learningId: string;
  learningType: string;
  key: string;
  value: string;
  confidence: number;
  vertical: string;
}
