/**
 * Dashboard Stats API
 * GET /api/agents/stats — Aggregated metrics from PipelineSession data
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

export async function GET(request: NextRequest) {
    try {
        const token = getSessionToken(request);
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const session = await validateSession(token);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const clientId = await getClientIdFromRequest(request);

        // Fetch all non-archived sessions for this client
        const sessions = await prisma.pipelineSession.findMany({
            where: { clientId, status: { not: 'archived' } },
            orderBy: { createdAt: 'desc' },
        });

        // --- Metrics ---
        const totalSessions = sessions.length;
        const completedSessions = sessions.filter(s => s.status === 'completed').length;
        const successRate = totalSessions > 0
            ? Math.round((completedSessions / totalSessions) * 100)
            : 0;
        const avgCost = totalSessions > 0
            ? sessions.reduce((sum, s) => sum + s.totalCostUsd, 0) / totalSessions
            : 0;

        // Per-agent run counts
        const agent1Runs = sessions.filter(s => s.agent1Output !== null).length;
        const agent2Runs = sessions.filter(s => s.agent2Output !== null).length;
        const agent3Runs = sessions.filter(s => s.agent3Output !== null).length;
        const agent4Runs = sessions.filter(s => s.agent4Output !== null).length;
        const agent5Runs = sessions.filter(s => s.agent5Output !== null).length;

        // --- Pipeline History (last 7 days) ---
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const now = new Date();

        // Key by date string (YYYY-MM-DD) to avoid merging counts across week boundaries
        const toDateKey = (d: Date) => d.toISOString().slice(0, 10);

        const dayCounts = new Map<string, number>();
        for (const s of sessions) {
            const key = toDateKey(s.createdAt);
            dayCounts.set(key, (dayCounts.get(key) || 0) + 1);
        }

        // Build array starting from 6 days ago through today
        const pipelineHistory: { name: string; value: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            pipelineHistory.push({
                name: dayNames[d.getDay()],
                value: dayCounts.get(toDateKey(d)) || 0,
            });
        }

        // --- Agent Performance (run counts per agent) ---
        const agentPerformance = [
            { name: 'Agent 1', value: agent1Runs },
            { name: 'Agent 2', value: agent2Runs },
            { name: 'Agent 3', value: agent3Runs },
            { name: 'Agent 4', value: agent4Runs },
            { name: 'Agent 5', value: agent5Runs },
        ];

        // --- Lead Distribution (from agent1Output fit tiers) ---
        let highFit = 0;
        let mediumFit = 0;
        let lowFit = 0;

        for (const s of sessions.slice(0, 10)) {
            const output = safeJsonParse(s.agent1Output);
            if (!output || typeof output !== 'object') continue;
            const data = output as Record<string, unknown>;

            // Try common structures for target pack
            const prospects = (data.target_pack_primary ?? data.prospects ?? data.leads) as unknown[];
            if (!Array.isArray(prospects)) continue;

            for (const p of prospects) {
                if (!p || typeof p !== 'object') continue;
                const prospect = p as Record<string, unknown>;
                const score = Number(prospect.fit_score ?? prospect.fitScore ?? 0);
                if (score >= 70) highFit++;
                else if (score >= 40) mediumFit++;
                else lowFit++;
            }
        }

        const leadDistribution = [
            { name: 'High Fit', value: highFit },
            { name: 'Medium', value: mediumFit },
            { name: 'Low', value: lowFit },
        ];

        // --- Recent Agent Runs (last 3 completed sessions) ---
        const agentNames: Record<number, { name: string; description: string }> = {
            1: { name: 'Market Intelligence', description: 'Analyze leads, score by fit' },
            2: { name: 'Outbound & Appointment', description: 'Generate campaigns, book meetings' },
            3: { name: 'Sales Engineer', description: 'Discovery, proposals, SOW' },
            4: { name: 'Delivery Builder', description: 'Build automation packages' },
            5: { name: 'Success Manager', description: 'Health scoring, proof assets' },
        };

        const recentCompleted = sessions
            .filter(s => s.status === 'completed')
            .slice(0, 3);

        // Map V2 stage strings to numeric for backward compat
        const stageToNum = (stage: string): number => {
            const map: Record<string, number> = {
                'INITIATED': 0, 'AGENT1_RUNNING': 1, 'GATE1_REVIEW': 1,
                'AGENT2_RUNNING': 2, 'GATE2_REVIEW': 2,
                'AGENT3_RUNNING': 3, 'GATE3_REVIEW': 3,
                'AGENT6_RUNNING': 3, 'GATE4_REVIEW': 3,
                'AGENT4_RUNNING': 4, 'GATE5_REVIEW': 4,
                'AGENT5_ACTIVE': 5, 'COMPLETE': 5, 'ABANDONED': 0, 'BLOCKED': 0,
            };
            return map[stage] ?? (typeof stage === 'string' ? parseInt(stage) || 0 : 0);
        };

        const recentAgents = recentCompleted.map(s => {
            // Find the highest completed agent
            const stageNum = stageToNum(s.currentStage);
            const agentNum = Math.min(Math.max(stageNum, 1), 5);
            const outputKey = `agent${agentNum}Output` as keyof typeof s;
            const outputRaw = s[outputKey] as string | null;
            const preview = outputRaw
                ? outputRaw.substring(0, 100)
                : '';

            return {
                agentNumber: agentNum,
                name: agentNames[agentNum]?.name ?? `Agent ${agentNum}`,
                description: agentNames[agentNum]?.description ?? '',
                status: 'success' as const,
                outputPreview: preview,
            };
        });

        // --- Pipeline flow agents (derive from latest session) ---
        const latestSession = sessions[0];
        const currentStageNum = stageToNum(latestSession?.currentStage ?? 'INITIATED');
        const latestStatus = latestSession?.status ?? 'ACTIVE';

        const pipelineAgents = [
            { id: 1, name: 'Market Intel' },
            { id: 2, name: 'Outbound' },
            { id: 3, name: 'Sales' },
            { id: 4, name: 'Delivery' },
            { id: 5, name: 'Success' },
        ].map(agent => {
            let status: 'pending' | 'running' | 'success' | 'error' = 'pending';
            if (latestStatus === 'COMPLETE' || latestStatus === 'completed') {
                status = 'success';
            } else if (agent.id < currentStageNum) {
                status = 'success';
            } else if (agent.id === currentStageNum) {
                status = (latestStatus === 'ACTIVE' || latestStatus === 'active') ? 'running' : 'pending';
            }
            return { ...agent, status };
        });

        return NextResponse.json({
            metrics: {
                totalSessions,
                completedSessions,
                successRate,
                avgCost: Math.round(avgCost * 100) / 100,
                agentRuns: { agent1Runs, agent2Runs, agent3Runs, agent4Runs, agent5Runs },
            },
            pipelineHistory,
            agentPerformance,
            leadDistribution,
            recentAgents,
            pipelineAgents,
        });

    } catch (error) {
        const msg = error instanceof Error ? error.message : '';
        if (msg === 'Unauthenticated' || msg === 'No session token' || msg === 'Session expired') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.error('Dashboard stats GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
