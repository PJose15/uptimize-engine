import type { Metadata } from 'next';
import { FileText } from 'lucide-react';
import {
    PageHeading,
    Panel,
    PanelBody,
    PanelHeader,
    Pill,
    StatTile,
    TableShell,
    TD,
    TH,
    TR,
    EmptyRow,
} from '@/components/platform/ui';
import { cn } from '@/lib/utils';
import { currency } from '@/lib/platform/format';
import { getScopedData, type PlatformSearchParams } from '@/lib/platform/scope';
import { ScopeChips } from '@/components/platform/scope-chips';
import type { Approval, Tone } from '@/lib/platform/types';

export const metadata: Metadata = {
    title: 'Approvals — UPTIMAIZE',
};

const URGENCY: Record<Approval['urgency'], { label: string; tone: Tone }> = {
    critical: { label: 'SLA at risk', tone: 'red' },
    warning: { label: 'Due soon', tone: 'gold' },
    normal: { label: 'On track', tone: 'green' },
};

export default async function ApprovalsPage({
    searchParams,
}: {
    searchParams: Promise<PlatformSearchParams>;
}) {
    const params = await searchParams;
    const { approvals } = getScopedData(params);

    const pendingValue = approvals.reduce((sum, approval) => sum + approval.amount, 0);
    const atRisk = approvals.filter((approval) => approval.urgency === 'critical').length;

    return (
        <>
            <PageHeading
                title="Approvals"
                subtitle="Decisions the agents escalated to a human, ordered by urgency."
            >
                <ScopeChips basePath="/approvals" params={params} />
            </PageHeading>

            <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatTile label="Pending" value={String(approvals.length)} tone="gold" hint="Awaiting review" />
                <StatTile label="Value Held" value={currency(pendingValue)} hint="Across pending requests" />
                <StatTile label="SLA at Risk" value={String(atRisk)} tone="red" hint="Breaching within the hour" />
                <StatTile label="Auto-approved (24h)" value="24" tone="green" hint="Handled under policy" />
            </div>

            <Panel>
                <PanelHeader
                    title="Pending Approvals"
                    badge={
                        <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-up-gold px-1.5 text-[10px] font-bold text-up-deep">
                            {approvals.length}
                        </span>
                    }
                />
                <PanelBody className="px-1">
                    <TableShell>
                        <thead>
                            <tr>
                                <th className={TH}>Request</th>
                                <th className={TH}>Partner</th>
                                <th className={cn(TH, 'text-right')}>Amount</th>
                                <th className={cn(TH, 'text-right')}>Waiting</th>
                                <th className={TH}>Urgency</th>
                                <th className={cn(TH, 'text-right')}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {approvals.length === 0 && (
                                <EmptyRow colSpan={6} message="No approvals match the current scope." />
                            )}
                            {approvals.map((approval) => {
                                const urgency = URGENCY[approval.urgency];

                                return (
                                    <tr key={approval.id} className={TR}>
                                        <td className={TD}>
                                            <div className="flex items-center gap-3">
                                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-up-primary/12 text-up-primary">
                                                    <FileText className="h-4 w-4" />
                                                </span>
                                                <span>
                                                    <span className="block font-medium text-up-text">
                                                        {approval.title}
                                                    </span>
                                                    <span className="up-code block text-[11px] text-up-faint">
                                                        #{approval.id}
                                                    </span>
                                                </span>
                                            </div>
                                        </td>
                                        <td className={cn(TD, 'text-up-dim')}>{approval.partner}</td>
                                        <td className={cn(TD, 'up-num text-right font-medium')}>
                                            {currency(approval.amount)}
                                        </td>
                                        <td className={cn(TD, 'up-num text-right text-up-faint')}>
                                            {approval.waiting}
                                        </td>
                                        <td className={TD}>
                                            <Pill tone={urgency.tone}>{urgency.label}</Pill>
                                        </td>
                                        <td className={cn(TD, 'text-right')}>
                                            <button
                                                type="button"
                                                className="rounded-lg border border-up-line bg-up-raise/60 px-3 py-1.5 text-[12px] font-medium text-up-text transition-colors hover:border-up-primary/50 hover:bg-up-primary/15"
                                            >
                                                Review
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </TableShell>
                </PanelBody>
            </Panel>
        </>
    );
}
