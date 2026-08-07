import type { Metadata } from 'next';
import { WorkflowPerformancePanel } from '@/components/platform/panels';
import {
    Meter,
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
} from '@/components/platform/ui';
import { cn } from '@/lib/utils';
import { count, percent } from '@/lib/platform/format';
import { getCommandCenterData } from '@/lib/platform/data';
import type { Tone, Workflow } from '@/lib/platform/types';

export const metadata: Metadata = {
    title: 'Workflows — UPTIMAIZE',
};

const STATUS_TONE: Record<Workflow['status'], Tone> = {
    running: 'green',
    scheduled: 'blue',
    paused: 'gold',
    draft: 'pink',
};

export default function WorkflowsPage() {
    const { workflows, workflowPerformance } = getCommandCenterData();

    const running = workflows.filter((workflow) => workflow.status === 'running').length;
    const runs = workflows.reduce((sum, workflow) => sum + workflow.runs, 0);
    const hoursSaved = workflows.reduce((sum, workflow) => sum + workflow.hoursSaved, 0);

    return (
        <>
            <PageHeading
                title="Workflows"
                subtitle="Automations running across every partner account, with live throughput."
            />

            <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatTile label="Running Now" value={String(running)} tone="green" hint={`${workflows.length} total workflows`} />
                <StatTile label="Runs (7D)" value={count(runs)} hint="Across all partners" />
                <StatTile label="Hours Reclaimed" value={String(hoursSaved)} tone="gold" hint="Per month, annualized" />
                <StatTile label="Success Rate" value={percent(workflowPerformance.automationSuccessRate)} tone="pink" hint={`+${workflowPerformance.successDelta} vs last 7 days`} />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                <Panel className="xl:col-span-8">
                    <PanelHeader title="Workflow Queue" />
                    <PanelBody className="px-1">
                        <TableShell>
                            <thead>
                                <tr>
                                    <th className={TH}>Workflow</th>
                                    <th className={TH}>Partner</th>
                                    <th className={TH}>Trigger</th>
                                    <th className={TH}>Status</th>
                                    <th className={cn(TH, 'text-right')}>Runs</th>
                                    <th className={cn(TH, 'text-right')}>Avg Duration</th>
                                    <th className={cn(TH, 'text-right')}>Last Run</th>
                                    <th className={cn(TH, 'w-40')}>Success</th>
                                </tr>
                            </thead>
                            <tbody>
                                {workflows.map((workflow) => (
                                    <tr key={workflow.id} className={TR}>
                                        <td className={cn(TD, 'font-medium')}>{workflow.name}</td>
                                        <td className={cn(TD, 'text-up-dim')}>{workflow.partner}</td>
                                        <td className={cn(TD, 'text-up-faint')}>{workflow.trigger}</td>
                                        <td className={TD}>
                                            <Pill tone={STATUS_TONE[workflow.status]}>
                                                <span className="capitalize">{workflow.status}</span>
                                            </Pill>
                                        </td>
                                        <td className={cn(TD, 'up-num text-right')}>
                                            {count(workflow.runs)}
                                        </td>
                                        <td className={cn(TD, 'up-num text-right')}>
                                            {workflow.avgDurationSec.toFixed(1)}s
                                        </td>
                                        <td className={cn(TD, 'text-right text-up-faint')}>
                                            {workflow.lastRun}
                                        </td>
                                        <td className={TD}>
                                            <div className="flex items-center gap-2">
                                                <Meter
                                                    value={workflow.successRate}
                                                    tone={workflow.successRate >= 95 ? 'green' : 'gold'}
                                                />
                                                <span className="up-num w-12 shrink-0 text-right text-[12px] text-up-dim">
                                                    {percent(workflow.successRate)}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </TableShell>
                    </PanelBody>
                </Panel>

                <WorkflowPerformancePanel
                    performance={workflowPerformance}
                    className="xl:col-span-4"
                />
            </div>
        </>
    );
}
