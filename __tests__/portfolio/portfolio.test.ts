// @vitest-environment node
/**
 * Portfolio analysis and the repository that feeds it.
 *
 * The pure functions shipped in Sprint 14 with no callers and no tests; these
 * cover the behaviours the dashboard now depends on, plus the DB → view
 * mapping that stands between them and real data.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const portfolioRows: Array<Record<string, unknown>> = [];
const configRows: Array<Record<string, unknown>> = [];
const patternRows: Array<Record<string, unknown>> = [];

vi.mock('@/lib/prisma', () => ({
    prisma: {
        clientPortfolio: {
            findMany: vi.fn(async () => portfolioRows),
        },
        clientConfig: {
            findMany: vi.fn(async () => configRows),
        },
        portfolioPattern: {
            findMany: vi.fn(async ({ where }: { where?: { weekOf?: { in: string[] } } }) =>
                where?.weekOf
                    ? patternRows.filter(p => where.weekOf!.in.includes(p.weekOf as string))
                    : patternRows,
            ),
            create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
                patternRows.push(data);
                return data;
            }),
        },
    },
}));

import {
    calculatePortfolioHealthScore,
    calculateWeeklyLoad,
    detectPortfolioPatterns,
    loadPortfolioClients,
    persistPatterns,
    WEEKLY_CAPACITY_HOURS,
    type PortfolioClientView,
} from '@/lib/portfolio';

function client(overrides: Partial<PortfolioClientView> = {}): PortfolioClientView {
    return {
        client_id: 'c1',
        vertical: 'fitness',
        stage: 'active',
        retainer_usd: 1000,
        current_health_score: 80,
        expansion_ready: false,
        ...overrides,
    };
}

beforeEach(() => {
    portfolioRows.length = 0;
    configRows.length = 0;
    patternRows.length = 0;
    vi.clearAllMocks();
});

describe('portfolio health', () => {
    it('weights by retainer, so a large unhealthy client outweighs a small healthy one', () => {
        const health = calculatePortfolioHealthScore([
            client({ client_id: 'big', retainer_usd: 9000, current_health_score: 40 }),
            client({ client_id: 'small', retainer_usd: 1000, current_health_score: 100 }),
        ]);

        expect(health.weighted_score_0_100).toBe(46);
        // The simple average would read 70 and hide the problem entirely.
        expect(health.simple_avg_score_0_100).toBe(70);
    });

    it('falls back to a simple average when no retainers are set', () => {
        const health = calculatePortfolioHealthScore([
            client({ client_id: 'a', retainer_usd: 0, current_health_score: 60 }),
            client({ client_id: 'b', retainer_usd: 0, current_health_score: 80 }),
        ]);

        expect(health.weighted_score_0_100).toBe(70);
    });

    it('excludes churned clients from every figure', () => {
        const health = calculatePortfolioHealthScore([
            client({ client_id: 'a', current_health_score: 90 }),
            client({ client_id: 'gone', stage: 'churned', retainer_usd: 5000, current_health_score: 10 }),
        ]);

        expect(health.total_active_clients).toBe(1);
        expect(health.total_mrr_usd).toBe(1000);
        expect(health.weighted_score_0_100).toBe(90);
    });

    it('counts a low score and an at_risk stage as the same risk, without double counting', () => {
        const health = calculatePortfolioHealthScore([
            client({ client_id: 'a', current_health_score: 50, stage: 'at_risk' }),
        ]);

        expect(health.at_risk_count).toBe(1);
    });

    it('returns zeros for an empty portfolio rather than dividing by zero', () => {
        const health = calculatePortfolioHealthScore([]);
        expect(health.weighted_score_0_100).toBe(0);
        expect(health.total_active_clients).toBe(0);
    });
});

describe('capacity', () => {
    it('uses per-stage defaults when no estimate is recorded', () => {
        const load = calculateWeeklyLoad([
            client({ client_id: 'a', stage: 'onboarding' }),   // 8
            client({ client_id: 'b', stage: 'active' }),        // 4
        ]);

        expect(load.total_hours_committed).toBe(12);
        expect(load.is_overloaded).toBe(false);
    });

    it('prefers an explicit estimate over the stage default', () => {
        const load = calculateWeeklyLoad([
            client({ client_id: 'a', stage: 'active', weekly_hours_estimate: 12 }),
        ]);

        expect(load.total_hours_committed).toBe(12);
    });

    it('reports overload against the 33.5h cap', () => {
        const load = calculateWeeklyLoad([
            client({ client_id: 'a', stage: 'onboarding' }),
            client({ client_id: 'b', stage: 'onboarding' }),
            client({ client_id: 'c', stage: 'onboarding' }),
            client({ client_id: 'd', stage: 'onboarding' }),
            client({ client_id: 'e', stage: 'at_risk' }),
        ]);

        expect(load.total_hours_committed).toBe(40);
        expect(load.capacity_hours).toBe(WEEKLY_CAPACITY_HOURS);
        expect(load.is_overloaded).toBe(true);
        expect(load.over_capacity_hours).toBeCloseTo(6.5);
    });

    it('does not bill hours for churned clients', () => {
        const load = calculateWeeklyLoad([client({ client_id: 'gone', stage: 'churned' })]);
        expect(load.total_hours_committed).toBe(0);
        expect(load.per_client).toHaveLength(0);
    });
});

describe('pattern detection', () => {
    it('flags a churn risk cluster once three clients are at risk', () => {
        const clients = ['a', 'b', 'c'].map(id =>
            client({ client_id: id, current_health_score: 40 }),
        );

        const types = detectPortfolioPatterns(clients, '2026-W19').map(p => p.pattern_type);
        expect(types).toContain('churn_risk_cluster');
    });

    it('stays quiet below the cluster threshold', () => {
        const clients = ['a', 'b'].map(id => client({ client_id: id, current_health_score: 40 }));

        const types = detectPortfolioPatterns(clients, '2026-W19').map(p => p.pattern_type);
        expect(types).not.toContain('churn_risk_cluster');
    });

    it('stamps the week it was given', () => {
        const patterns = detectPortfolioPatterns(
            ['a', 'b', 'c'].map(id => client({ client_id: id, expansion_ready: true })),
            '2026-W19',
        );

        expect(patterns.length).toBeGreaterThan(0);
        for (const pattern of patterns) expect(pattern.week_of).toBe('2026-W19');
    });

    it('returns nothing for an empty portfolio', () => {
        expect(detectPortfolioPatterns([], '2026-W19')).toEqual([]);
    });
});

describe('repository', () => {
    it('joins client names from ClientConfig', async () => {
        portfolioRows.push({
            clientId: 'client_001', stage: 'active', vertical: 'fitness', retainerUsd: 2500,
            currentHealthScore: 82, previousHealthScore: 78, healthTrend: 'improving',
            expansionReady: true, weeklyHoursEstimate: 0, hasOpenAlert: false, alertSeverity: null,
        });
        configRows.push({ clientId: 'client_001', name: 'Jane', company: 'Acme Fitness' });

        const [view] = await loadPortfolioClients();

        expect(view.client_name).toBe('Acme Fitness');
        expect(view.stage).toBe('active');
        expect(view.expansion_ready).toBe(true);
    });

    it('leaves the name undefined when there is no matching config', async () => {
        portfolioRows.push({
            clientId: 'orphan', stage: 'active', vertical: '', retainerUsd: 0,
            currentHealthScore: 0, previousHealthScore: 0, healthTrend: 'stable',
            expansionReady: false, weeklyHoursEstimate: 0, hasOpenAlert: false, alertSeverity: null,
        });

        const [view] = await loadPortfolioClients();
        expect(view.client_name).toBeUndefined();
    });

    it('coerces an unrecognised stage rather than passing it through', async () => {
        portfolioRows.push({
            clientId: 'c', stage: 'not_a_stage', vertical: '', retainerUsd: 0,
            currentHealthScore: 0, previousHealthScore: 0, healthTrend: 'sideways',
            expansionReady: false, weeklyHoursEstimate: 0, hasOpenAlert: false, alertSeverity: 'P9',
        });

        const [view] = await loadPortfolioClients();

        // The stage drives capacity lookup; an unknown value would produce
        // NaN hours rather than a visible error.
        expect(view.stage).toBe('active');
        expect(view.health_trend).toBe('stable');
        expect(view.alert_severity).toBeUndefined();
    });

    it('treats a zero hours estimate as absent so the stage default applies', async () => {
        portfolioRows.push({
            clientId: 'c', stage: 'onboarding', vertical: '', retainerUsd: 0,
            currentHealthScore: 0, previousHealthScore: 0, healthTrend: 'stable',
            expansionReady: false, weeklyHoursEstimate: 0, hasOpenAlert: false, alertSeverity: null,
        });

        const clients = await loadPortfolioClients();
        expect(clients[0].weekly_hours_estimate).toBeUndefined();
        expect(calculateWeeklyLoad(clients).total_hours_committed).toBe(8);
    });
});

describe('pattern persistence', () => {
    const pattern = {
        pattern_type: 'churn_risk_cluster',
        severity: 'critical',
        description: '3 clients at risk',
        affected_client_ids: ['a', 'b', 'c'],
        verticals_affected: ['fitness'],
        week_of: '2026-W19',
    };

    it('records new patterns', async () => {
        expect(await persistPatterns([pattern])).toBe(1);
        expect(patternRows).toHaveLength(1);
    });

    it('does not duplicate a pattern already recorded for that week', async () => {
        await persistPatterns([pattern]);
        // Detection is deterministic over current state, so every dashboard
        // load would otherwise add another identical row.
        expect(await persistPatterns([pattern])).toBe(0);
        expect(patternRows).toHaveLength(1);
    });

    it('records the same pattern type again in a different week', async () => {
        await persistPatterns([pattern]);
        expect(await persistPatterns([{ ...pattern, week_of: '2026-W20' }])).toBe(1);
        expect(patternRows).toHaveLength(2);
    });

    it('handles an empty list without touching the database', async () => {
        expect(await persistPatterns([])).toBe(0);
        expect(patternRows).toHaveLength(0);
    });
});
