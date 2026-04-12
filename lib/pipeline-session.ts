/**
 * V2 Pipeline Session — event-driven gate architecture
 */

import { prisma } from '@/lib/prisma';
import type { PipelineStage, SessionStatus, GateDecision } from '@/lib/types/handoffs';
import { VALID_TRANSITIONS, GATE_DECISION_FIELD, STAGE_OUTPUT_FIELD } from '@/lib/types/handoffs';

// ============================================================================
// CREATE
// ============================================================================

export async function createPipelineSession(input: {
  clientId: string;
  sessionName: string;
  createdBy: string;
}): Promise<{ id: string; sessionId: string }> {
  const session = await prisma.pipelineSession.create({
    data: {
      clientId: input.clientId,
      label: input.sessionName,
      status: 'ACTIVE',
      currentStage: 'INITIATED',
      createdBy: input.createdBy,
    },
  });
  return { id: session.id, sessionId: session.sessionId };
}

// ============================================================================
// TRANSITION
// ============================================================================

export interface TransitionResult {
  success: boolean;
  error?: string;
  session?: { id: string; currentStage: PipelineStage; status: SessionStatus };
}

export async function transitionStage(
  sessionId: string,
  targetStage: PipelineStage,
  updates?: Record<string, unknown>,
): Promise<TransitionResult> {
  const session = await prisma.pipelineSession.findUnique({ where: { sessionId } });
  if (!session) return { success: false, error: 'Session not found' };

  const current = session.currentStage as PipelineStage;
  const allowed = VALID_TRANSITIONS[current];
  if (!allowed?.includes(targetStage)) {
    return { success: false, error: `Invalid transition: ${current} → ${targetStage}` };
  }

  const status: SessionStatus = targetStage === 'COMPLETE' ? 'COMPLETE'
    : targetStage === 'ABANDONED' ? 'ABANDONED'
    : targetStage === 'BLOCKED' ? 'BLOCKED'
    : targetStage.includes('GATE') ? 'PAUSED'
    : 'ACTIVE';

  const updated = await prisma.pipelineSession.update({
    where: { sessionId },
    data: {
      currentStage: targetStage,
      status,
      ...(targetStage === 'COMPLETE' ? { completedAt: new Date() } : {}),
      ...(updates ?? {}),
    },
  });

  return {
    success: true,
    session: {
      id: updated.id,
      currentStage: updated.currentStage as PipelineStage,
      status: updated.status as SessionStatus,
    },
  };
}

// ============================================================================
// SAVE AGENT OUTPUT
// ============================================================================

export async function saveAgentOutput(
  sessionId: string,
  stage: PipelineStage,
  output: unknown,
  costUsd: number,
  durationMs: number,
): Promise<void> {
  const field = STAGE_OUTPUT_FIELD[stage];
  if (!field) return;

  await prisma.pipelineSession.update({
    where: { sessionId },
    data: {
      [field]: JSON.stringify(output),
      totalCostUsd: { increment: costUsd },
      totalDurationMs: { increment: durationMs },
    },
  });
}

// ============================================================================
// SAVE GATE DECISION
// ============================================================================

export async function saveGateDecision(
  sessionId: string,
  gate: 1 | 2 | 3 | 4 | 5,
  decision: GateDecision,
): Promise<void> {
  const field = GATE_DECISION_FIELD[gate];
  if (!field) return;

  await prisma.pipelineSession.update({
    where: { sessionId },
    data: { [field]: JSON.stringify(decision) },
  });
}

// ============================================================================
// GET SESSION STATE
// ============================================================================

export interface SessionState {
  id: string;
  sessionId: string;
  clientId: string;
  label: string;
  currentStage: PipelineStage;
  status: SessionStatus;
  outputs: Record<string, unknown>;
  decisions: Record<string, unknown>;
  totalCostUsd: number;
  totalDurationMs: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function getSessionState(sessionId: string): Promise<SessionState | null> {
  const s = await prisma.pipelineSession.findUnique({ where: { sessionId } });
  if (!s) return null;

  const parseJson = (val: string | null) => val ? JSON.parse(val) : undefined;

  return {
    id: s.id,
    sessionId: s.sessionId,
    clientId: s.clientId,
    label: s.label,
    currentStage: s.currentStage as PipelineStage,
    status: s.status as SessionStatus,
    outputs: {
      agent1: parseJson(s.agent1Output),
      agent2: parseJson(s.agent2Output),
      agent3: parseJson(s.agent3Output),
      agent6: parseJson(s.agent6Output),
      agent4: parseJson(s.agent4Output),
      agent5: parseJson(s.agent5Output),
    },
    decisions: {
      gate1: parseJson(s.gate1Decision),
      gate2: parseJson(s.gate2Decision),
      gate3: parseJson(s.gate3Decision),
      gate4: parseJson(s.gate4Decision),
      gate5: parseJson(s.gate5Decision),
    },
    totalCostUsd: s.totalCostUsd,
    totalDurationMs: s.totalDurationMs,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}
