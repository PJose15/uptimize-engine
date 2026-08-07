import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeading, Panel, PanelBody, PanelHeader } from '@/components/platform/ui';

export const metadata: Metadata = {
    title: 'Settings — UPTIMAIZE',
};

const FIELD =
    'h-9 w-full rounded-lg border border-up-line bg-up-canvas px-3 text-[13px] text-up-text outline-none transition-colors placeholder:text-up-faint focus:border-up-primary';

const INTEGRATIONS = [
    { name: 'Salesforce', detail: 'CRM · 6 partners connected', connected: true },
    { name: 'NetSuite', detail: 'ERP · 3 partners connected', connected: true },
    { name: 'Slack', detail: 'Alert routing · #uptimaize-ops', connected: true },
    { name: 'Google Workspace', detail: 'Reports & calendar', connected: true },
    { name: 'HubSpot', detail: 'Marketing automation', connected: false },
    { name: 'Snowflake', detail: 'Data warehouse export', connected: false },
];

function Field({
    label,
    defaultValue,
    hint,
}: {
    label: string;
    defaultValue: string;
    hint?: string;
}) {
    return (
        <label className="block">
            <span className="up-label block text-up-faint">{label}</span>
            <input className={cn(FIELD, 'mt-2')} defaultValue={defaultValue} />
            {hint && <span className="mt-1.5 block text-[11px] text-up-faint">{hint}</span>}
        </label>
    );
}

function ToggleRow({
    label,
    hint,
    on,
}: {
    label: string;
    hint: string;
    on: boolean;
}) {
    return (
        <div className="flex items-start justify-between gap-4 border-b border-up-line-soft py-3 last:border-0">
            <div className="min-w-0">
                <p className="text-[13px] text-up-text">{label}</p>
                <p className="mt-0.5 text-[11px] text-up-faint">{hint}</p>
            </div>
            <span
                aria-hidden="true"
                className={cn(
                    'mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors',
                    on ? 'bg-up-primary' : 'bg-up-raise'
                )}
            >
                <span
                    className={cn(
                        'h-4 w-4 rounded-full bg-white transition-transform',
                        on && 'translate-x-4'
                    )}
                />
            </span>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <>
            <PageHeading
                title="Settings"
                subtitle="Organization profile, escalation policy, and connected systems."
            />

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                <Panel className="xl:col-span-6">
                    <PanelHeader title="Organization" />
                    <PanelBody className="space-y-4">
                        <Field label="Organization name" defaultValue="UPTIMAIZE" />
                        <Field label="Primary contact" defaultValue="ops@uptimaize.com" />
                        <Field
                            label="Reporting period"
                            defaultValue="Weekly (Mon – Sun)"
                            hint="Controls the period every dashboard and deliverable rolls up to."
                        />
                    </PanelBody>
                </Panel>

                <Panel className="xl:col-span-6">
                    <PanelHeader title="Escalation Policy" />
                    <PanelBody>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field
                                label="Auto-approve below"
                                defaultValue="$1,000"
                                hint="Agents clear requests under this amount."
                            />
                            <Field
                                label="Approval SLA"
                                defaultValue="60 minutes"
                                hint="Alerts fire when a request breaches this."
                            />
                        </div>

                        <div className="mt-4">
                            <ToggleRow
                                label="Escalate high-severity leaks immediately"
                                hint="Page the on-call operator instead of queueing."
                                on
                            />
                            <ToggleRow
                                label="Require dual approval above $5,000"
                                hint="A second reviewer must sign off."
                                on
                            />
                            <ToggleRow
                                label="Auto-pause agents on health degradation"
                                hint="Below 95% performance for 30 minutes."
                                on={false}
                            />
                        </div>
                    </PanelBody>
                </Panel>

                <Panel className="xl:col-span-6">
                    <PanelHeader title="Notifications" />
                    <PanelBody>
                        <ToggleRow
                            label="Critical alerts by email"
                            hint="Sent to the primary contact and on-call."
                            on
                        />
                        <ToggleRow
                            label="Daily digest"
                            hint="One summary at 08:00 local time."
                            on
                        />
                        <ToggleRow
                            label="Weekly executive summary"
                            hint="Delivered with the Monday report bundle."
                            on
                        />
                        <ToggleRow
                            label="Shadow ops discoveries"
                            hint="Notify as soon as a new manual process is found."
                            on={false}
                        />
                    </PanelBody>
                </Panel>

                <Panel className="xl:col-span-6">
                    <PanelHeader title="Integrations" />
                    <PanelBody className="space-y-1">
                        {INTEGRATIONS.map((integration) => (
                            <div
                                key={integration.name}
                                className="flex items-center justify-between gap-3 border-b border-up-line-soft py-2.5 last:border-0"
                            >
                                <div className="min-w-0">
                                    <p className="text-[13px] text-up-text">{integration.name}</p>
                                    <p className="mt-0.5 text-[11px] text-up-faint">
                                        {integration.detail}
                                    </p>
                                </div>
                                {integration.connected ? (
                                    <span className="inline-flex items-center gap-1.5 rounded-md border border-up-green/30 bg-up-green/12 px-2 py-1 text-[11px] font-semibold text-up-green">
                                        <Check className="h-3 w-3" />
                                        Connected
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        className="rounded-md border border-up-line bg-up-raise/60 px-2.5 py-1 text-[11px] font-medium text-up-dim transition-colors hover:border-up-primary/50 hover:text-up-text"
                                    >
                                        Connect
                                    </button>
                                )}
                            </div>
                        ))}
                    </PanelBody>
                </Panel>

                <Panel className="xl:col-span-12">
                    <PanelHeader title="Pipeline Engine" />
                    <PanelBody className="flex flex-wrap items-center justify-between gap-4">
                        <p className="max-w-2xl text-[13px] leading-relaxed text-up-dim">
                            Provider keys, timeouts, concurrency, and webhook configuration for the
                            agent pipeline live in the engine console.
                        </p>
                        <Link
                            href="/engine/settings"
                            className="inline-flex items-center gap-2 rounded-lg bg-up-primary px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-up-primary-deep"
                        >
                            Open engine settings
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </PanelBody>
                </Panel>
            </div>
        </>
    );
}
