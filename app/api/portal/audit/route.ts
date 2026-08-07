import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getClientIdFromRequest } from '@/lib/portal';
import { insensitiveContains } from '@/lib/db-compat';

export async function GET(request: NextRequest) {
    try {
        const clientId = await getClientIdFromRequest(request);
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const limit = parseInt(searchParams.get('limit') || '100', 10);

        const where: Record<string, unknown> = { clientId };

        if (status && status !== 'all') {
            where.status = status;
        }
        if (search) {
            where.OR = [
                { action: insensitiveContains(search) },
                { tool: insensitiveContains(search) },
                { details: insensitiveContains(search) },
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
        const msg = error instanceof Error ? error.message : '';
        if (msg === 'Unauthenticated' || msg === 'No session token' || msg === 'Session expired') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.error('Portal audit API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
