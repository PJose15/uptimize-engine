import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getClientIdFromRequest, transformPermissions } from '@/lib/portal';

export async function GET(request: NextRequest) {
    try {
        const clientId = await getClientIdFromRequest(request);
        const permissions = transformPermissions();

        // Enrich with last_used from AuditEntry table
        const recentAudits = await prisma.auditEntry.findMany({
            where: { clientId },
            orderBy: { timestamp: 'desc' },
            take: 100,
        });

        // Build a map of tool → latest timestamp
        const toolLastUsed = new Map<string, string>();
        for (const audit of recentAudits) {
            const toolLower = audit.tool.toLowerCase();
            if (!toolLastUsed.has(toolLower)) {
                toolLastUsed.set(toolLower, audit.timestamp.toISOString());
            }
        }

        // Enrich permissions with last_used (match by tool id, not category name)
        for (const group of permissions) {
            for (const tool of group.tools) {
                const toolIdLower = tool.id.toLowerCase();
                if (toolLastUsed.has(toolIdLower)) {
                    tool.last_used = toolLastUsed.get(toolIdLower) ?? null;
                }
            }
        }

        return NextResponse.json(permissions);
    } catch (error) {
        const msg = error instanceof Error ? error.message : '';
        if (msg === 'Unauthenticated' || msg === 'No session token' || msg === 'Session expired') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.error('Portal permissions API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
