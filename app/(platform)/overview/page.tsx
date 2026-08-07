import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { KpiStrip } from '@/components/platform/kpi-strip';
import {
    ActivityPanel,
    AgentsPanel,
    DeliverablesPanel,
    SavingsBreakdownPanel,
    TrendPanel,
    WorkflowPerformancePanel,
} from '@/components/platform/panels';
import {
    Delta,
    LeakStatusPill,
    PageHeading,
    Panel,
    PanelBody,
    PanelFooter,
    PanelHeader,
    TableShell,
    TD,
    TH,
    TR,
    DemoBadge,
} from '@/components/platform/ui';
import { cn } from '@/lib/utils';
import { money, percent } from '@/lib/platform/format';
import { getScopedPayload } from '@/lib/platform/source';
import type { PlatformSearchParams } from '@/lib/platform/scope';
import { ScopeChips } from '@/components/platform/scope-chips';

export const metadata: Metadata = {
    title: 'Overview — UPTIMAIZE',
};

export default async function OverviewPage({
    searchParams,
}: {
    searchParams: Promise<PlatformSearchParams>;
}) {
    const params = await searchParams;
    const { data: payload, sources, mode } = await getScopedPayload(params);
    const demo = mode === 'live' && sources.leaks === 'demo';
    const data = payload;

    const resolved = data.leaks.filter((leak) => leak.status === 'resolved').length;
    const investigating = data.leaks.filter((leak) => leak.status === 'investigating').length;
    const open = data.leaks.filter((leak) => leak.status === 'open').length;
    const totalImpact = data.leaks.reduce((sum, leak) => sum + leak.impact, 0);

    return (
        <>
            <PageHeading
                title="Overview"
                subtitle={`Outcome summary for ${data.period.label}`}
            >
                <ScopeChips basePath="/overview" params={params} />
                {demo && <DemoBadge />}
            </PageHeading>

            <KpiStrip kpis={data.kpis} className="mb-4" />

            <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
                {/* Executive summary */}
                <Panel className="xl:col-span-4">
                    <PanelHeader title="Executive Summary">
                        <span className="text-[11px] text-up-faint">{data.period.label}</span>
                    </PanelHeader>
                    <PanelBody>
                        <p className="text-[13px] leading-relaxed text-up-dim">
                            {data.executiveSummary}
                        </p>
                    </PanelBody>
                    <PanelFooter className="flex items-center justify-between gap-3">
                        <span className="up-label text-up-primary">ROI this week</span>
                        <span className="flex items-center gap-3">
                            <span className="up-num text-2xl font-semibold text-up-text">
                                {data.roi.multiple.toFixed(1)}x
                            </span>
                            <Delta
                                trend="up"
                                value={percent(
                                    ((data.roi.multiple - data.roi.previousMultiple) /
                                        data.roi.previousMultiple) *
                                    100
                                )}
                                label="vs last 7 days"
                            />
                        </span>
                    </PanelFooter>
                </Panel>

                <AgentsPanel agents={data.agents} className="xl:col-span-4" />

                <SavingsBreakdownPanel
                    categories={data.savingsBreakdown}
                    total={money(1_230_000)}
                    className="xl:col-span-4"
                />
            </div>

            <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
                {/* Revenue leak resolution */}
                <Panel className="xl:col-span-4">
                    <PanelHeader
                        title="Revenue Leak Resolution"
                        action="View all leaks"
                        actionHref="/revenue-leaks"
                    />
                    <PanelBody className="px-1">
                        <TableShell>
                            <thead>
                                <tr>
                                    <th className={TH}>Leak Detected</th>
                                    <th className={cn(TH, 'text-right')}>Impact</th>
                                    <th className={TH}>Status</th>
                                    <th className={TH}>Resolution</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.leaks.slice(0, 7).map((leak) => (
                                    <tr key={leak.id} className={TR}>
                                        <td className={TD}>
                                            <span className="block max-w-[170px] truncate font-medium">
                                                {leak.name}
                                            </span>
                                        </td>
                                        <td className={cn(TD, 'up-num text-right')}>
                                            {money(leak.impact)}
                                        </td>
                                        <td className={TD}>
                                            <LeakStatusPill status={leak.status} />
                                        </td>
                                        <td className={cn(TD, 'text-up-faint')}>
                                            {leak.resolvedOn ?? '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </TableShell>
                    </PanelBody>
                    <PanelFooter className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-[13px] text-up-dim">
                            Total impact{' '}
                            <span className="up-num ml-1 font-semibold text-up-text">
                                {money(totalImpact)}
                            </span>
                        </span>
                        <span className="flex items-center gap-4 text-[12px]">
                            <span className="text-up-green">{resolved} Resolved</span>
                            <span className="text-up-gold">{investigating} Investigating</span>
                            <span className="text-up-red">{open} Open</span>
                        </span>
                    </PanelFooter>
                </Panel>

                <WorkflowPerformancePanel
                    performance={data.workflowPerformance}
                    className="xl:col-span-4"
                />

                <ActivityPanel
                    activity={data.activity}
                    limit={6}
                    title="Recent Activity"
                    className="xl:col-span-4"
                />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                <TrendPanel
                    trend={data.trend}
                    title="Money Saved (Trend)"
                    className="xl:col-span-6"
                />

                <DeliverablesPanel deliverables={data.deliverables} className="xl:col-span-3" />

                {/* Partner notes */}
                <Panel className="xl:col-span-3">
                    <PanelHeader title="Partner Notes" action="View all notes" actionHref="/activity" />
                    <PanelBody>
                        <div className="flex items-center justify-between">
                            <span className="text-[13px] font-medium text-up-text">
                                From Taylor Reynolds
                            </span>
                            <span className="text-[11px] text-up-faint">May 25, 2025</span>
                        </div>
                        <p className="mt-3 text-[13px] leading-relaxed text-up-dim">
                            Great week, team. You are trending ahead of the monthly savings target.
                            We identified a new approval path optimization that could unlock an
                            additional $120K in annual savings — let&apos;s sync this week.
                        </p>
                        <Link
                            href="/activity"
                            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-up-line bg-up-raise/60 px-3 py-2 text-[12px] font-medium text-up-text transition-colors hover:border-up-primary/50"
                        >
                            Reply to Taylor
                            <ArrowRight className="h-3.5 w-3.5 text-up-primary" />
                        </Link>
                    </PanelBody>
                </Panel>
            </div>
        </>
    );
}
