import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractPillarMetrics } from '@/lib/portal';
import type { PillarMetric } from '@/app/portal/mock-data';

// Seed fallback data matching mock-data.ts exactly
const SEED_PILLAR_METRICS: PillarMetric[] = [
    { pillar: 'shadow_ops', label: 'Shadow Ops', icon: '👻', before: 18, after: 5, unit: 'hrs/week', trend: 'down', description: 'Off-system work moved into tracked workflows' },
    { pillar: 'exceptions', label: 'Exceptions', icon: '⚡', before: 24, after: 8, unit: 'per week', trend: 'down', description: 'Edge cases auto-resolved without human intervention' },
    { pillar: 'audit_trail', label: 'Audit Trail', icon: '📋', before: 34, after: 97, unit: '% complete', trend: 'up', description: 'Actions with full provability chain' },
    { pillar: 'knowledge', label: 'Knowledge', icon: '🧠', before: 2, after: 0, unit: 'single points', trend: 'down', description: 'Single-person dependencies eliminated' },
    { pillar: 'handoffs', label: 'Handoffs & SLAs', icon: '🤝', before: 62, after: 94, unit: '% on-time', trend: 'up', description: 'Cross-team handoffs completed within SLA' },
    { pillar: 'channels', label: 'Channels & Evidence', icon: '📎', before: 41, after: 89, unit: '% captured', trend: 'up', description: 'Decisions with evidence trail and findability' },
];

const SEED_HOURS_SAVED_TREND = [
    { week: 'Jan 20', hours: 6.4 },
    { week: 'Jan 27', hours: 8.1 },
    { week: 'Feb 3', hours: 9.7 },
    { week: 'Feb 10', hours: 11.3 },
    { week: 'Feb 17', hours: 12.8 },
    { week: 'Feb 24', hours: 13.2 },
];

const SEED_HEALTH_SCORE_TREND = [
    { week: 'Jan 20', score: 74 },
    { week: 'Jan 27', score: 79 },
    { week: 'Feb 3', score: 83 },
    { week: 'Feb 10', score: 87 },
    { week: 'Feb 17', score: 90 },
    { week: 'Feb 24', score: 92 },
];

export async function GET() {
    try {
        // Try to derive pillar metrics from the most recent Agent 5 pipeline run
        let pillarMetrics = SEED_PILLAR_METRICS;
        let hoursSavedTrend = SEED_HOURS_SAVED_TREND;
        let healthScoreTrend = SEED_HEALTH_SCORE_TREND;

        const latestRun = await prisma.pipelineRun.findFirst({
            where: { status: 'completed' },
            orderBy: { timestamp: 'desc' },
        });

        if (latestRun) {
            try {
                const results = JSON.parse(latestRun.results);
                const agent5Data = results.agent5?.data;
                if (agent5Data) {
                    const derived = extractPillarMetrics(agent5Data);
                    if (derived.length > 0) {
                        pillarMetrics = derived;
                    }
                }
            } catch {
                // Use seed fallback
            }
        }

        const stats = await prisma.portalStats.findUnique({
            where: { clientId: 'client_001' },
        });

        return NextResponse.json({
            pillar_metrics: pillarMetrics,
            hours_saved_trend: hoursSavedTrend,
            health_score_trend: healthScoreTrend,
            stats: stats ? {
                hours_saved_week: stats.hoursSavedWeek,
                health_score: stats.healthScore,
                exceptions_auto_resolved: stats.exceptionsAutoResolved,
            } : null,
        });
    } catch (error) {
        console.error('Portal analytics API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
