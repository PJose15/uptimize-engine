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
import { getScopedData, type PlatformSearchParams } from '@/lib/platform/scope';
import { ScopeChips } from '@/components/platform/scope-chips';

export const metadata: Metadata = {
    title: 'Executive Command Center — UPTIMAIZE',
};

export default async function CommandCenterPage({
    searchParams,
}: {
    searchParams: Promise<PlatformSearchParams>;
}) {
    const params = await searchParams;
    const data = getScopedData(params);

    return (
        <>
            <PageHeading
                title="Executive Command Center"
                subtitle="Real-time visibility into outcomes, operations, and opportunities."
            >
                <ScopeChips basePath="/command-center" params={params} />
            </PageHeading>

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
