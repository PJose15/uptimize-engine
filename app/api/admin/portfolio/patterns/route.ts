/**
 * Admin Portfolio Patterns
 * GET   /api/admin/portfolio/patterns  — detect against current state, persist new ones, return history
 * PATCH /api/admin/portfolio/patterns  — record that a pattern was acted on
 *
 * Detection runs on read rather than on a schedule because it is a pure
 * function over current portfolio state — there is nothing to accumulate
 * between runs, and a stale weekly snapshot would be worse than recomputing.
 * Persistence exists so `wasActedOn` and the operator's notes survive.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { validateCSRFToken } from '@/lib/csrf';
import { extractSessionToken } from '@/lib/api-auth';
import { loadPortfolioClients, detectPortfolioPatterns, persistPatterns } from '@/lib/portfolio';

function parseJsonArray(value: string): string[] {
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export async function GET(request: NextRequest) {
    const auth = await requireSession(request);
    if (auth instanceof Response) return auth;

    try {
        const clients = await loadPortfolioClients();
        const detected = detectPortfolioPatterns(clients);
        const newlyRecorded = await persistPatterns(detected);

        const history = await prisma.portfolioPattern.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        return NextResponse.json({
            detected_now: detected.length,
            newly_recorded: newlyRecorded,
            patterns: history.map(p => ({
                id: p.id,
                week_of: p.weekOf,
                pattern_type: p.patternType,
                severity: p.severity,
                description: p.description,
                affected_client_ids: parseJsonArray(p.affectedClientIds),
                verticals_affected: parseJsonArray(p.verticalsAffected),
                was_acted_on: p.wasActedOn,
                notes: p.pedroNotes,
                resolved_at: p.resolvedAt?.toISOString() ?? null,
                created_at: p.createdAt.toISOString(),
            })),
        });
    } catch (error) {
        console.error('Admin portfolio patterns API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    const auth = await requireSession(request);
    if (auth instanceof Response) return auth;

    // State-changing, so it needs CSRF protection like the other PATCH routes.
    const csrfToken = request.headers.get('x-csrf-token');
    const sessionToken = extractSessionToken(request.headers.get('cookie'));
    if (!csrfToken || !sessionToken || !validateCSRFToken(csrfToken, sessionToken)) {
        return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }

    try {
        const body = await request.json().catch(() => null) as
            | { id?: string; wasActedOn?: boolean; notes?: string }
            | null;

        if (!body?.id) {
            return NextResponse.json({ error: 'Missing required field: id' }, { status: 400 });
        }

        const existing = await prisma.portfolioPattern.findUnique({ where: { id: body.id } });
        if (!existing) {
            return NextResponse.json({ error: 'Pattern not found' }, { status: 404 });
        }

        const wasActedOn = body.wasActedOn ?? true;

        const updated = await prisma.portfolioPattern.update({
            where: { id: body.id },
            data: {
                wasActedOn,
                pedroNotes: body.notes ?? existing.pedroNotes,
                // Clearing the flag reopens the pattern, so the resolution
                // timestamp has to come off with it.
                resolvedAt: wasActedOn ? (existing.resolvedAt ?? new Date()) : null,
            },
        });

        return NextResponse.json({
            id: updated.id,
            was_acted_on: updated.wasActedOn,
            notes: updated.pedroNotes,
            resolved_at: updated.resolvedAt?.toISOString() ?? null,
        });
    } catch (error) {
        console.error('Admin portfolio patterns PATCH error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
