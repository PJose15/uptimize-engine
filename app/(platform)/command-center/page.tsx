import type { Metadata } from 'next';
import { KpiStrip } from '@/components/platform/kpi-strip';
import {
    ActivityPanel,
    AgentsPanel,
    AlertsPanel,
    ApprovalsPanel,
    DeliverablesPanel,
    LeaksPanel,
    PartnersPanel,
    TrendPanel,
    WorkflowPerformancePanel,
} from '@/components/platform/panels';
import { PageHeading } from '@/components/platform/ui';
import { getCommandCenterData } from '@/lib/platform/data';

export const metadata: Metadata = {
    title: 'Executive Command Center — UPTIMAIZE',
};

export default function CommandCenterPage() {
    const data = getCommandCenterData();

    return (
        <>
            <PageHeading
                title="Executive Command Center"
                subtitle="Real-time visibility into outcomes, operations, and opportunities."
            />

            <KpiStrip kpis={data.kpis} className="mb-4" />

            <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
                <AgentsPanel agents={data.agents} className="xl:col-span-4" />
                <LeaksPanel leaks={data.leaks} className="xl:col-span-5" />
                <ApprovalsPanel approvals={data.approvals} className="xl:col-span-3" />
            </div>

            <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
                <TrendPanel trend={data.trend} className="xl:col-span-5" />
                <WorkflowPerformancePanel
                    performance={data.workflowPerformance}
                    className="xl:col-span-3"
                />
                <PartnersPanel partners={data.partners} className="xl:col-span-4" />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <ActivityPanel activity={data.activity} limit={5} title="Recent Activity" />
                <DeliverablesPanel deliverables={data.deliverables} />
                <AlertsPanel alerts={data.alerts} />
            </div>
        </>
    );
}
