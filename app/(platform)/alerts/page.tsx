import type { Metadata } from 'next';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, type LucideIcon } from 'lucide-react';
import {
    PageHeading,
    Panel,
    PanelBody,
    PanelHeader,
    StatTile,
    TONE_HEX,
    EmptyState,
    DemoBadge,
} from '@/components/platform/ui';
import { getScopedPayload } from '@/lib/platform/source';
import type { PlatformSearchParams } from '@/lib/platform/scope';
import { ScopeChips } from '@/components/platform/scope-chips';
import type { PlatformAlert, Tone } from '@/lib/platform/types';

export const metadata: Metadata = {
    title: 'Alerts — UPTIMAIZE',
};

const LEVEL: Record<PlatformAlert['level'], { icon: LucideIcon; tone: Tone; label: string }> = {
    critical: { icon: AlertTriangle, tone: 'red', label: 'Critical' },
    warning: { icon: AlertCircle, tone: 'gold', label: 'Warning' },
    info: { icon: Info, tone: 'blue', label: 'Info' },
    success: { icon: CheckCircle2, tone: 'green', label: 'Resolved' },
};

export default async function AlertsPage({
    searchParams,
}: {
    searchParams: Promise<PlatformSearchParams>;
}) {
    const params = await searchParams;
    const { data: payload, sources, mode } = await getScopedPayload(params);
    const demo = mode === 'live' && sources.alerts === 'demo';
    const { alerts } = payload;

    const tally = (level: PlatformAlert['level']) =>
        alerts.filter((alert) => alert.level === level).length;

    return (
        <>
            <PageHeading
                title="Alerts & Notifications"
                subtitle="What needs a human eye, ranked by how loudly it is asking."
            >
                <ScopeChips basePath="/alerts" params={params} />
                {demo && <DemoBadge />}
            </PageHeading>

            <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatTile label="Critical" value={String(tally('critical'))} tone="red" hint="Immediate action" />
                <StatTile label="Warning" value={String(tally('warning'))} tone="gold" hint="Review today" />
                <StatTile label="Informational" value={String(tally('info'))} tone="blue" hint="No action required" />
                <StatTile label="Resolved (24h)" value={String(tally('success'))} tone="green" hint="Cleared automatically" />
            </div>

            <Panel>
                <PanelHeader title="All Alerts" />
                <PanelBody className="space-y-1">
                    {alerts.length === 0 && <EmptyState message="No alerts match the current scope." />}
                    {alerts.map((alert) => {
                        const cfg = LEVEL[alert.level];
                        const Icon = cfg.icon;

                        return (
                            <div
                                key={alert.id}
                                className="flex items-start gap-3 rounded-lg border border-up-line-soft bg-up-raise/30 px-3 py-3 transition-colors hover:border-up-line hover:bg-up-raise/60"
                            >
                                <span
                                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                    style={{
                                        backgroundColor: `${TONE_HEX[cfg.tone]}1f`,
                                        color: TONE_HEX[cfg.tone],
                                    }}
                                >
                                    <Icon className="h-4 w-4" />
                                </span>

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[13px] font-medium text-up-text">
                                            {alert.title}
                                        </span>
                                        <span
                                            className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                                            style={{
                                                backgroundColor: `${TONE_HEX[cfg.tone]}1f`,
                                                color: TONE_HEX[cfg.tone],
                                            }}
                                        >
                                            {cfg.label}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-[12px] text-up-faint">{alert.context}</p>
                                </div>

                                <span className="up-num shrink-0 text-[11px] text-up-faint">
                                    {alert.at}
                                </span>
                            </div>
                        );
                    })}
                </PanelBody>
            </Panel>
        </>
    );
}
