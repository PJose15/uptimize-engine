/**
 * Pipeline Session Detail API
 * GET    /api/pipeline/sessions/[id] — Get session with all outputs
 * PATCH  /api/pipeline/sessions/[id] — Update stage, save output, mark selections
 * DELETE /api/pipeline/sessions/[id] — Archive session
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSession } from '@/lib/auth';
import { getClientIdFromRequest } from '@/lib/portal';

function getSessionToken(request: NextRequest): string | null {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) return null;
    const match = cookieHeader
        .split(';')
        .map(c => c.trim())
        .find(c => c.startsWith('session='));
    return match ? match.split('=').slice(1).join('=') : null;
}

function safeJsonParse(input: string | null): unknown {
    if (!input) return null;
    try { return JSON.parse(input); } catch { return null; }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const token = getSessionToken(request);
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const session = await validateSession(token);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const clientId = await getClientIdFromRequest(request);

        const pipelineSession = await prisma.pipelineSession.findUnique({
            where: { id },
        });

        if (!pipelineSession) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // Ensure the session belongs to this client
        if (pipelineSession.clientId !== clientId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json({
            id: pipelineSession.id,
            sessionId: pipelineSession.sessionId,
            clientId: pipelineSession.clientId,
            label: pipelineSession.label,
            status: pipelineSession.status,
            currentStage: pipelineSession.currentStage,
            agent1Output: safeJsonParse(pipelineSession.agent1Output),
            agent2Output: safeJsonParse(pipelineSession.agent2Output),
            agent3Output: safeJsonParse(pipelineSession.agent3Output),
            agent4Output: safeJsonParse(pipelineSession.agent4Output),
            agent5Output: safeJsonParse(pipelineSession.agent5Output),
            selectedProspects: safeJsonParse(pipelineSession.selectedProspects),
            selectedBookings: safeJsonParse(pipelineSession.selectedBookings),
            totalCost: pipelineSession.totalCost,
            createdAt: pipelineSession.createdAt.toISOString(),
            updatedAt: pipelineSession.updatedAt.toISOString(),
            completedAt: pipelineSession.completedAt?.toISOString() ?? null,
        });

    } catch (error) {
        const msg = error instanceof Error ? error.message : '';
        if (msg === 'Unauthenticated' || msg === 'No session token' || msg === 'Session expired') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.error('Pipeline session GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const token = getSessionToken(request);
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const session = await validateSession(token);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const clientId = await getClientIdFromRequest(request);

        const existing = await prisma.pipelineSession.findUnique({
            where: { id },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        if (existing.clientId !== clientId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const updateData: Record<string, unknown> = {};

        // Update current stage
        if (typeof body.currentStage === 'number' && body.currentStage >= 0 && body.currentStage <= 5) {
            updateData.currentStage = body.currentStage;
        }

        // Update status
        if (body.status && ['active', 'paused', 'completed', 'archived'].includes(body.status)) {
            updateData.status = body.status;
            if (body.status === 'completed') {
                updateData.completedAt = new Date();
            }
        }

        // Save agent outputs (stored as JSON strings)
        for (const agentKey of ['agent1Output', 'agent2Output', 'agent3Output', 'agent4Output', 'agent5Output']) {
            if (body[agentKey] !== undefined) {
                updateData[agentKey] = JSON.stringify(body[agentKey]);
            }
        }

        // Save selections
        if (body.selectedProspects !== undefined) {
            updateData.selectedProspects = JSON.stringify(body.selectedProspects);
        }
        if (body.selectedBookings !== undefined) {
            updateData.selectedBookings = JSON.stringify(body.selectedBookings);
        }

        // Accumulate cost
        if (typeof body.addCost === 'number' && body.addCost > 0) {
            updateData.totalCost = existing.totalCost + body.addCost;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No valid update fields provided' }, { status: 400 });
        }

        const updated = await prisma.pipelineSession.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({
            id: updated.id,
            sessionId: updated.sessionId,
            label: updated.label,
            status: updated.status,
            currentStage: updated.currentStage,
            totalCost: updated.totalCost,
            updatedAt: updated.updatedAt.toISOString(),
        });

    } catch (error) {
        const msg = error instanceof Error ? error.message : '';
        if (msg === 'Unauthenticated' || msg === 'No session token' || msg === 'Session expired') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.error('Pipeline session PATCH error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const token = getSessionToken(request);
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const session = await validateSession(token);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const clientId = await getClientIdFromRequest(request);

        const existing = await prisma.pipelineSession.findUnique({
            where: { id },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        if (existing.clientId !== clientId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Archive instead of hard delete
        await prisma.pipelineSession.update({
            where: { id },
            data: { status: 'archived' },
        });

        return NextResponse.json({ success: true, message: 'Session archived' });

    } catch (error) {
        const msg = error instanceof Error ? error.message : '';
        if (msg === 'Unauthenticated' || msg === 'No session token' || msg === 'Session expired') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.error('Pipeline session DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
