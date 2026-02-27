import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const stats = await prisma.portalStats.findUnique({
            where: { clientId: 'client_001' },
        });

        if (!stats) {
            return NextResponse.json({ error: 'Stats not found' }, { status: 404 });
        }

        // Get live pending count
        const pendingCount = await prisma.approvalItem.count({
            where: { clientId: 'client_001', status: 'pending' },
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
        console.error('Portal stats API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
