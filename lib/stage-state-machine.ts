/**
 * Stage State Machine
 * Pure logic to derive visual states for each pipeline stage from session data.
 */

export type StageState = 'locked' | 'ready' | 'running' | 'review' | 'approved' | 'completed';

export interface StageInfo {
  number: number;
  name: string;
  state: StageState;
}

export interface SessionData {
  id: string;
  sessionId: string;
  label: string;
  status: string;
  currentStage: number;
  agent1Output: unknown;
  agent2Output: unknown;
  agent3Output: unknown;
  agent4Output: unknown;
  agent5Output: unknown;
  selectedProspects: unknown;
  selectedBookings: unknown;
  totalCost: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

const STAGE_NAMES: Record<number, string> = {
  1: 'Market Intelligence',
  2: 'Outbound & Appointment',
  3: 'Sales Engineer',
  4: 'Systems Delivery',
  5: 'Client Success',
};

function getAgentOutput(session: SessionData, stageNum: number): unknown {
  const key = `agent${stageNum}Output` as keyof SessionData;
  return session[key];
}

/**
 * Derive the visual state for each of the 5 pipeline stages.
 *
 * Rules:
 * - Session completed → all stages 'completed'
 * - Running agent → that stage is 'running'
 * - Stage 1: ready if no output; review if output but no selectedProspects; approved if both
 * - Stage 2: locked until stage 1 approved; then same pattern with selectedBookings
 * - Stages 3-5: locked until previous approved; ready → review → approved based on output + currentStage
 */
export function deriveStageStates(session: SessionData, runningAgentId: number | null): StageInfo[] {
  // All completed
  if (session.status === 'completed') {
    return [1, 2, 3, 4, 5].map(n => ({
      number: n,
      name: STAGE_NAMES[n],
      state: 'completed' as StageState,
    }));
  }

  const stages: StageInfo[] = [];

  for (let n = 1; n <= 5; n++) {
    let state: StageState;

    // If this agent is currently running
    if (runningAgentId === n) {
      state = 'running';
    } else {
      state = deriveIndividualState(session, n);
    }

    stages.push({ number: n, name: STAGE_NAMES[n], state });
  }

  return stages;
}

function deriveIndividualState(session: SessionData, stageNum: number): StageState {
  const output = getAgentOutput(session, stageNum);
  const hasOutput = output !== null && output !== undefined;

  if (stageNum === 1) {
    if (!hasOutput) return 'ready';
    if (session.selectedProspects === null || session.selectedProspects === undefined) return 'review';
    if (Array.isArray(session.selectedProspects) && session.selectedProspects.length === 0) return 'review';
    return 'approved';
  }

  if (stageNum === 2) {
    // Locked until stage 1 is approved (has output + non-empty selectedProspects)
    const hasProspects = session.selectedProspects != null
      && (!Array.isArray(session.selectedProspects) || session.selectedProspects.length > 0);
    const stage1Approved = getAgentOutput(session, 1) != null && hasProspects;
    if (!stage1Approved) return 'locked';
    if (!hasOutput) return 'ready';
    if (session.selectedBookings === null || session.selectedBookings === undefined) return 'review';
    return 'approved';
  }

  // Stages 3-5: locked until previous stage is approved
  const prevApproved = isPreviousStageApproved(session, stageNum);
  if (!prevApproved) return 'locked';
  if (!hasOutput) return 'ready';
  // For stages 3-5, approval is tracked via currentStage >= stageNum
  if (session.currentStage >= stageNum) return 'approved';
  return 'review';
}

function isPreviousStageApproved(session: SessionData, stageNum: number): boolean {
  const prev = stageNum - 1;
  const prevOutput = getAgentOutput(session, prev);
  if (prevOutput == null) return false;

  if (prev === 1) return session.selectedProspects != null;
  if (prev === 2) return session.selectedBookings != null;
  // Stages 3-4: approved when currentStage >= prev
  return session.currentStage >= prev;
}

/**
 * Build the task + context payload for running a given agent.
 */
export function buildAgentContext(
  agentId: number,
  session: SessionData
): { task: string; context: Record<string, unknown> } {
  switch (agentId) {
    case 1:
      return {
        task: session.label,
        context: {},
      };

    case 2: {
      // Filter Agent 1 output to only selected prospects
      const agent1 = session.agent1Output as Record<string, unknown> | null;
      const selectedIds = (session.selectedProspects as string[]) || [];
      let filteredPack = agent1;

      if (agent1 && Array.isArray(agent1.target_pack_primary)) {
        const primary = (agent1.target_pack_primary as Array<{ lead_id: string }>)
          .filter(lead => selectedIds.includes(lead.lead_id));
        filteredPack = { ...agent1, target_pack_primary: primary };
      }

      return {
        task: `Outreach campaigns for selected prospects from: ${session.label}`,
        context: { targetPack: filteredPack },
      };
    }

    case 3:
      return {
        task: `Sales engineering and proposal generation for: ${session.label}`,
        context: { agent2Output: session.agent2Output },
      };

    case 4:
      return {
        task: `Systems delivery package for: ${session.label}`,
        context: { agent3Output: session.agent3Output },
      };

    case 5:
      return {
        task: `Client success and health scoring for: ${session.label}`,
        context: { agent4Output: session.agent4Output },
      };

    default:
      return { task: session.label, context: {} };
  }
}
