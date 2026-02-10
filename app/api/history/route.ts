import { NextResponse } from 'next/server';
import {
    loadHistory,
    getRunById,
    deleteRun,
    clearHistory,
    getHistorySummary
} from '@/lib/history';

/**
 * GET /api/history - Get all pipeline history or a specific run
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const summary = searchParams.get('summary');

        // Return summary stats
        if (summary === 'true') {
            const stats = await getHistorySummary();
            return NextResponse.json(stats);
        }

        // Return specific run
        if (id) {
            const run = await getRunById(id);
            if (!run) {
                return NextResponse.json(
                    { error: 'Run not found' },
                    { status: 404 }
                );
            }
            return NextResponse.json(run);
        }

        // Return all history
        const history = await loadHistory();
        return NextResponse.json(history);

    } catch (error) {
        console.error('Error fetching history:', error);
        return NextResponse.json(
            { error: 'Failed to fetch history' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/history - Delete a run or clear all history
 */
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const all = searchParams.get('all');

        // Clear all history
        if (all === 'true') {
            await clearHistory();
            return NextResponse.json({ success: true, message: 'History cleared' });
        }

        // Delete specific run
        if (id) {
            const deleted = await deleteRun(id);
            if (!deleted) {
                return NextResponse.json(
                    { error: 'Run not found' },
                    { status: 404 }
                );
            }
            return NextResponse.json({ success: true, message: 'Run deleted' });
        }

        return NextResponse.json(
            { error: 'Missing id or all parameter' },
            { status: 400 }
        );

    } catch (error) {
        console.error('Error deleting history:', error);
        return NextResponse.json(
            { error: 'Failed to delete history' },
            { status: 500 }
        );
    }
}
