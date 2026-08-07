/**
 * Live command-center sections, built from records the database actually holds.
 *
 * Everything here is a pure function over plain rows so it can be tested without
 * a database; `source.ts` does the Prisma reads and hands the rows over.
 *
 * Sections that have a real source today: agents (SubAgentRun), activity
 * (ActivityEvent), approvals (ApprovalItem), workflows and their performance
 * (PipelineSession), partners (ClientConfig + ClientPortfolio), and the four
 * KPIs those can support. Revenue leaks, shadow ops, savings breakdown, ROI,
 * the trend series, deliverables and alerts have NO source in the schema — they
 * stay on the configured snapshot and are reported as `demo` so the UI can say so.
 */

import type {
    ActivityEvent,
    ActivityKind,
    Approval,
    CommandCenterData,
    Health,
    Kpi,
    Partner,
    PlatformAgent,
    Severity,
    Tone,
    Workflow,
    WorkflowPerformance,
} from './types';

/* -------------------------------------------------------------------------- */
/* Row shapes (structural subsets of the Prisma models)                        */
/* -------------------------------------------------------------------------- */

export interface ClientConfigRow {
    clientId: string;
    company: string;
    name: string;
}

export interface PortfolioRow {
    clientId: string;
    stage: string;
    currentHealthScore: number;
    healthTrend: string;
    healthScoreHistory: string;
    startDate: Date;
}

export interface SubAgentRunRow {
    parentAgentId: string;
    clientId: string;
    taskCompleted: boolean;
    escalationNeeded: boolean;
    escalationSeverity: string | null;
    createdAt: Date;
}

export interface ActivityEventRow {
    id: string;
    action: string;
    description: string;
    status: string;
    pillar: string;
    toolUsed: string | null;
    costUsd: number;
    durationMs: number;
    timestamp: Date;
    clientId: string;
}

export interface ApprovalItemRow {
    id: string;
    action: string;
    description: string;
    riskLevel: string;
    affectedSystem: string;
    status: string;
    timestamp: Date;
    clientId: string;
}

export interface PipelineSessionRow {
    id: string;
    clientId: string;
    label: string;
    status: string;
    currentStage: string;
    totalDurationMs: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface PortalStatsRow {
    clientId: string;
    hoursSavedWeek: number;
    successRate: number;
    healthScore: number;
}

export interface LiveRows {
    clients: ClientConfigRow[];
    portfolios: PortfolioRow[];
    subAgentRuns: SubAgentRunRow[];
    events: ActivityEventRow[];
    approvals: ApprovalItemRow[];
    sessions: PipelineSessionRow[];
    stats: PortalStatsRow[];
}

/** Which parts of the payload came from the database this request. */
export type SectionSource = 'live' | 'demo';
export type SectionName =
    | 'kpis'
    | 'agents'
    | 'leaks'
    | 'approvals'
    | 'partners'
    | 'activity'
    | 'deliverables'
    | 'alerts'
    | 'shadowOps'
    | 'workflows'
    | 'trend'
    | 'savingsBreakdown'
    | 'roi';

export type SectionSources = Record<SectionName, SectionSource>;

export const ALL_DEMO: SectionSources = {
    kpis: 'demo',
    agents: 'demo',
    leaks: 'demo',
    approvals: 'demo',
    partners: 'demo',
    activity: 'demo',
    deliverables: 'demo',
    alerts: 'demo',
    shadowOps: 'demo',
    workflows: 'demo',
    trend: 'demo',
    savingsBreakdown: 'demo',
    roi: 'demo',
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** "12m ago" / "3h ago" / "2d ago" */
export function relativeTime(from: Date, now: Date): string {
    const delta = Math.max(0, now.getTime() - from.getTime());
    if (delta < HOUR) return `${Math.max(1, Math.round(delta / 60000))}m ago`;
    if (delta < DAY) return `${Math.round(delta / HOUR)}h ago`;
    return `${Math.round(delta / DAY)}d ago`;
}

/** "45m" / "2h" — the waiting column on the approval queue. */
export function waitingFor(from: Date, now: Date): string {
    const delta = Math.max(0, now.getTime() - from.getTime());
    if (delta < HOUR) return `${Math.max(1, Math.round(delta / 60000))}m`;
    if (delta < DAY) return `${Math.round(delta / HOUR)}h`;
    return `${Math.round(delta / DAY)}d`;
}

/** "agent-1-market-intelligence" → "Market Intelligence" */
export function agentDisplayName(parentAgentId: string): string {
    return parentAgentId
        .replace(/^agent-\d+-/, '')
        .split(/[-_]/)
        .filter(Boolean)
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(' ');
}

/** Normalizes snake_case, kebab-case and SCREAMING_SNAKE alike. */
function titleCase(value: string): string {
    return value
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

function healthFromScore(score: number, stage: string): Health {
    if (stage === 'churned') return 'down';
    if (stage === 'at_risk' || score < 60) return 'at_risk';
    if (score < 80) return 'watch';
    return 'healthy';
}

/** Parse ClientPortfolio.healthScoreHistory, which is stored as a JSON string. */
export function parseHealthHistory(raw: string): number[] {
    try {
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .map((entry) =>
                typeof entry === 'number'
                    ? entry
                    : typeof (entry as { score?: unknown })?.score === 'number'
                        ? ((entry as { score: number }).score)
                        : NaN
            )
            .filter((score) => Number.isFinite(score));
    } catch {
        return [];
    }
}

const PILLAR_KIND: Record<string, ActivityKind> = {
    approvals: 'approval',
    approval: 'approval',
    data: 'data',
    reporting: 'report',
    reports: 'report',
    workflow: 'workflow',
    automation: 'workflow',
    leaks: 'leak',
    revenue: 'leak',
};

/* -------------------------------------------------------------------------- */
/* Section builders                                                            */
/* -------------------------------------------------------------------------- */

export function buildAgents(runs: SubAgentRunRow[], now: Date): PlatformAgent[] {
    const byAgent = new Map<string, SubAgentRunRow[]>();
    for (const run of runs) {
        const list = byAgent.get(run.parentAgentId);
        if (list) list.push(run);
        else byAgent.set(run.parentAgentId, [run]);
    }

    return [...byAgent.entries()]
        .map(([parentAgentId, agentRuns]) => {
            const dayAgo = now.getTime() - DAY;
            const recent = agentRuns.filter((run) => run.createdAt.getTime() >= dayAgo);
            const completed = agentRuns.filter((run) => run.taskCompleted).length;
            const escalations = agentRuns.filter((run) => run.escalationNeeded);
            const performance = agentRuns.length ? (completed / agentRuns.length) * 100 : 0;
            const lastRun = agentRuns.reduce(
                (latest, run) => (run.createdAt > latest ? run.createdAt : latest),
                agentRuns[0].createdAt
            );

            // Daily run counts over the trailing week make the sparkline.
            const trend = Array.from({ length: 7 }, (_, index) => {
                const start = now.getTime() - (6 - index) * DAY;
                return agentRuns.filter(
                    (run) =>
                        run.createdAt.getTime() >= start && run.createdAt.getTime() < start + DAY
                ).length;
            });

            const p1 = escalations.some((run) => run.escalationSeverity === 'P1');
            const impact: Severity = p1 ? 'high' : escalations.length ? 'medium' : 'low';

            return {
                id: parentAgentId,
                name: agentDisplayName(parentAgentId),
                description: `${agentRuns.length} runs · last ${relativeTime(lastRun, now)}`,
                status: (now.getTime() - lastRun.getTime() < DAY ? 'active' : 'idle') as
                    | 'active'
                    | 'idle',
                tasks: recent.length,
                approvals: escalations.length,
                performance: Number(performance.toFixed(1)),
                leaksDetected: 0,
                leaksClosed: 0,
                trend,
                impact,
            } satisfies PlatformAgent;
        })
        .sort((a, b) => b.tasks - a.tasks);
}

export function buildActivity(
    events: ActivityEventRow[],
    companyByClient: Map<string, string>,
    now: Date
): ActivityEvent[] {
    return events.map((event) => {
        const parts = [event.description];
        if (event.toolUsed) parts.push(event.toolUsed);
        if (event.durationMs) parts.push(`${(event.durationMs / 1000).toFixed(1)}s`);

        return {
            id: event.id,
            kind: PILLAR_KIND[event.pillar.toLowerCase()] ?? 'workflow',
            title: titleCase(event.action),
            context: companyByClient.get(event.clientId) ?? event.clientId,
            meta: parts.filter(Boolean).join(' · '),
            at: relativeTime(event.timestamp, now),
        } satisfies ActivityEvent;
    });
}

export function buildApprovals(
    rows: ApprovalItemRow[],
    companyByClient: Map<string, string>,
    now: Date
): Approval[] {
    return rows
        .filter((row) => row.status === 'pending')
        .map((row) => ({
            id: row.id,
            title: titleCase(row.action),
            partner: companyByClient.get(row.clientId) ?? row.clientId,
            // ApprovalItem carries no monetary value; the UI renders a dash.
            amount: 0,
            waiting: waitingFor(row.timestamp, now),
            urgency:
                row.riskLevel === 'high'
                    ? 'critical'
                    : row.riskLevel === 'medium'
                        ? 'warning'
                        : 'normal',
        }));
}

const SESSION_STATUS: Record<string, Workflow['status']> = {
    ACTIVE: 'running',
    PAUSED: 'paused',
    BLOCKED: 'paused',
    COMPLETE: 'scheduled',
    ABANDONED: 'draft',
};

export function buildWorkflows(
    sessions: PipelineSessionRow[],
    companyByClient: Map<string, string>,
    now: Date
): Workflow[] {
    return sessions.map((session) => ({
        id: session.id,
        name: session.label,
        partner: companyByClient.get(session.clientId) ?? session.clientId,
        trigger: titleCase(session.currentStage),
        runs: 1,
        successRate: session.status === 'COMPLETE' ? 100 : session.status === 'ABANDONED' ? 0 : 50,
        avgDurationSec: Number((session.totalDurationMs / 1000).toFixed(1)),
        status: SESSION_STATUS[session.status] ?? 'draft',
        lastRun: relativeTime(session.updatedAt, now),
        hoursSaved: 0,
    }));
}

export function buildWorkflowPerformance(
    sessions: PipelineSessionRow[],
    fallback: WorkflowPerformance
): WorkflowPerformance {
    const totalRuns = sessions.length;
    if (!totalRuns) return fallback;

    const completed = sessions.filter((session) => session.status === 'COMPLETE').length;
    const exceptions = sessions.filter(
        (session) => session.status === 'BLOCKED' || session.status === 'ABANDONED'
    ).length;
    const inProgress = totalRuns - completed - exceptions;

    return {
        totalRuns,
        completed,
        exceptions,
        inProgress,
        automationSuccessRate: Number(((completed / totalRuns) * 100).toFixed(1)),
        successDelta: fallback.successDelta,
    };
}

const PARTNER_TONES: Tone[] = ['primary', 'gold', 'pink', 'blue', 'green', 'red'];

export function buildPartners(
    clients: ClientConfigRow[],
    portfolios: PortfolioRow[],
    runs: SubAgentRunRow[],
    sessions: PipelineSessionRow[]
): Partner[] {
    const portfolioByClient = new Map(portfolios.map((row) => [row.clientId, row]));

    return clients.map((client, index) => {
        const portfolio = portfolioByClient.get(client.clientId);
        const history = portfolio ? parseHealthHistory(portfolio.healthScoreHistory) : [];
        const score = portfolio?.currentHealthScore ?? 0;

        return {
            id: client.clientId,
            name: client.company || client.clientId,
            health: healthFromScore(score, portfolio?.stage ?? 'active'),
            // No revenue or savings figures exist in the schema yet — the UI
            // renders a dash rather than inventing a number.
            revenueProtected: 0,
            moneySaved: 0,
            leaksDetected: 0,
            leaksClosed: 0,
            agents: new Set(
                runs.filter((run) => run.clientId === client.clientId).map((r) => r.parentAgentId)
            ).size,
            workflows: sessions.filter((session) => session.clientId === client.clientId).length,
            trend: history.length > 1 ? history.slice(-7) : [score, score],
            tone: PARTNER_TONES[index % PARTNER_TONES.length],
            since: portfolio
                ? portfolio.startDate.toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                })
                : '—',
        } satisfies Partner;
    });
}

export function buildKpis(
    fallback: Kpi[],
    input: {
        stats: PortalStatsRow[];
        agents: PlatformAgent[];
        sessions: PipelineSessionRow[];
    }
): Kpi[] {
    const hours = input.stats.reduce((sum, row) => sum + row.hoursSavedWeek, 0);
    const health = input.stats.length
        ? input.stats.reduce((sum, row) => sum + row.successRate, 0) / input.stats.length
        : null;
    const running = input.sessions.filter((session) => session.status === 'ACTIVE').length;
    const active = input.agents.filter((agent) => agent.status === 'active').length;

    return fallback.map((kpi) => {
        switch (kpi.id) {
            case 'hours-reclaimed':
                return { ...kpi, value: hours.toFixed(1) };
            case 'agents-active':
                return { ...kpi, value: String(active), of: `/ ${input.agents.length}` };
            case 'workflows-running':
                return { ...kpi, value: String(running) };
            case 'system-health':
                return health === null
                    ? kpi
                    : {
                        ...kpi,
                        value: health.toFixed(1),
                        note: health >= 95 ? 'Excellent' : health >= 85 ? 'Healthy' : 'Degraded',
                    };
            default:
                // Revenue protected and money saved have no source yet.
                return kpi;
        }
    });
}

/* -------------------------------------------------------------------------- */
/* Merge                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Overlay whatever the database knows onto the configured snapshot, and report
 * which sections ended up live. A section with no rows stays on the snapshot.
 */
export function buildLiveSections(
    snapshot: CommandCenterData,
    rows: LiveRows,
    now: Date
): { data: CommandCenterData; sources: SectionSources } {
    const companyByClient = new Map(
        rows.clients.map((client) => [client.clientId, client.company || client.clientId])
    );

    const sources: SectionSources = { ...ALL_DEMO };
    const data: CommandCenterData = { ...snapshot };

    const agents = rows.subAgentRuns.length ? buildAgents(rows.subAgentRuns, now) : [];
    if (agents.length) {
        data.agents = agents;
        sources.agents = 'live';
    }

    if (rows.events.length) {
        data.activity = buildActivity(rows.events, companyByClient, now);
        sources.activity = 'live';
    }

    const approvals = buildApprovals(rows.approvals, companyByClient, now);
    if (rows.approvals.length) {
        data.approvals = approvals;
        sources.approvals = 'live';
    }

    if (rows.sessions.length) {
        data.workflows = buildWorkflows(rows.sessions, companyByClient, now);
        data.workflowPerformance = buildWorkflowPerformance(
            rows.sessions,
            snapshot.workflowPerformance
        );
        sources.workflows = 'live';
    }

    if (rows.clients.length) {
        data.partners = buildPartners(
            rows.clients,
            rows.portfolios,
            rows.subAgentRuns,
            rows.sessions
        );
        sources.partners = 'live';
    }

    if (rows.stats.length || agents.length || rows.sessions.length) {
        data.kpis = buildKpis(snapshot.kpis, {
            stats: rows.stats,
            agents: data.agents,
            sessions: rows.sessions,
        });
        sources.kpis = 'live';
    }

    return { data, sources };
}
