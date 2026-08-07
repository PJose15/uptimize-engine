import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, X } from 'lucide-react';
import {
    LeakStatusPill,
    PageHeading,
    Panel,
    PanelBody,
    PanelHeader,
    SeverityPill,
    StatTile,
    TableShell,
    TD,
    TH,
    TR,
} from '@/components/platform/ui';
import { cn } from '@/lib/utils';
import { money } from '@/lib/platform/format';
import { getCommandCenterData } from '@/lib/platform/data';
import type { RevenueLeak } from '@/lib/platform/types';

export const metadata: Metadata = {
    title: 'Revenue Leaks — UPTIMAIZE',
};

export default async function RevenueLeaksPage({
    searchParams,
}: {
    searchParams: Promise<{ leak?: string }>;
}) {
    const { leak: leakId } = await searchParams;
    const data = getCommandCenterData();
    const selected = data.leaks.find((leak) => leak.id === leakId);

    const totalImpact = data.leaks.reduce((sum, leak) => sum + leak.impact, 0);
    const openImpact = data.leaks
        .filter((leak) => leak.status !== 'resolved')
        .reduce((sum, leak) => sum + leak.impact, 0);
    const resolved = data.leaks.filter((leak) => leak.status === 'resolved');

    return (
        <>
            <PageHeading
                title="Revenue Leaks"
                subtitle="Every dollar the fleet found leaving the business, and where it is going."
            />

            <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatTile label="Leaks Detected" value={String(data.leaks.length)} hint={data.period.label} />
                <StatTile label="Total Impact" value={money(totalImpact)} tone="red" hint="Annualized" />
                <StatTile label="Still Open" value={money(openImpact)} tone="gold" hint={`${data.leaks.length - resolved.length} leaks unresolved`} />
                <StatTile label="Recovered" value={money(totalImpact - openImpact)} tone="green" hint={`${resolved.length} leaks closed`} />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                <Panel className={selected ? 'xl:col-span-8' : 'xl:col-span-12'}>
                    <PanelHeader title="Leak Investigation Queue" />
                    <PanelBody className="px-1">
                        <TableShell>
                            <thead>
                                <tr>
                                    <th className={TH}>Leak</th>
                                    <th className={TH}>Partner</th>
                                    <th className={TH}>Source</th>
                                    <th className={cn(TH, 'text-right')}>Impact</th>
                                    <th className={TH}>Severity</th>
                                    <th className={TH}>Status</th>
                                    <th className={cn(TH, 'text-right')}>Detected</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.leaks.map((leak) => (
                                    <tr
                                        key={leak.id}
                                        className={cn(
                                            TR,
                                            selected?.id === leak.id && 'bg-up-primary/10'
                                        )}
                                    >
                                        <td className={TD}>
                                            <Link
                                                href={`/revenue-leaks?leak=${leak.id}`}
                                                scroll={false}
                                                className="block"
                                            >
                                                <span className="block font-medium text-up-text">
                                                    {leak.name}
                                                </span>
                                                <span className="up-code block text-[11px] text-up-faint">
                                                    #{leak.id}
                                                </span>
                                            </Link>
                                        </td>
                                        <td className={cn(TD, 'text-up-dim')}>{leak.partner}</td>
                                        <td className={cn(TD, 'text-up-faint')}>{leak.source}</td>
                                        <td className={cn(TD, 'up-num text-right font-medium')}>
                                            {money(leak.impact)}
                                        </td>
                                        <td className={TD}>
                                            <SeverityPill severity={leak.severity} />
                                        </td>
                                        <td className={TD}>
                                            <LeakStatusPill status={leak.status} />
                                        </td>
                                        <td className={cn(TD, 'text-right text-up-faint')}>
                                            {leak.detectedAt.split(' ').slice(0, 3).join(' ')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </TableShell>
                    </PanelBody>
                </Panel>

                {selected && <LeakDrawer leak={selected} className="xl:col-span-4" />}
            </div>
        </>
    );
}

function LeakDrawer({ leak, className }: { leak: RevenueLeak; className?: string }) {
    return (
        <Panel className={className}>
            <div className="flex items-start justify-between gap-3 border-b border-up-line-soft px-4 py-3">
                <span className="up-code text-[11px] font-semibold uppercase tracking-[0.06em] text-up-faint">
                    Leak #{leak.id}
                </span>
                <Link
                    href="/revenue-leaks"
                    scroll={false}
                    aria-label="Close investigation"
                    className="text-up-faint transition-colors hover:text-up-text"
                >
                    <X className="h-4 w-4" />
                </Link>
            </div>

            <div className="px-4 pb-4 pt-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-up-text">{leak.name}</h2>
                        <p className="mt-0.5 text-[12px] text-up-faint">
                            Revenue Leak · <span className="capitalize">{leak.severity}</span> impact
                        </p>
                    </div>
                    <LeakStatusPill status={leak.status} />
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-up-line-soft pt-4">
                    <div>
                        <dt className="up-label text-up-faint">Potential Impact</dt>
                        <dd className="up-num mt-1.5 text-lg font-semibold text-up-text">
                            {money(leak.impact)}
                        </dd>
                    </div>
                    <div>
                        <dt className="up-label text-up-faint">Detected</dt>
                        <dd className="mt-1.5 text-[12px] text-up-dim">{leak.detectedAt}</dd>
                        <dd className="text-[11px] text-up-faint">by {leak.detectedBy}</dd>
                    </div>
                    <div className="col-span-2 border-t border-up-line-soft pt-4">
                        <dt className="up-label text-up-faint">System</dt>
                        <dd className="mt-1.5 text-[12px] text-up-dim">{leak.source}</dd>
                        <dd className="text-[11px] text-up-faint">{leak.partner}</dd>
                    </div>
                </dl>

                <div className="mt-5 border-t border-up-line-soft pt-4">
                    <p className="up-label text-up-faint">Description</p>
                    <p className="mt-2 text-[13px] leading-relaxed text-up-dim">
                        {leak.description}
                    </p>
                </div>

                <div className="mt-5">
                    <p className="up-label text-up-faint">Evidence Preview</p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                        {leak.evidence.map((item) => (
                            <li
                                key={item.name}
                                className="flex items-center gap-2 rounded-lg border border-up-line bg-up-raise/50 px-2.5 py-1.5"
                            >
                                <FileText className="h-3.5 w-3.5 text-up-primary" />
                                <span className="up-code text-[11px] text-up-text">{item.name}</span>
                                <span className="up-num text-[10px] text-up-faint">{item.size}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="mt-5 border-t border-up-line-soft pt-4">
                    <p className="up-label text-up-faint">Next Step</p>
                    <p className="mt-2 text-[13px] leading-relaxed text-up-dim">{leak.nextStep}</p>
                </div>

                <Link
                    href="/activity"
                    className="mt-5 flex w-full items-center justify-center rounded-lg bg-up-primary px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-up-primary-deep"
                >
                    Open Investigation
                </Link>

                <div className="mt-5 flex items-center justify-between border-t border-up-line-soft pt-4">
                    <div>
                        <p className="up-label text-up-faint">Assignee</p>
                        <p className="mt-2 flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-up-primary-deep to-up-primary text-[10px] font-semibold text-white">
                                {(leak.assignee ?? 'UP')
                                    .split(' ')
                                    .map((part) => part[0])
                                    .join('')}
                            </span>
                            <span className="text-[12px] text-up-text">{leak.assignee}</span>
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="up-label text-up-faint">Resolution</p>
                        <p className="mt-2 text-[12px] text-up-dim">
                            {leak.resolvedOn ?? 'In progress'}
                        </p>
                    </div>
                </div>
            </div>
        </Panel>
    );
}
