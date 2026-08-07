import type { Metadata } from 'next';
import {
    HealthDot,
    PageHeading,
    Panel,
    PanelBody,
    PanelHeader,
    Sparkline,
    StatTile,
    TableShell,
    TD,
    TH,
    TR,
    EmptyRow,
    EmptyState,
} from '@/components/platform/ui';
import { cn } from '@/lib/utils';
import { money, moneyOrDash } from '@/lib/platform/format';
import { getScopedPayload } from '@/lib/platform/source';
import type { PlatformSearchParams } from '@/lib/platform/scope';
import { ScopeChips } from '@/components/platform/scope-chips';

export const metadata: Metadata = {
    title: 'Partners & Accounts — UPTIMAIZE',
};

export default async function PartnersPage({
    searchParams,
}: {
    searchParams: Promise<PlatformSearchParams>;
}) {
    const params = await searchParams;
    const { data: payload } = await getScopedPayload(params);
    const { partners, period } = payload;

    const revenueProtected = partners.reduce((sum, partner) => sum + partner.revenueProtected, 0);
    const moneySaved = partners.reduce((sum, partner) => sum + partner.moneySaved, 0);
    const atRisk = partners.filter((partner) => partner.health !== 'healthy').length;

    return (
        <>
            <PageHeading
                title="Partners & Accounts"
                subtitle="Portfolio health, protected revenue, and coverage per account."
            >
                <ScopeChips basePath="/partners" params={params} />
            </PageHeading>

            <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatTile label="Active Partners" value={String(partners.length)} hint="Under management" />
                <StatTile label="Revenue Protected" value={money(revenueProtected)} tone="green" hint={period.label} />
                <StatTile label="Money Saved" value={money(moneySaved)} tone="gold" hint="Booked to date" />
                <StatTile label="Needs Attention" value={String(atRisk)} tone="red" hint="Health below healthy" />
            </div>

            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {partners.length === 0 && (
                    <div className="xl:col-span-3 md:col-span-2">
                        <EmptyState message="No partners match the current scope." />
                    </div>
                )}
                {partners.map((partner) => (
                    <Panel key={partner.id} className="p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <h3 className="truncate text-[15px] font-semibold text-up-text">
                                    {partner.name}
                                </h3>
                                <p className="mt-0.5 text-[11px] text-up-faint">
                                    Partner since {partner.since}
                                </p>
                            </div>
                            <HealthDot health={partner.health} withLabel />
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <div>
                                <p className="up-label text-up-faint">Revenue Protected</p>
                                <p className="up-num mt-1 text-lg font-semibold text-up-text">
                                    {moneyOrDash(partner.revenueProtected)}
                                </p>
                            </div>
                            <div>
                                <p className="up-label text-up-faint">Money Saved</p>
                                <p className="up-num mt-1 text-lg font-semibold text-up-gold">
                                    {moneyOrDash(partner.moneySaved)}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 flex items-end justify-between gap-3 border-t border-up-line-soft pt-3">
                            <ul className="flex gap-4 text-[11px] text-up-faint">
                                <li>
                                    <span className="up-num block text-[13px] font-medium text-up-text">
                                        {partner.agents}
                                    </span>
                                    agents
                                </li>
                                <li>
                                    <span className="up-num block text-[13px] font-medium text-up-text">
                                        {partner.workflows}
                                    </span>
                                    workflows
                                </li>
                                <li>
                                    <span className="up-num block text-[13px] font-medium text-up-text">
                                        {partner.leaksClosed}/{partner.leaksDetected}
                                    </span>
                                    leaks closed
                                </li>
                            </ul>
                            <Sparkline series={partner.trend} tone={partner.tone} width={80} />
                        </div>
                    </Panel>
                ))}
            </div>

            <Panel>
                <PanelHeader title="Portfolio Detail" />
                <PanelBody className="px-1">
                    <TableShell>
                        <thead>
                            <tr>
                                <th className={TH}>Partner</th>
                                <th className={cn(TH, 'text-center')}>Health</th>
                                <th className={cn(TH, 'text-right')}>Revenue Protected</th>
                                <th className={cn(TH, 'text-right')}>Money Saved</th>
                                <th className={cn(TH, 'text-right')}>Leaks Detected</th>
                                <th className={cn(TH, 'text-right')}>Leaks Closed</th>
                                <th className={cn(TH, 'text-right')}>Agents</th>
                                <th className={cn(TH, 'text-right')}>Trend (7D)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {partners.length === 0 && (
                                <EmptyRow colSpan={8} message="No partners match the current scope." />
                            )}
                            {partners.map((partner) => (
                                <tr key={partner.id} className={TR}>
                                    <td className={cn(TD, 'font-medium')}>{partner.name}</td>
                                    <td className={cn(TD, 'text-center')}>
                                        <span className="inline-flex justify-center">
                                            <HealthDot health={partner.health} />
                                        </span>
                                    </td>
                                    <td className={cn(TD, 'up-num text-right')}>
                                        {moneyOrDash(partner.revenueProtected)}
                                    </td>
                                    <td className={cn(TD, 'up-num text-right')}>
                                        {moneyOrDash(partner.moneySaved)}
                                    </td>
                                    <td className={cn(TD, 'up-num text-right')}>
                                        {partner.leaksDetected}
                                    </td>
                                    <td className={cn(TD, 'up-num text-right')}>
                                        {partner.leaksClosed}
                                    </td>
                                    <td className={cn(TD, 'up-num text-right')}>{partner.agents}</td>
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
        </>
    );
}