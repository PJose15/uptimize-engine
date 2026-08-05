/**
 * Cron Job Trigger
 * GET /api/cron/[job]
 *
 * The operational agents (8–13) had workers and schedules but no entry point,
 * so nothing could reach them outside a test harness. This is that entry point:
 * Vercel Cron (or any scheduler) calls it, and it dispatches from CRON_JOBS.
 *
 * Vercel Cron sends GET with `Authorization: Bearer $CRON_SECRET`. POST is
 * accepted too so a job can be triggered manually with the same credential.
 */

import { NextRequest, NextResponse } from 'next/server';
import { CRON_JOBS } from '@/lib/scheduler/operational-jobs';

// Agent jobs make several model calls; give them room.
export const maxDuration = 300;

/** Constant-time compare, so the secret cannot be recovered by timing guesses. */
function secretMatches(provided: string, expected: string): boolean {
    if (provided.length !== expected.length) return false;

    let diff = 0;
    for (let i = 0; i < provided.length; i++) {
        diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    return diff === 0;
}

function authorize(request: NextRequest): NextResponse | null {
    const expected = process.env.CRON_SECRET;

    // No secret configured means no way to tell a scheduler from anyone else.
    // These endpoints spend money and write to client systems, so this closes
    // rather than opening.
    if (!expected) {
        console.error('[cron] CRON_SECRET is not configured — refusing to run jobs');
        return NextResponse.json({ error: 'Cron endpoint is not configured' }, { status: 503 });
    }

    const header = request.headers.get('authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';

    if (!token || !secretMatches(token, expected)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return null;
}

async function dispatch(request: NextRequest, job: string): Promise<NextResponse> {
    const denied = authorize(request);
    if (denied) return denied;

    const entry = CRON_JOBS[job];
    if (!entry) {
        return NextResponse.json(
            { error: `Unknown cron job: ${job}`, available: Object.keys(CRON_JOBS) },
            { status: 404 },
        );
    }

    const startedAt = Date.now();

    try {
        await entry.run();

        const durationMs = Date.now() - startedAt;
        console.log(`[cron] ${job} completed in ${durationMs}ms`);

        return NextResponse.json({ success: true, job, durationMs });
    } catch (error) {
        const durationMs = Date.now() - startedAt;
        const message = error instanceof Error ? error.message : 'Unknown error';

        // Logged loudly and returned as 500 so a failed run is visible in the
        // scheduler's own history rather than silently succeeding.
        console.error(`[cron] ${job} failed after ${durationMs}ms:`, error);

        return NextResponse.json({ success: false, job, durationMs, error: message }, { status: 500 });
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ job: string }> },
) {
    const { job } = await params;
    return dispatch(request, job);
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ job: string }> },
) {
    const { job } = await params;
    return dispatch(request, job);
}
