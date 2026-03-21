import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getClientIdFromRequest } from '@/lib/portal';

export async function GET(request: NextRequest) {
    try {
        const clientId = await getClientIdFromRequest(request);
        const stats = await prisma.portalStats.findUnique({
            where: { clientId },
        });

        if (!stats) {
            return NextResponse.json({ error: 'Stats not found' }, { status: 404 });
        }

        // Get live pending count
        const pendingCount = await prisma.approvalItem.count({
            where: { clientId, status: 'pending' },
        });

        return NextResponse.json({
            actions_today: stats.actionsToday,
            hours_saved_week: stats.hoursSavedWeek,
            pending_approvals: pendingCount,
            health_score: stats.healthScore,
            total_actions_month: stats.totalActionsMonth,
            total_cost_month: stats.totalCostMonth,
            success_rate: stats.successRate,
            exceptions_auto_resolved: stats.exceptionsAutoResolved,
        });
    } catch (error) {
        const msg = error instanceof Error ? error.message : '';
        if (msg === 'Unauthenticated' || msg === 'No session token' || msg === 'Session expired') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.error('Portal stats API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
