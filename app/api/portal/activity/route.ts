import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getClientIdFromRequest } from '@/lib/portal';
import type { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
    try {
        const clientId = await getClientIdFromRequest(request);
        const { searchParams } = new URL(request.url);
        const pillar = searchParams.get('pillar');
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const limit = parseInt(searchParams.get('limit') || '50', 10) || 50;

        const where: Prisma.ActivityEventWhereInput = { clientId };

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
        const msg = error instanceof Error ? error.message : '';
        if (msg === 'Unauthenticated' || msg === 'No session token' || msg === 'Session expired') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.error('Portal activity API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
