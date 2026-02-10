import { NextResponse } from 'next/server';
import { cancelRun, getRunStatus, getAllActiveRuns } from '@/lib/pipeline-state';

/**
 * POST /api/pipeline/cancel - Cancel a running pipeline
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { runId } = body;

        if (!runId) {
            return NextResponse.json(
                { error: 'runId is required' },
                { status: 400 }
            );
        }

        const cancelled = cancelRun(runId);

        if (!cancelled) {
            const status = getRunStatus(runId);
            if (status) {
                return NextResponse.json(
                    { error: `Run is ${status.status}, cannot cancel` },
                    { status: 400 }
                );
            }
            return NextResponse.json(
                { error: 'Run not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Pipeline cancelled',
            runId,
        });

    } catch (error) {
        console.error('Error cancelling pipeline:', error);
        return NextResponse.json(
            { error: 'Failed to cancel pipeline' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/pipeline/cancel - Get all active runs (for cancel UI)
 */
export async function GET() {
    const activeRuns = getAllActiveRuns();

    return NextResponse.json({
        activeRuns: activeRuns.map(run => ({
            id: run.id,
            startTime: run.startTime,
            currentAgent: run.currentAgent,
            duration: Date.now() - run.startTime,
        })),
    });
}
