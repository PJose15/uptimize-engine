/**
 * Scoping for the command center.
 *
 * The topbar's partner picker and search box write `?partner=` and `?q=` onto
 * the URL; every platform page runs its snapshot through `scopeData()` so the
 * whole surface — KPIs included — reflects the current scope on the server.
 */

import { getCommandCenterData } from './data';
import type { CommandCenterData, Kpi, Partner } from './types';

export interface Scope {
    /** Partner id, e.g. "southrex". Unknown ids are ignored. */
    partner?: string;
    /** Free-text query matched against the visible fields of each list. */
    query?: string;
}

/** Split a dollar amount into a KPI headline and its unit suffix. */
function kpiMoney(value: number): { value: string; unit?: string } {
    if (Math.abs(value) >= 1_000_000) {
        return { value: `$${(value / 1_000_000).toFixed(2)}`, unit: 'M' };
    }
    if (Math.abs(value) >= 1_000) {
        return { value: `$${Math.round(value / 1_000)}`, unit: 'K' };
    }
    return { value: `$${value}` };
}

function setKpi(kpis: Kpi[], id: string, patch: Partial<Kpi>): Kpi[] {
    return kpis.map((kpi) => (kpi.id === id ? { ...kpi, ...patch } : kpi));
}

/** Round to one decimal, dropping a trailing ".0". */
function trim(value: number): string {
    const rounded = Math.round(value * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/* -------------------------------------------------------------------------- */
/* Partner scope                                                               */
/* -------------------------------------------------------------------------- */

function scopeToPartner(data: CommandCenterData, partner: Partner): CommandCenterData {
    const totalProtected = data.partners.reduce((sum, p) => sum + p.revenueProtected, 0);
    const totalSaved = data.partners.reduce((sum, p) => sum + p.moneySaved, 0);

    // Portfolio-wide figures are apportioned by the partner's share of the book.
    // With no money figures (live data has no source for them) the share is 1 so
    // apportioned values simply pass through instead of collapsing to zero.
    const protectedShare = totalProtected > 0 ? partner.revenueProtected / totalProtected : 1;
    const savedShare = totalSaved > 0 ? partner.moneySaved / totalSaved : 1;

    const leaks = data.leaks.filter((leak) => leak.partner === partner.name);
    const approvals = data.approvals.filter((approval) => approval.partner === partner.name);
    const workflows = data.workflows.filter((workflow) => workflow.partner === partner.name);
    const shadowOps = data.shadowOps.filter((op) => op.partner === partner.name);
    const activity = data.activity.filter((event) => event.context === partner.name);
    const alerts = data.alerts.filter((alert) => alert.context.includes(partner.name));

    const hours = Number(data.kpis.find((kpi) => kpi.id === 'hours-reclaimed')?.value ?? 0);
    const runsShare = (value: number) => Math.max(1, Math.round(value * protectedShare));

    let kpis = data.kpis;
    kpis = setKpi(kpis, 'revenue-protected', kpiMoney(partner.revenueProtected));
    kpis = setKpi(kpis, 'money-saved', kpiMoney(partner.moneySaved));
    kpis = setKpi(kpis, 'hours-reclaimed', { value: trim(hours * protectedShare) });
    kpis = setKpi(kpis, 'agents-active', {
        value: String(partner.agents),
        of: `/ ${data.agents.length}`,
    });
    kpis = setKpi(kpis, 'workflows-running', {
        value: String(workflows.filter((workflow) => workflow.status === 'running').length),
    });

    const performance = data.workflowPerformance;

    return {
        ...data,
        kpis,
        leaks,
        approvals,
        workflows,
        shadowOps,
        activity,
        alerts,
        partners: [partner],
        trend: data.trend.map((point) => ({
            date: point.date,
            revenueProtected: Number((point.revenueProtected * protectedShare).toFixed(3)),
            moneySaved: Number((point.moneySaved * savedShare).toFixed(3)),
        })),
        savingsBreakdown: data.savingsBreakdown.map((category) => ({
            ...category,
            value: Math.round(category.value * savedShare),
        })),
        workflowPerformance: {
            ...performance,
            totalRuns: runsShare(performance.totalRuns),
            completed: runsShare(performance.completed),
            exceptions: runsShare(performance.exceptions),
            inProgress: runsShare(performance.inProgress),
        },
        roi: {
            ...data.roi,
            investment: Math.round(data.roi.investment * savedShare),
            returned: partner.moneySaved,
            hoursReclaimed: Number(trim(data.roi.hoursReclaimed * protectedShare)),
        },
        executiveSummary:
            `${partner.name} protected $${(partner.revenueProtected / 1000).toFixed(0)}K in revenue and ` +
            `returned $${(partner.moneySaved / 1000).toFixed(0)}K in savings this period across ` +
            `${partner.workflows} workflows and ${partner.agents} agents. ` +
            `${leaks.length} revenue leak${leaks.length === 1 ? '' : 's'} were detected and ` +
            `${leaks.filter((leak) => leak.status === 'resolved').length} closed. ` +
            `Account health is ${partner.health.replace('_', ' ')}.`,
    };
}

/* -------------------------------------------------------------------------- */
/* Query scope                                                                 */
/* -------------------------------------------------------------------------- */

function matches(query: string, ...fields: (string | undefined)[]): boolean {
    return fields.some((field) => field?.toLowerCase().includes(query));
}

function filterByQuery(data: CommandCenterData, rawQuery: string): CommandCenterData {
    const query = rawQuery.trim().toLowerCase();
    if (!query) return data;

    return {
        ...data,
        agents: data.agents.filter((agent) => matches(query, agent.name, agent.description)),
        leaks: data.leaks.filter((leak) =>
            matches(query, leak.name, leak.source, leak.partner, leak.id, leak.severity, leak.status)
        ),
        approvals: data.approvals.filter((approval) =>
            matches(query, approval.title, approval.partner, approval.id)
        ),
        partners: data.partners.filter((partner) => matches(query, partner.name, partner.health)),
        workflows: data.workflows.filter((workflow) =>
            matches(query, workflow.name, workflow.partner, workflow.trigger, workflow.status)
        ),
        shadowOps: data.shadowOps.filter((op) =>
            matches(query, op.name, op.partner, op.system, op.status)
        ),
        activity: data.activity.filter((event) =>
            matches(query, event.title, event.context, event.meta)
        ),
        alerts: data.alerts.filter((alert) => matches(query, alert.title, alert.context)),
        deliverables: data.deliverables.filter((item) =>
            matches(query, item.name, item.period, item.format)
        ),
    };
}

/* -------------------------------------------------------------------------- */
/* Entry points                                                                */
/* -------------------------------------------------------------------------- */

export function scopeData(data: CommandCenterData, scope: Scope): CommandCenterData {
    const partner = scope.partner
        ? data.partners.find((candidate) => candidate.id === scope.partner)
        : undefined;

    const scoped = partner ? scopeToPartner(data, partner) : data;
    return scope.query ? filterByQuery(scoped, scope.query) : scoped;
}

/** Search params a platform page receives. */
export interface PlatformSearchParams {
    partner?: string;
    q?: string;
    leak?: string;
}

/** Human-readable label for the active scope, for page subtitles. */
export function scopeLabel(params: PlatformSearchParams): string | null {
    const parts: string[] = [];
    const partner = params.partner
        ? getCommandCenterData().partners.find((candidate) => candidate.id === params.partner)
        : undefined;

    if (partner) parts.push(partner.name);
    if (params.q?.trim()) parts.push(`“${params.q.trim()}”`);
    return parts.length ? parts.join(' · ') : null;
}

/** Display name for a partner id, or undefined when unknown. */
export function partnerName(id?: string): string | undefined {
    if (!id) return undefined;
    return getCommandCenterData().partners.find((partner) => partner.id === id)?.name;
}
