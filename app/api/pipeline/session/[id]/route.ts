/**
 * GET /api/pipeline/session/[id] — Get pipeline session state
 */

import { NextResponse } from 'next/server';
import { getSessionState } from '@/lib/pipeline-session';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const state = await getSessionState(id);
    if (!state) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    return NextResponse.json(state);
  } catch (err) {
    console.error('[pipeline/session] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
