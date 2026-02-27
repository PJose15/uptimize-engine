import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const limit = parseInt(searchParams.get('limit') || '100', 10);

        const where: Record<string, unknown> = { clientId: 'client_001' };

        if (status && status !== 'all') {
            where.status = status;
        }
        if (search) {
            where.OR = [
                { action: { contains: search } },
                { tool: { contains: search } },
                { details: { contains: search } },
            ];
        }

        const entries = await prisma.auditEntry.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            take: Math.min(limit, 500),
        });

        return NextResponse.json(entries.map(e => ({
            id: e.id,
            timestamp: e.timestamp.toISOString(),
            action: e.action,
            tool: e.tool,
            status: e.status,
            approved_by: e.approvedBy,
            cost_usd: e.costUsd,
            details: e.details,
        })));
    } catch (error) {
        console.error('Portal audit API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
