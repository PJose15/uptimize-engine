import type { Metadata } from 'next';
import { Bot } from 'lucide-react';
import {
    AgentStatusTag,
    PageHeading,
    Panel,
    PanelBody,
    PanelHeader,
    ScoreMeter,
    SeverityPill,
    Sparkline,
    StatTile,
    TableShell,
    TD,
    TH,
    TR,
    EmptyRow,
} from '@/components/platform/ui';
import { cn } from '@/lib/utils';
import { count, percent } from '@/lib/platform/format';
import { getScopedData, type PlatformSearchParams } from '@/lib/platform/scope';
import { ScopeChips } from '@/components/platform/scope-chips';

export const metadata: Metadata = {
    title: 'AI Agents — UPTIMAIZE',
};

export default async function AgentsPage({
    searchParams,
}: {
    searchParams: Promise<PlatformSearchParams>;
}) {
    const params = await searchParams;
    const { agents } = getScopedData(params);

    const active = agents.filter((agent) => agent.status === 'active').length;
    const tasks = agents.reduce((sum, agent) => sum + agent.tasks, 0);
    const approvals = agents.reduce((sum, agent) => sum + agent.approvals, 0);
    const avgPerformance = agents.length
        ? agents.reduce((sum, agent) => sum + agent.performance, 0) / agents.length
        : 0;

    return (
        <>
            <PageHeading
                title="AI Agents"
                subtitle="Every deployed agent, what it is doing, and how well it is doing it."
            >
                <ScopeChips basePath="/agents" params={params} />
            </PageHeading>

            <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatTile label="Agents Active" value={`${active} / ${agents.length}`} hint="Deployed across 6 partners" />
                <StatTile label="Tasks (24h)" value={count(tasks)} tone="gold" hint="Completed autonomously" />
                <StatTile label="Approvals Raised" value={String(approvals)} tone="pink" hint="Awaiting human review" />
                <StatTile label="Avg Performance" value={percent(avgPerformance)} tone="green" hint="Rolling 7-day score" />
            </div>

            <Panel>
                <PanelHeader title="Agent Fleet" />
                <PanelBody className="px-1">
                    <TableShell>
                        <thead>
                            <tr>
                                <th className={TH}>Agent</th>
                                <th className={TH}>Status</th>
                                <th className={cn(TH, 'text-right')}>Tasks (24h)</th>
                                <th className={cn(TH, 'text-right')}>Approvals</th>
                                <th className={TH}>Impact</th>
                                <th className={cn(TH, 'text-right')}>Leaks Found</th>
                                <th className={cn(TH, 'text-right')}>Leaks Closed</th>
                                <th className={cn(TH, 'text-right')}>Trend</th>
                                <th className={cn(TH, 'text-right')}>Performance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {agents.length === 0 && (
                                <EmptyRow colSpan={9} message="No agents match the current scope." />
                            )}
                            {agents.map((agent) => (
                                <tr key={agent.id} className={TR}>
                                    <td className={TD}>
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-up-primary/12 text-up-primary">
                                                <Bot className="h-4 w-4" />
                                            </span>
                                            <span>
                                                <span className="block font-medium text-up-text">
                                                    {agent.name}
                                                </span>
                                                <span className="block text-[11px] text-up-faint">
                                                    {agent.description}
                                                </span>
                                            </span>
                                        </div>
                                    </td>
                                    <td className={TD}>
                                        <AgentStatusTag status={agent.status} />
                                    </td>
                                    <td className={cn(TD, 'up-num text-right')}>
                                        {count(agent.tasks)}
                                    </td>
                                    <td className={cn(TD, 'up-num text-right')}>{agent.approvals}</td>
                                    <td className={TD}>
                                        <SeverityPill severity={agent.impact} />
                                    </td>
                                    <td className={cn(TD, 'up-num text-right')}>
                                        {agent.leaksDetected}
                                    </td>
                                    <td className={cn(TD, 'up-num text-right')}>
                                        {agent.leaksClosed}
                                    </td>
                                    <td className={cn(TD, 'text-right')}>
                                        <span className="inline-flex justify-end">
                                            <Sparkline
                                                series={agent.trend}
                                                tone={agent.status === 'active' ? 'primary' : 'gold'}
                                            />
                                        </span>
                                    </td>
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
        </>
    );
}
