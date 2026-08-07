/**
 * Admin Portfolio Overview
 * GET /api/admin/portfolio
 *
 * Portfolio-wide health, weekly capacity load, and the per-client roster the
 * admin dashboard renders. Admin session required — this exposes every client's
 * revenue and health, so it is not scoped to a single client the way the
 * /api/portal routes are.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/api-auth';
import {
    loadPortfolioClients,
    calculatePortfolioHealthScore,
    calculateWeeklyLoad,
} from '@/lib/portfolio';

export async function GET(request: NextRequest) {
    const auth = await requireSession(request);
    if (auth instanceof Response) return auth;

    try {
        const clients = await loadPortfolioClients();

        return NextResponse.json({
            health: calculatePortfolioHealthScore(clients),
            capacity: calculateWeeklyLoad(clients),
            clients,
        });
    } catch (error) {
        console.error('Admin portfolio API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
