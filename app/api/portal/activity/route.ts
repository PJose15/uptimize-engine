import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const pillar = searchParams.get('pillar');
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const limit = parseInt(searchParams.get('limit') || '50', 10);

        const where: Record<string, unknown> = { clientId: 'client_001' };

        if (pillar && pillar !== 'All') {
            where.pillar = pillar;
        }
        if (status && status !== 'All') {
            where.status = status;
        }
        if (search) {
            where.OR = [
                { action: { contains: search } },
                { description: { contains: search } },
            ];
        }

        const events = await prisma.activityEvent.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            take: Math.min(limit, 100),
        });

        return NextResponse.json(events.map(e => ({
            id: e.id,
            timestamp: e.timestamp.toISOString(),
            action: e.action,
            description: e.description,
            status: e.status,
            pillar: e.pillar,
            tool_used: e.toolUsed,
            cost_usd: e.costUsd,
            duration_ms: e.durationMs,
        })));
    } catch (error) {
        console.error('Portal activity API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
