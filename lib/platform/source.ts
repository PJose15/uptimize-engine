/**
 * Where the command center gets its data.
 *
 * Default: the configured snapshot in `data.ts`. Set `UPTIMAIZE_LIVE_DATA=1` and
 * the sections that have a real source in the schema are read from the database
 * and overlaid on top; everything else stays on the snapshot and is reported as
 * `demo` so the UI can label it. Any database failure falls back to the snapshot
 * rather than breaking the page.
 */

import { cache } from 'react';
import { getCommandCenterData } from './data';
import { ALL_DEMO, buildLiveSections, type LiveRows, type SectionSources } from './live';
import { scopeData, type PlatformSearchParams } from './scope';
import type { CommandCenterData } from './types';

export interface PlatformPayload {
    data: CommandCenterData;
    sources: SectionSources;
    mode: 'demo' | 'live';
}

export function liveDataEnabled(): boolean {
    return process.env.UPTIMAIZE_LIVE_DATA === '1';
}

/** How far back the activity, run, and approval windows reach. */
const WINDOW_DAYS = 30;

async function fetchLiveRows(since: Date): Promise<LiveRows> {
    const { prisma } = await import('@/lib/prisma');

    const [clients, portfolios, subAgentRuns, events, approvals, sessions, stats] =
        await Promise.all([
            prisma.clientConfig.findMany({
                select: { clientId: true, company: true, name: true },
                orderBy: { createdAt: 'asc' },
            }),
            prisma.clientPortfolio.findMany({
                select: {
                    clientId: true,
                    stage: true,
                    currentHealthScore: true,
                    healthTrend: true,
                    healthScoreHistory: true,
                    startDate: true,
                },
            }),
            prisma.subAgentRun.findMany({
                where: { createdAt: { gte: since } },
                select: {
                    parentAgentId: true,
                    clientId: true,
                    taskCompleted: true,
                    escalationNeeded: true,
                    escalationSeverity: true,
                    createdAt: true,
                },
            }),
            prisma.activityEvent.findMany({
                where: { timestamp: { gte: since } },
                orderBy: { timestamp: 'desc' },
                take: 40,
                select: {
                    id: true,
                    action: true,
                    description: true,
                    status: true,
                    pillar: true,
                    toolUsed: true,
                    costUsd: true,
                    durationMs: true,
                    timestamp: true,
                    clientId: true,
                },
            }),
            prisma.approvalItem.findMany({
                where: { status: 'pending' },
                orderBy: { timestamp: 'asc' },
                take: 25,
                select: {
                    id: true,
                    action: true,
                    description: true,
                    riskLevel: true,
                    affectedSystem: true,
                    status: true,
                    timestamp: true,
                    clientId: true,
                },
            }),
            prisma.pipelineSession.findMany({
                where: { createdAt: { gte: since } },
                orderBy: { updatedAt: 'desc' },
                take: 50,
                select: {
                    id: true,
                    clientId: true,
                    label: true,
                    status: true,
                    currentStage: true,
                    totalDurationMs: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
            prisma.portalStats.findMany({
                select: { clientId: true, hoursSavedWeek: true, successRate: true, healthScore: true },
            }),
        ]);

    return { clients, portfolios, subAgentRuns, events, approvals, sessions, stats };
}

/**
 * The current payload. Cached per request so several server components on the
 * same page share one set of queries.
 */
export const loadPlatformPayload = cache(async (): Promise<PlatformPayload> => {
    const snapshot = getCommandCenterData();

    if (!liveDataEnabled()) {
        return { data: snapshot, sources: { ...ALL_DEMO }, mode: 'demo' };
    }

    try {
        const now = new Date();
        const since = new Date(now.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
        const rows = await fetchLiveRows(since);
        const { data, sources } = buildLiveSections(snapshot, rows, now);
        return { data, sources, mode: 'live' };
    } catch (error) {
        // An unmigrated or unreachable database must not take the page down.
        console.error('[platform] live data unavailable, serving snapshot:', error);
        return { data: snapshot, sources: { ...ALL_DEMO }, mode: 'demo' };
    }
});

/** The payload narrowed to the scope on the URL. */
export async function getScopedPayload(
    params: PlatformSearchParams = {}
): Promise<PlatformPayload> {
    const payload = await loadPlatformPayload();
    return {
        ...payload,
        data: scopeData(payload.data, { partner: params.partner, query: params.q }),
    };
}

/** Convenience for pages that only need the data. */
export async function getScopedData(
    params: PlatformSearchParams = {}
): Promise<CommandCenterData> {
    return (await getScopedPayload(params)).data;
}
