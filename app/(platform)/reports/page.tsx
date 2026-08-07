import type { Metadata } from 'next';
import { CalendarClock, Download } from 'lucide-react';
import {
    PageHeading,
    Panel,
    PanelBody,
    PanelHeader,
    StatTile,
    TONE_HEX,
} from '@/components/platform/ui';
import { getCommandCenterData } from '@/lib/platform/data';
import type { Deliverable, Tone } from '@/lib/platform/types';

export const metadata: Metadata = {
    title: 'Reports — UPTIMAIZE',
};

const FORMAT_TONE: Record<Deliverable['format'], Tone> = {
    PDF: 'red',
    XLSX: 'green',
    PPTX: 'gold',
    CSV: 'blue',
};

const SCHEDULE = [
    { name: 'Executive Summary', cadence: 'Every Monday · 07:00', recipients: 'All partner leads' },
    { name: 'Revenue Leak Analysis', cadence: 'Every Monday · 07:15', recipients: 'Operations' },
    { name: 'ROI Impact Summary', cadence: 'First of month · 08:00', recipients: 'Executive sponsors' },
    { name: 'Agent Activity Summary', cadence: 'Every Friday · 17:00', recipients: 'Internal ops' },
];

export default function ReportsPage() {
    const { deliverables, period } = getCommandCenterData();

    return (
        <>
            <PageHeading
                title="Reports & Deliverables"
                subtitle="Everything the fleet published, and what is scheduled next."
            />

            <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatTile label="Published" value={String(deliverables.length)} hint={period.label} />
                <StatTile label="Scheduled" value={String(SCHEDULE.length)} tone="gold" hint="Recurring deliverables" />
                <StatTile label="Recipients" value="18" tone="pink" hint="Across 6 partners" />
                <StatTile label="On-time Rate" value="100%" tone="green" hint="Last 30 days" />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:col-span-8">
                    {deliverables.map((item) => {
                        const tone = FORMAT_TONE[item.format];

                        return (
                            <Panel key={item.id} className="p-4">
                                <div className="flex items-start gap-3">
                                    <span
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold"
                                        style={{
                                            backgroundColor: `${TONE_HEX[tone]}1f`,
                                            color: TONE_HEX[tone],
                                        }}
                                    >
                                        {item.format}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="truncate text-[14px] font-semibold text-up-text">
                                            {item.name}
                                        </h3>
                                        <p className="mt-0.5 text-[11px] text-up-faint">
                                            {item.period}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between border-t border-up-line-soft pt-3">
                                    <span className="text-[11px] text-up-faint">
                                        Generated {item.generatedOn} · {item.size}
                                    </span>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-up-line bg-up-raise/60 px-2.5 py-1.5 text-[12px] font-medium text-up-text transition-colors hover:border-up-primary/50 hover:bg-up-primary/15"
                                    >
                                        <Download className="h-3.5 w-3.5 text-up-primary" />
                                        Download
                                    </button>
                                </div>
                            </Panel>
                        );
                    })}
                </div>

                <Panel className="xl:col-span-4">
                    <PanelHeader title="Delivery Schedule" />
                    <PanelBody className="space-y-1">
                        {SCHEDULE.map((entry) => (
                            <div
                                key={entry.name}
                                className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-up-raise/50"
                            >
                                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-up-primary/12 text-up-primary">
                                    <CalendarClock className="h-3.5 w-3.5" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-[13px] text-up-text">{entry.name}</p>
                                    <p className="truncate text-[11px] text-up-faint">
                                        {entry.cadence} · {entry.recipients}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </PanelBody>
                </Panel>
            </div>
        </>
    );
}
