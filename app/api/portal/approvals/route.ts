import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const where: Record<string, unknown> = { clientId: 'client_001' };
        if (status && status !== 'all') {
            where.status = status;
        }

        const items = await prisma.approvalItem.findMany({
            where,
            orderBy: { timestamp: 'desc' },
        });

        return NextResponse.json(items.map(item => ({
            id: item.id,
            timestamp: item.timestamp.toISOString(),
            action: item.action,
            description: item.description,
            risk_level: item.riskLevel,
            affected_system: item.affectedSystem,
            reason: item.reason,
            status: item.status,
            decided_at: item.decidedAt?.toISOString() ?? null,
            decided_by: item.decidedBy,
            note: item.note,
        })));
    } catch (error) {
        console.error('Portal approvals GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, decision, decided_by, note } = body;

        if (!id || !decision || !['approved', 'denied'].includes(decision)) {
            return NextResponse.json(
                { error: 'Invalid request: requires id, decision (approved|denied)' },
                { status: 400 }
            );
        }

        const item = await prisma.approvalItem.findUnique({ where: { id } });
        if (!item) {
            return NextResponse.json({ error: 'Approval not found' }, { status: 404 });
        }
        if (item.status !== 'pending') {
            return NextResponse.json({ error: 'Approval already decided' }, { status: 409 });
        }

        const updated = await prisma.approvalItem.update({
            where: { id },
            data: {
                status: decision,
                decidedAt: new Date(),
                decidedBy: decided_by || 'Portal User',
                note: note || null,
            },
        });

        // Also log to audit
        await prisma.auditEntry.create({
            data: {
                action: `${decision === 'approved' ? 'Approved' : 'Denied'}: ${item.action}`,
                tool: 'Approval Gate',
                status: decision,
                approvedBy: decided_by || 'Portal User',
                costUsd: 0,
                details: note || `${decision} via portal`,
                clientId: item.clientId,
            },
        });

        return NextResponse.json({
            id: updated.id,
            timestamp: updated.timestamp.toISOString(),
            action: updated.action,
            description: updated.description,
            risk_level: updated.riskLevel,
            affected_system: updated.affectedSystem,
            reason: updated.reason,
            status: updated.status,
            decided_at: updated.decidedAt?.toISOString() ?? null,
            decided_by: updated.decidedBy,
            note: updated.note,
        });
    } catch (error) {
        console.error('Portal approvals PATCH error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
