/**
 * Portfolio Repository
 *
 * Bridges ClientPortfolio rows to the PortfolioClientView shape the pure
 * functions in portfolio-health.ts and portfolio-patterns.ts operate on.
 *
 * Client names live on ClientConfig, not ClientPortfolio, so they are joined
 * here rather than duplicated into the portfolio table.
 */

import { prisma } from '@/lib/prisma';
import type { PortfolioClientView, LifecycleStage } from './portfolio-health';

const LIFECYCLE_STAGES: LifecycleStage[] = ['onboarding', 'active', 'expansion', 'at_risk', 'churned'];

function toLifecycleStage(stage: string): LifecycleStage {
    return (LIFECYCLE_STAGES as string[]).includes(stage) ? (stage as LifecycleStage) : 'active';
}

function toHealthTrend(trend: string): PortfolioClientView['health_trend'] {
    return trend === 'improving' || trend === 'declining' ? trend : 'stable';
}

function toAlertSeverity(severity: string | null): PortfolioClientView['alert_severity'] {
    return severity === 'P1' || severity === 'P2' || severity === 'P3' ? severity : undefined;
}

/**
 * Load every portfolio client, newest health first.
 * Returns [] rather than throwing when the portfolio has not been populated —
 * an empty portfolio is a legitimate state, not an error.
 */
export async function loadPortfolioClients(): Promise<PortfolioClientView[]> {
    const [portfolios, configs] = await Promise.all([
        prisma.clientPortfolio.findMany({ orderBy: { currentHealthScore: 'asc' } }),
        prisma.clientConfig.findMany({ select: { clientId: true, name: true, company: true } }),
    ]);

    const namesByClientId = new Map(
        configs.map(c => [c.clientId, c.company || c.name]),
    );

    return portfolios.map(p => ({
        client_id: p.clientId,
        client_name: namesByClientId.get(p.clientId),
        vertical: p.vertical,
        stage: toLifecycleStage(p.stage),
        retainer_usd: p.retainerUsd,
        current_health_score: p.currentHealthScore,
        previous_health_score: p.previousHealthScore,
        health_trend: toHealthTrend(p.healthTrend),
        expansion_ready: p.expansionReady,
        weekly_hours_estimate: p.weeklyHoursEstimate > 0 ? p.weeklyHoursEstimate : undefined,
        has_open_alert: p.hasOpenAlert,
        alert_severity: toAlertSeverity(p.alertSeverity),
    }));
}

/**
 * Persist detected patterns for a week, skipping ones already recorded.
 *
 * Pattern detection is deterministic for a given portfolio state, so re-running
 * it in the same week would otherwise pile up identical rows and make
 * `wasActedOn` tracking meaningless.
 */
export async function persistPatterns(
    patterns: Array<{
        pattern_type: string;
        severity: string;
        description: string;
        affected_client_ids: string[];
        verticals_affected: string[];
        week_of: string;
    }>,
): Promise<number> {
    if (patterns.length === 0) return 0;

    const weeks = [...new Set(patterns.map(p => p.week_of))];
    const existing = await prisma.portfolioPattern.findMany({
        where: { weekOf: { in: weeks } },
        select: { weekOf: true, patternType: true },
    });

    const seen = new Set(existing.map(e => `${e.weekOf}:${e.patternType}`));
    const fresh = patterns.filter(p => !seen.has(`${p.week_of}:${p.pattern_type}`));

    for (const pattern of fresh) {
        // Two patterns of the same type can appear in one detection pass (a 2/2
        // vertical split trips vertical_concentration twice at exactly 50%), so
        // the set has to grow as rows are written, not only from what preceded.
        const dedupeKey = `${pattern.week_of}:${pattern.pattern_type}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);

        await prisma.portfolioPattern.create({
            data: {
                weekOf: pattern.week_of,
                patternType: pattern.pattern_type,
                severity: pattern.severity,
                description: pattern.description,
                affectedClientIds: JSON.stringify(pattern.affected_client_ids),
                verticalsAffected: JSON.stringify(pattern.verticals_affected),
            },
        });
    }

    // Count rows actually written, not candidates.
    return fresh.filter(p => seen.has(`${p.week_of}:${p.pattern_type}`)).length;
}
