import type { Metadata } from 'next';
import { SavingsBreakdownPanel, TrendPanel } from '@/components/platform/panels';
import {
    Delta,
    Meter,
    PageHeading,
    Panel,
    PanelBody,
    PanelHeader,
    StatTile,
} from '@/components/platform/ui';
import { money, percent } from '@/lib/platform/format';
import { getScopedData, type PlatformSearchParams } from '@/lib/platform/scope';
import { ScopeChips } from '@/components/platform/scope-chips';

export const metadata: Metadata = {
    title: 'ROI — UPTIMAIZE',
};

export default async function RoiPage({
    searchParams,
}: {
    searchParams: Promise<PlatformSearchParams>;
}) {
    const params = await searchParams;
    const { roi, savingsBreakdown, trend, period } = getScopedData(params);

    const totalSavings = savingsBreakdown.reduce((sum, category) => sum + category.value, 0);
    const lift = ((roi.multiple - roi.previousMultiple) / roi.previousMultiple) * 100;

    return (
        <>
            <PageHeading
                title="ROI Analyzer"
                subtitle={`Return on the automation program for ${period.label}`}
            >
                <ScopeChips basePath="/roi" params={params} />
            </PageHeading>

            <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
                <Panel className="xl:col-span-4">
                    <PanelHeader title="Program Return" />
                    <PanelBody>
                        <div className="flex items-end gap-3">
                            <span className="up-num text-5xl font-semibold leading-none text-up-text">
                                {roi.multiple.toFixed(1)}x
                            </span>
                            <Delta trend="up" value={percent(lift)} label={`vs ${roi.previousMultiple.toFixed(1)}x last period`} />
                        </div>

                        <dl className="mt-6 space-y-4">
                            <div>
                                <div className="flex items-baseline justify-between">
                                    <dt className="text-[12px] text-up-dim">Returned</dt>
                                    <dd className="up-num text-[13px] font-semibold text-up-text">
                                        {money(roi.returned)}
                                    </dd>
                                </div>
                                <Meter value={100} tone="primary" className="mt-2" />
                            </div>
                            <div>
                                <div className="flex items-baseline justify-between">
                                    <dt className="text-[12px] text-up-dim">Program investment</dt>
                                    <dd className="up-num text-[13px] font-semibold text-up-text">
                                        {money(roi.investment)}
                                    </dd>
                                </div>
                                <Meter
                                    value={(roi.investment / roi.returned) * 100}
                                    tone="gold"
                                    className="mt-2"
                                />
                            </div>
                        </dl>
                    </PanelBody>
                </Panel>

                <SavingsBreakdownPanel
                    categories={savingsBreakdown}
                    total={money(totalSavings)}
                    className="xl:col-span-8"
                />
            </div>

            <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatTile label="Net Benefit" value={money(roi.returned - roi.investment)} tone="green" hint="Returned less investment" />
                <StatTile label="Hours Reclaimed" value={String(roi.hoursReclaimed)} tone="gold" hint="Redeployed to higher-value work" />
                <StatTile label="Payback Period" value={`${roi.paybackDays} days`} hint="From program start" />
                <StatTile label="Savings Booked" value={money(totalSavings)} tone="pink" hint="Across 5 categories" />
            </div>

            <TrendPanel trend={trend} title="Savings & ROI Trend" />
        </>
    );
}
