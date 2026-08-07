import Link from 'next/link';
import {
    AlertCircle,
    AlertTriangle,
    CheckCircle2,
    Database,
    Download,
    FileText,
    Info,
    ScanEye,
    ShieldCheck,
    TrendingDown,
    Workflow as WorkflowIcon,
    type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { count, currency, money, percent } from '@/lib/platform/format';
import type {
    ActivityEvent,
    ActivityKind,
    Approval,
    Deliverable,
    Partner,
    PlatformAgent,
    PlatformAlert,
    RevenueLeak,
    SavingsCategory,
    Tone,
    TrendPoint,
    WorkflowPerformance,
} from '@/lib/platform/types';
import { DonutChart, TrendChart } from './charts';
import {
    AgentStatusTag,
    Delta,
    HealthDot,
    LeakStatusPill,
    Panel,
    PanelBody,
    PanelFooter,
    PanelHeader,
    ScoreMeter,
    SeverityPill,
    Sparkline,
    TableShell,
    TD,
    TH,
    TONE_HEX,
    TR,
} from './ui';

/* -------------------------------------------------------------------------- */
/* AI agents                                                                   */
/* -------------------------------------------------------------------------- */

export function AgentsPanel({
    agents,
    limit = 6,
    className,
}: {
    agents: PlatformAgent[];
    limit?: number;
    className?: string;
}) {
    const activeCount = agents.filter((agent) => agent.status === 'active').length;

    return (
        <Panel className={className}>
            <PanelHeader
                title="AI Agents"
                action="View all agents"
                actionHref="/agents"
                badge={
                    <span className="inline-flex items-center gap-1.5 text-xs text-up-dim">
                        <span className="h-1.5 w-1.5 rounded-full bg-up-green" />
                        {activeCount} Active
                    </span>
                }
            />
            <PanelBody className="px-1">
                <TableShell>
                    <thead>
                        <tr>
                            <th className={TH}>Agent</th>
                            <th className={TH}>Status</th>
                            <th className={cn(TH, 'text-right')}>Tasks</th>
                            <th className={cn(TH, 'text-right')}>Appr.</th>
                            <th className={cn(TH, 'text-right')}>Perf.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {agents.slice(0, limit).map((agent) => (
                            <tr key={agent.id} className={TR}>
                                <td className={TD}>
                                    <Link href="/agents" className="block">
                                        <span className="block text-[12.5px] font-medium text-up-text">
                                            {agent.name}
                                        </span>
                                        <span className="block text-[10px] text-up-faint">
                                            {agent.description}
                                        </span>
                                    </Link>
                                </td>
                                <td className={TD}>
                                    <AgentStatusTag status={agent.status} />
                                </td>
                                <td className={cn(TD, 'up-num text-right')}>{count(agent.tasks)}</td>
                                <td className={cn(TD, 'up-num text-right')}>{agent.approvals}</td>
                                <td className={cn(TD, 'text-right')}>
                                    <div className="flex justify-end">
                                        <ScoreMeter
                                            value={agent.performance}
                                            tone={agent.performance >= 97 ? 'green' : 'gold'}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </TableShell>
            </PanelBody>
        </Panel>
    );
}

/* -------------------------------------------------------------------------- */
/* Revenue leaks                                                               */
/* -------------------------------------------------------------------------- */

export function LeaksPanel({
    leaks,
    limit = 5,
    className,
}: {
    leaks: RevenueLeak[];
    limit?: number;
    className?: string;
}) {
    return (
        <Panel className={className}>
            <PanelHeader title="Revenue Leaks Detected" action="View all leaks" actionHref="/revenue-leaks" />
            <PanelBody className="px-1">
                <TableShell fixed>
                    <colgroup>
                        <col className="w-[30%]" />
                        <col className="w-[12%]" />
                        <col className="w-[20%]" />
                        <col className="w-[16%]" />
                        <col className="w-[22%]" />
                    </colgroup>
                    <thead>
                        <tr>
                            <th className={TH}>Leak</th>
                            <th className={cn(TH, 'text-right')}>Impact</th>
                            <th className={TH}>Source</th>
                            <th className={TH}>Severity</th>
                            <th className={TH}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaks.slice(0, limit).map((leak) => (
                            <tr key={leak.id} className={TR}>
                                <td className={TD}>
                                    <Link
                                        href={`/revenue-leaks?leak=${leak.id}`}
                                        className="block truncate font-medium text-up-text hover:text-up-primary"
                                    >
                                        {leak.name}
                                    </Link>
                                </td>
                                <td className={cn(TD, 'up-num text-right font-medium')}>
                                    {money(leak.impact)}
                                </td>
                                <td className={TD}>
                                    <span className="block truncate text-up-dim">
                                        {leak.source}
                                    </span>
                                </td>
                                <td className={TD}>
                                    <SeverityPill severity={leak.severity} />
                                </td>
                                <td className={TD}>
                                    <LeakStatusPill status={leak.status} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </TableShell>
            </PanelBody>
        </Panel>
    );
}

/* -------------------------------------------------------------------------- */
/* Approval queue                                                              */
/* -------------------------------------------------------------------------- */

const URGENCY_DOT = {
    critical: 'bg-up-red',
    warning: 'bg-up-gold',
    normal: 'bg-up-green',
} as const;

export function ApprovalsPanel({
    approvals,
    limit = 5,
    className,
}: {
    approvals: Approval[];
    limit?: number;
    className?: string;
}) {
    return (
        <Panel className={className}>
            <PanelHeader
                title="Approval Queue"
                action="View all"
                actionHref="/approvals"
                badge={
                    <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-up-gold px-1.5 text-[10px] font-bold text-up-deep">
                        {approvals.length}
                    </span>
                }
            />
            <PanelBody className="space-y-1">
                {approvals.slice(0, limit).map((approval) => (
                    <Link
                        key={approval.id}
                        href="/approvals"
                        className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-up-raise/50"
                    >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-up-primary/12 text-up-primary">
                            <FileText className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12.5px] font-medium text-up-text">
                                {approval.title}
                            </span>
                            <span className="block truncate text-[11px] text-up-faint">
                                {approval.partner}
                            </span>
                        </span>
                        <span className="up-num shrink-0 text-[13px] font-semibold text-up-text">
                            {currency(approval.amount)}
                        </span>
                        <span className="flex w-11 shrink-0 items-center justify-end gap-1.5">
                            <span className="up-num text-[11px] text-up-faint">
                                {approval.waiting}
                            </span>
                            <span
                                className={cn(
                                    'h-1.5 w-1.5 rounded-full',
                                    URGENCY_DOT[approval.urgency]
                                )}
                            />
                        </span>
                    </Link>
                ))}
            </PanelBody>
        </Panel>
    );
}

/* -------------------------------------------------------------------------- */
/* Revenue & savings trend                                                     */
/* -------------------------------------------------------------------------- */

export function TrendPanel({
    trend,
    className,
    title = 'Revenue & Savings Trend',
}: {
    trend: TrendPoint[];
    className?: string;
    title?: string;
}) {
    return (
        <Panel className={className}>
            <PanelHeader title={title}>
                <div className="flex items-center gap-4">
                    <LegendDot color={TONE_HEX.primary} label="Revenue Protected" />
                    <LegendDot color={TONE_HEX.gold} label="Money Saved" />
                </div>
            </PanelHeader>
            <PanelBody>
                <TrendChart data={trend} />
            </PanelBody>
        </Panel>
    );
}

function LegendDot({ color, label }: { color: string; label: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 text-[11px] text-up-dim">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            {label}
        </span>
    );
}

/* -------------------------------------------------------------------------- */
/* Workflow performance                                                        */
/* -------------------------------------------------------------------------- */

export function WorkflowPerformancePanel({
    performance,
    className,
}: {
    performance: WorkflowPerformance;
    className?: string;
}) {
    const { totalRuns, completed, exceptions, inProgress } = performance;
    const rows: { label: string; value: number; tone: Tone }[] = [
        { label: 'Completed', value: completed, tone: 'primary' },
        { label: 'Exceptions', value: exceptions, tone: 'gold' },
        { label: 'In Progress', value: inProgress, tone: 'pink' },
    ];

    return (
        <Panel className={className}>
            <PanelHeader title="Workflow Performance" action="View all workflows" actionHref="/workflows" />
            <PanelBody className="flex flex-wrap items-center justify-center gap-6">
                <DonutChart
                    size={176}
                    thickness={24}
                    centerValue={count(totalRuns)}
                    centerLabel="Total Runs"
                    slices={rows.map((row) => ({
                        name: row.label,
                        value: row.value,
                        color: TONE_HEX[row.tone],
                    }))}
                />

                <ul className="min-w-[180px] flex-1 space-y-3">
                    {rows.map((row) => (
                        <li key={row.label} className="flex items-center gap-3 text-[13px]">
                            <span
                                className="h-2 w-2 shrink-0 rounded-full"
                                style={{ backgroundColor: TONE_HEX[row.tone] }}
                            />
                            <span className="text-up-dim">{row.label}</span>
                            <span className="up-num ml-auto font-semibold text-up-text">
                                {row.value}
                            </span>
                            <span className="up-num w-14 text-right text-up-faint">
                                {percent((row.value / totalRuns) * 100)}
                            </span>
                        </li>
                    ))}
                </ul>
            </PanelBody>
            <PanelFooter className="flex items-center justify-between gap-3">
                <span className="text-[13px] text-up-dim">Automation Success Rate</span>
                <span className="flex items-center gap-3">
                    <span className="up-num text-xl font-semibold text-up-text">
                        {percent(performance.automationSuccessRate)}
                    </span>
                    <Delta trend="up" value={performance.successDelta} label="vs last 7 days" />
                </span>
            </PanelFooter>
        </Panel>
    );
}

/* -------------------------------------------------------------------------- */
/* Partner overview                                                            */
/* -------------------------------------------------------------------------- */

export function PartnersPanel({
    partners,
    className,
}: {
    partners: Partner[];
    className?: string;
}) {
    return (
        <Panel className={className}>
            <PanelHeader title="Partner Overview" action="View all partners" actionHref="/partners" />
            <PanelBody className="px-1">
                <TableShell>
                    <thead>
                        <tr>
                            <th className={TH}>Partner</th>
                            <th className={cn(TH, 'text-center')}>Health</th>
                            <th className={cn(TH, 'text-right')}>Revenue Protected</th>
                            <th className={cn(TH, 'text-right')}>Trend (7D)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {partners.map((partner) => (
                            <tr key={partner.id} className={TR}>
                                <td className={TD}>
                                    <Link
                                        href={`/partners?partner=${partner.id}`}
                                        className="font-medium text-up-text hover:text-up-primary"
                                    >
                                        {partner.name}
                                    </Link>
                                </td>
                                <td className={cn(TD, 'text-center')}>
                                    <span className="inline-flex justify-center">
                                        <HealthDot health={partner.health} />
                                    </span>
                                </td>
                                <td className={cn(TD, 'up-num text-right font-medium')}>
                                    {money(partner.revenueProtected)}
                                </td>
                                <td className={cn(TD, 'text-right')}>
                                    <span className="inline-flex justify-end">
                                        <Sparkline series={partner.trend} tone={partner.tone} />
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </TableShell>
            </PanelBody>
        </Panel>
    );
}

/* -------------------------------------------------------------------------- */
/* Activity                                                                    */
/* -------------------------------------------------------------------------- */

const ACTIVITY_ICON: Record<ActivityKind, { icon: LucideIcon; tone: Tone }> = {
    leak: { icon: TrendingDown, tone: 'red' },
    workflow: { icon: WorkflowIcon, tone: 'green' },
    approval: { icon: ShieldCheck, tone: 'primary' },
    shadow: { icon: ScanEye, tone: 'pink' },
    data: { icon: Database, tone: 'blue' },
    report: { icon: FileText, tone: 'gold' },
};

export function ActivityPanel({
    activity,
    limit = 6,
    title = 'Operations Activity',
    className,
}: {
    activity: ActivityEvent[];
    limit?: number;
    title?: string;
    className?: string;
}) {
    return (
        <Panel className={className}>
            <PanelHeader title={title} action="View all activity" actionHref="/activity" />
            <PanelBody className="space-y-0.5">
                {activity.slice(0, limit).map((event) => {
                    const cfg = ACTIVITY_ICON[event.kind];
                    const Icon = cfg.icon;

                    return (
                        <div
                            key={event.id}
                            className="flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-up-raise/50"
                        >
                            <span
                                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                                style={{
                                    backgroundColor: `${TONE_HEX[cfg.tone]}1f`,
                                    color: TONE_HEX[cfg.tone],
                                }}
                            >
                                <Icon className="h-3.5 w-3.5" />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-[13px] text-up-text">
                                    {event.title}
                                </span>
                                <span className="block truncate text-[11px] text-up-faint">
                                    {event.context} · {event.meta}
                                </span>
                            </span>
                            <span className="up-num shrink-0 text-[11px] text-up-faint">
                                {event.at}
                            </span>
                        </div>
                    );
                })}
            </PanelBody>
        </Panel>
    );
}

/* -------------------------------------------------------------------------- */
/* Reports & deliverables                                                      */
/* -------------------------------------------------------------------------- */

const FORMAT_TONE: Record<Deliverable['format'], Tone> = {
    PDF: 'red',
    XLSX: 'green',
    PPTX: 'gold',
    CSV: 'blue',
};

export function DeliverablesPanel({
    deliverables,
    limit = 4,
    className,
}: {
    deliverables: Deliverable[];
    limit?: number;
    className?: string;
}) {
    return (
        <Panel className={className}>
            <PanelHeader title="Reports & Deliverables" action="View all reports" actionHref="/reports" />
            <PanelBody className="space-y-0.5">
                {deliverables.slice(0, limit).map((item) => {
                    const tone = FORMAT_TONE[item.format];

                    return (
                        <div
                            key={item.id}
                            className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-up-raise/50"
                        >
                            <span
                                className="flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded-lg text-[8px] font-bold"
                                style={{
                                    backgroundColor: `${TONE_HEX[tone]}1f`,
                                    color: TONE_HEX[tone],
                                }}
                            >
                                {item.format}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-[13px] text-up-text">
                                    {item.name}
                                </span>
                                <span className="block truncate text-[11px] text-up-faint">
                                    Generated {item.generatedOn} · {item.period}
                                </span>
                            </span>
                            <span className="up-num hidden shrink-0 text-[11px] text-up-faint sm:block">
                                {item.size}
                            </span>
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-up-line text-up-dim">
                                <Download className="h-3.5 w-3.5" />
                            </span>
                        </div>
                    );
                })}
            </PanelBody>
        </Panel>
    );
}

/* -------------------------------------------------------------------------- */
/* Alerts                                                                      */
/* -------------------------------------------------------------------------- */

const ALERT_STYLE: Record<PlatformAlert['level'], { icon: LucideIcon; tone: Tone }> = {
    critical: { icon: AlertTriangle, tone: 'red' },
    warning: { icon: AlertCircle, tone: 'gold' },
    info: { icon: Info, tone: 'blue' },
    success: { icon: CheckCircle2, tone: 'green' },
};

export function AlertsPanel({
    alerts,
    limit = 4,
    className,
}: {
    alerts: PlatformAlert[];
    limit?: number;
    className?: string;
}) {
    return (
        <Panel className={className}>
            <PanelHeader title="Alerts & Notifications" action="View all alerts" actionHref="/alerts" />
            <PanelBody className="space-y-0.5">
                {alerts.slice(0, limit).map((alert) => {
                    const cfg = ALERT_STYLE[alert.level];
                    const Icon = cfg.icon;

                    return (
                        <div
                            key={alert.id}
                            className="flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-up-raise/50"
                        >
                            <Icon
                                className="mt-0.5 h-4 w-4 shrink-0"
                                style={{ color: TONE_HEX[cfg.tone] }}
                            />
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-[13px] text-up-text">
                                    {alert.title}
                                </span>
                                <span className="block truncate text-[11px] text-up-faint">
                                    {alert.context}
                                </span>
                            </span>
                            <span className="up-num shrink-0 text-[11px] text-up-faint">
                                {alert.at}
                            </span>
                        </div>
                    );
                })}
            </PanelBody>
        </Panel>
    );
}

/* -------------------------------------------------------------------------- */
/* Savings breakdown                                                           */
/* -------------------------------------------------------------------------- */

export function SavingsBreakdownPanel({
    categories,
    total,
    className,
}: {
    categories: SavingsCategory[];
    total: string;
    className?: string;
}) {
    return (
        <Panel className={className}>
            <PanelHeader title="Results Breakdown" action="View full report" actionHref="/roi" />
            <PanelBody className="flex flex-wrap items-center justify-center gap-6">
                <DonutChart
                    size={176}
                    thickness={24}
                    centerValue={total}
                    centerLabel="Total Savings"
                    valueFormat="money"
                    slices={categories.map((category) => ({
                        name: category.label,
                        value: category.value,
                        color: TONE_HEX[category.tone],
                    }))}
                />

                <ul className="min-w-[240px] flex-1 space-y-3">
                    {categories.map((category) => (
                        <li key={category.label} className="flex items-center gap-3 text-[13px]">
                            <span
                                className="h-2 w-2 shrink-0 rounded-full"
                                style={{ backgroundColor: TONE_HEX[category.tone] }}
                            />
                            <span className="truncate text-up-dim">{category.label}</span>
                            <span className="up-num ml-auto font-semibold text-up-text">
                                {money(category.value)}
                            </span>
                            <span className="up-num w-14 text-right text-up-faint">
                                {percent(category.share)}
                            </span>
                        </li>
                    ))}
                </ul>
            </PanelBody>
        </Panel>
    );
}
