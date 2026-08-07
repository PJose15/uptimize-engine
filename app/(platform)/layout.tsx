import type { Metadata } from 'next';
import { PlatformShell } from '@/components/platform/shell';
import { getCommandCenterData } from '@/lib/platform/data';

export const metadata: Metadata = {
    title: 'UPTIMAIZE — Aligned Intelligence',
    description: 'Real-time visibility into outcomes, operations, and opportunities.',
};

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
    const data = getCommandCenterData();

    return (
        <PlatformShell
            partners={data.partners.map(({ id, name }) => ({ id, name }))}
            period={data.period.label}
            approvalCount={data.approvals.length}
            alertCount={data.alerts.length}
        >
            {children}
        </PlatformShell>
    );
}
