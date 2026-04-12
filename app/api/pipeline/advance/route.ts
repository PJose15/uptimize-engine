/**
 * POST /api/pipeline/advance — Gate decision → run next agent
 */

import { NextResponse } from 'next/server';
import { saveGateDecision, transitionStage, getSessionState } from '@/lib/pipeline-session';
import { GATE_TRANSITIONS } from '@/lib/types/handoffs';
import type { GateDecision, PipelineStage } from '@/lib/types/handoffs';

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      sessionId: string;
      gate: 1 | 2 | 3 | 4 | 5;
      decision: GateDecision;
    };

    const { sessionId, gate, decision } = body;
    if (!sessionId || !gate || !decision) {
      return NextResponse.json({ error: 'Missing sessionId, gate, or decision' }, { status: 400 });
    }

    // Verify session is at the correct gate
    const state = await getSessionState(sessionId);
    if (!state) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const expected = GATE_TRANSITIONS[gate];
    if (!expected || state.currentStage !== expected.from) {
      return NextResponse.json(
        { error: `Session at ${state.currentStage}, expected ${expected?.from} for gate ${gate}` },
        { status: 409 },
      );
    }

    // Save decision
    await saveGateDecision(sessionId, gate, decision);

    // Transition to next agent stage
    const result = await transitionStage(sessionId, expected.to as PipelineStage);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      sessionId,
      gate,
      nextStage: result.session?.currentStage,
      status: result.session?.status,
    });
  } catch (err) {
    console.error('[pipeline/advance] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
