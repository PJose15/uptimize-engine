/**
 * Pipeline Sessions API
 * POST /api/pipeline/sessions — Create new session
 * GET  /api/pipeline/sessions — List all sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSession } from '@/lib/auth';
import { getClientIdFromRequest } from '@/lib/portal';
import { validateCSRFToken } from '@/lib/csrf';

function getSessionToken(request: NextRequest): string | null {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) return null;
    const match = cookieHeader
        .split(';')
        .map(c => c.trim())
        .find(c => c.startsWith('session='));
    return match ? match.split('=').slice(1).join('=') : null;
}

export async function POST(request: NextRequest) {
    try {
        const csrfToken = request.headers.get('x-csrf-token');
        const token = getSessionToken(request);
        if (!csrfToken || !token || !validateCSRFToken(csrfToken, token)) {
            return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
        }
        const session = await validateSession(token);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const clientId = await getClientIdFromRequest(request);
        const body = await request.json();
        const { label } = body;

        if (!label || typeof label !== 'string') {
            return NextResponse.json(
                { error: 'Missing required field: label (string)' },
                { status: 400 }
            );
        }

        const pipelineSession = await prisma.pipelineSession.create({
            data: {
                clientId,
                label: label.trim(),
                status: 'active',
                currentStage: 'INITIATED',
            },
        });

        return NextResponse.json({
            id: pipelineSession.id,
            sessionId: pipelineSession.sessionId,
            clientId: pipelineSession.clientId,
            label: pipelineSession.label,
            status: pipelineSession.status,
            currentStage: pipelineSession.currentStage,
            totalCost: pipelineSession.totalCostUsd,
            createdAt: pipelineSession.createdAt.toISOString(),
        }, { status: 201 });

    } catch (error) {
        const msg = error instanceof Error ? error.message : '';
        if (msg === 'Unauthenticated' || msg === 'No session token' || msg === 'Session expired') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.error('Pipeline sessions POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const token = getSessionToken(request);
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const session = await validateSession(token);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const clientId = await getClientIdFromRequest(request);

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const where: Record<string, unknown> = { clientId };
        if (status && status !== 'all') {
            where.status = status;
        }

        const sessions = await prisma.pipelineSession.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        return NextResponse.json(sessions.map(s => ({
            id: s.id,
            sessionId: s.sessionId,
            clientId: s.clientId,
            label: s.label,
            status: s.status,
            currentStage: s.currentStage,
            totalCost: s.totalCostUsd,
            createdAt: s.createdAt.toISOString(),
            updatedAt: s.updatedAt.toISOString(),
            completedAt: s.completedAt?.toISOString() ?? null,
            hasAgent1Output: s.agent1Output !== null,
            hasAgent2Output: s.agent2Output !== null,
            hasAgent3Output: s.agent3Output !== null,
            hasAgent4Output: s.agent4Output !== null,
            hasAgent5Output: s.agent5Output !== null,
        })));

    } catch (error) {
        const msg = error instanceof Error ? error.message : '';
        if (msg === 'Unauthenticated' || msg === 'No session token' || msg === 'Session expired') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.error('Pipeline sessions GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
