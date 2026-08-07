import type { Metadata } from 'next';
import { ActivityPanel } from '@/components/platform/panels';
import { PageHeading, Panel, PanelBody, PanelHeader, StatTile } from '@/components/platform/ui';
import { getCommandCenterData } from '@/lib/platform/data';

export const metadata: Metadata = {
    title: 'Activity — UPTIMAIZE',
};

export default function ActivityPage() {
    const { activity, systemStatus, agents, workflows } = getCommandCenterData();

    const byKind = activity.reduce<Record<string, number>>((acc, event) => {
        acc[event.kind] = (acc[event.kind] ?? 0) + 1;
        return acc;
    }, {});

    return (
        <>
            <PageHeading
                title="Activity"
                subtitle="Every action the fleet took, newest first."
            />

            <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatTile label="Events (24h)" value={String(activity.length)} hint="Across all partners" />
                <StatTile label="Agents Reporting" value={String(agents.filter((a) => a.status === 'active').length)} tone="green" hint={`${agents.length} deployed`} />
                <StatTile label="Workflows Running" value={String(workflows.filter((w) => w.status === 'running').length)} tone="gold" hint={`${workflows.length} configured`} />
                <StatTile label="Leak Events" value={String(byKind.leak ?? 0)} tone="red" hint="Detected or resolved" />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                <ActivityPanel
                    activity={activity}
                    limit={activity.length}
                    title="Event Stream"
                    className="xl:col-span-8"
                />

                <Panel className="xl:col-span-4">
                    <PanelHeader title="System Status" />
                    <PanelBody className="space-y-3">
                        <div className="flex items-center gap-2 rounded-lg border border-up-green/25 bg-up-green/8 px-3 py-2.5">
                            <span className="h-2 w-2 rounded-full bg-up-green" />
                            <span className="text-[13px] text-up-text">{systemStatus.label}</span>
                        </div>

                        <ul className="space-y-2.5">
                            {[
                                { label: 'Agent runtime', value: 'Operational' },
                                { label: 'Workflow engine', value: 'Operational' },
                                { label: 'Integrations', value: 'Operational' },
                                { label: 'Reporting pipeline', value: 'Operational' },
                                { label: 'Approval routing', value: 'Degraded — 98.7%' },
                            ].map((row) => (
                                <li
                                    key={row.label}
                                    className="flex items-center justify-between border-b border-up-line-soft pb-2.5 text-[13px] last:border-0"
                                >
                                    <span className="text-up-dim">{row.label}</span>
                                    <span
                                        className={
                                            row.value === 'Operational'
                                                ? 'text-up-green'
                                                : 'text-up-gold'
                                        }
                                    >
                                        {row.value}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </PanelBody>
                </Panel>
            </div>
        </>
    );
}
