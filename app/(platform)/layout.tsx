import type { Metadata } from 'next';
import { Sidebar } from '@/components/platform/sidebar';
import { Topbar } from '@/components/platform/topbar';
import { getCommandCenterData } from '@/lib/platform/data';

export const metadata: Metadata = {
    title: 'UPTIMAIZE — Aligned Intelligence',
    description: 'Real-time visibility into outcomes, operations, and opportunities.',
};

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
    const data = getCommandCenterData();

    return (
        <div className="up-canvas flex min-h-screen text-up-text">
            <Sidebar approvalCount={data.approvals.length} alertCount={data.alerts.length} />

            <div className="flex h-screen min-w-0 flex-1 flex-col">
                <Topbar period={data.period.label} alertCount={data.alerts.length} />
                <main className="up-scroll flex-1 overflow-y-auto px-6 pb-10 pt-6">{children}</main>
            </div>
        </div>
    );
}
