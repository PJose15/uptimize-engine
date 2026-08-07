import Link from 'next/link';
import { ArrowRight, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sparkPath } from '@/lib/platform/format';
import type { AgentStatus, Health, LeakStatus, Severity, Tone, Trend } from '@/lib/platform/types';

/* -------------------------------------------------------------------------- */
/* Tone mapping                                                                */
/* -------------------------------------------------------------------------- */

export const TONE_HEX: Record<Tone, string> = {
    primary: '#7b5cff',
    gold: '#ffcd4a',
    green: '#2bd07c',
    red: '#f0526b',
    blue: '#4c9bff',
    pink: '#e362d8',
};

const TONE_TEXT: Record<Tone, string> = {
    primary: 'text-up-primary',
    gold: 'text-up-gold',
    green: 'text-up-green',
    red: 'text-up-red',
    blue: 'text-up-blue',
    pink: 'text-up-pink',
};

const TONE_SOFT_BG: Record<Tone, string> = {
    primary: 'bg-up-primary/12',
    gold: 'bg-up-gold/12',
    green: 'bg-up-green/12',
    red: 'bg-up-red/12',
    blue: 'bg-up-blue/12',
    pink: 'bg-up-pink/12',
};

const TONE_BORDER: Record<Tone, string> = {
    primary: 'border-up-primary/35',
    gold: 'border-up-gold/35',
    green: 'border-up-green/35',
    red: 'border-up-red/35',
    blue: 'border-up-blue/35',
    pink: 'border-up-pink/35',
};

export function toneText(tone: Tone) {
    return TONE_TEXT[tone];
}

export function toneSoftBg(tone: Tone) {
    return TONE_SOFT_BG[tone];
}

/* -------------------------------------------------------------------------- */
/* Panel                                                                       */
/* -------------------------------------------------------------------------- */

export function Panel({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <section
            className={cn(
                'flex flex-col rounded-xl border border-up-line bg-up-panel/90 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset]',
                className
            )}
        >
            {children}
        </section>
    );
}

export function PanelHeader({
    title,
    badge,
    action,
    actionHref,
    children,
}: {
    title: string;
    badge?: React.ReactNode;
    action?: string;
    actionHref?: string;
    children?: React.ReactNode;
}) {
    return (
        <header className="flex items-center justify-between gap-3 px-4 pb-3 pt-4">
            <div className="flex items-center gap-2.5">
                <h2 className="up-label text-up-dim">{title}</h2>
                {badge}
            </div>
            <div className="flex items-center gap-3">
                {children}
                {action && actionHref && (
                    <Link
                        href={actionHref}
                        className="group inline-flex items-center gap-1 text-xs font-medium text-up-primary transition-colors hover:text-up-text"
                    >
                        {action}
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                )}
            </div>
        </header>
    );
}

export function PanelBody({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return <div className={cn('flex-1 px-4 pb-4', className)}>{children}</div>;
}

export function PanelFooter({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={cn('mt-auto border-t border-up-line-soft px-4 py-3', className)}>
            {children}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Page heading                                                                */
/* -------------------------------------------------------------------------- */

export function PageHeading({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
}) {
    return (
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight text-up-text">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-up-dim">{subtitle}</p>}
            </div>
            {children && <div className="flex items-center gap-2">{children}</div>}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Status atoms                                                                */
/* -------------------------------------------------------------------------- */

const AGENT_STATUS: Record<AgentStatus, { label: string; dot: string; text: string }> = {
    active: { label: 'Active', dot: 'bg-up-green', text: 'text-up-green' },
    idle: { label: 'Idle', dot: 'bg-up-faint', text: 'text-up-faint' },
    paused: { label: 'Paused', dot: 'bg-up-gold', text: 'text-up-gold' },
    error: { label: 'Error', dot: 'bg-up-red', text: 'text-up-red' },
};

export function AgentStatusTag({ status }: { status: AgentStatus }) {
    const cfg = AGENT_STATUS[status];
    return (
        <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', cfg.text)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
            {cfg.label}
        </span>
    );
}

const HEALTH: Record<Health, { label: string; dot: string; text: string }> = {
    healthy: { label: 'Healthy', dot: 'bg-up-green', text: 'text-up-green' },
    watch: { label: 'Watch', dot: 'bg-up-gold', text: 'text-up-gold' },
    at_risk: { label: 'At Risk', dot: 'bg-up-red', text: 'text-up-red' },
    down: { label: 'Down', dot: 'bg-up-red', text: 'text-up-red' },
};

export function HealthDot({ health, withLabel = false }: { health: Health; withLabel?: boolean }) {
    const cfg = HEALTH[health];
    return (
        <span className={cn('inline-flex items-center gap-2 text-xs font-medium', cfg.text)}>
            <span className={cn('h-2 w-2 rounded-full', cfg.dot)} />
            {withLabel && cfg.label}
        </span>
    );
}

const SEVERITY: Record<Severity, string> = {
    high: 'border-up-red/35 bg-up-red/12 text-up-red',
    medium: 'border-up-gold/35 bg-up-gold/12 text-up-gold',
    low: 'border-up-blue/35 bg-up-blue/12 text-up-blue',
};

export function SeverityPill({ severity }: { severity: Severity }) {
    return (
        <span
            className={cn(
                'inline-flex min-w-[56px] justify-center rounded-md border px-1.5 py-0.5 text-[10.5px] font-semibold capitalize',
                SEVERITY[severity]
            )}
        >
            {severity}
        </span>
    );
}

const LEAK_STATUS: Record<LeakStatus, { label: string; className: string }> = {
    open: { label: 'Open', className: 'border-up-primary/35 bg-up-primary/12 text-up-primary' },
    investigating: {
        label: 'Investigating',
        className: 'border-up-gold/35 bg-up-gold/12 text-up-gold',
    },
    resolved: { label: 'Resolved', className: 'border-up-green/35 bg-up-green/12 text-up-green' },
};

export function LeakStatusPill({ status }: { status: LeakStatus }) {
    const cfg = LEAK_STATUS[status];
    return (
        <span
            className={cn(
                'inline-flex justify-center rounded-md border px-1.5 py-0.5 text-[10.5px] font-semibold',
                cfg.className
            )}
        >
            {cfg.label}
        </span>
    );
}

export function Pill({
    tone = 'primary',
    className,
    children,
}: {
    tone?: Tone;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold',
                TONE_TEXT[tone],
                TONE_SOFT_BG[tone],
                TONE_BORDER[tone],
                className
            )}
        >
            {children}
        </span>
    );
}

export function CountBadge({ value, tone = 'gold' }: { value: number; tone?: Tone }) {
    return (
        <span
            className={cn(
                'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold',
                tone === 'red' ? 'bg-up-red text-white' : 'bg-up-gold text-up-deep'
            )}
        >
            {value}
        </span>
    );
}

/* -------------------------------------------------------------------------- */
/* Deltas                                                                      */
/* -------------------------------------------------------------------------- */

export function Delta({
    trend,
    value,
    label,
    className,
}: {
    trend: Trend;
    value: string;
    label?: string;
    className?: string;
}) {
    const Icon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus;
    const color =
        trend === 'up' ? 'text-up-green' : trend === 'down' ? 'text-up-red' : 'text-up-faint';

    return (
        <span className={cn('inline-flex items-center gap-1 whitespace-nowrap text-[11px]', className)}>
            <Icon className={cn('h-3.5 w-3.5', color)} />
            <span className={cn('font-semibold up-num', color)}>{value}</span>
            {label && <span className="text-up-faint">{label}</span>}
        </span>
    );
}

/* -------------------------------------------------------------------------- */
/* Sparkline + score bar                                                       */
/* -------------------------------------------------------------------------- */

export function Sparkline({
    series,
    tone = 'primary',
    width = 76,
    height = 24,
    className,
}: {
    series: number[];
    tone?: Tone;
    width?: number;
    height?: number;
    className?: string;
}) {
    const path = sparkPath(series, width, height, 2);

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            width={width}
            height={height}
            fill="none"
            aria-hidden="true"
            className={cn('overflow-visible', className)}
        >
            <path
                d={path}
                stroke={TONE_HEX[tone]}
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

/** Performance score with the thin underline meter used across agent tables. */
export function ScoreMeter({ value, tone = 'green' }: { value: number; tone?: Tone }) {
    return (
        <div className="flex flex-col items-end gap-1">
            <span className="up-num text-[12.5px] font-medium text-up-text">{value.toFixed(1)}%</span>
            <span className="block h-[3px] w-14 overflow-hidden rounded-full bg-up-raise">
                <span
                    className="block h-full rounded-full"
                    style={{ width: `${Math.min(value, 100)}%`, backgroundColor: TONE_HEX[tone] }}
                />
            </span>
        </div>
    );
}

/** Horizontal progress bar used on ROI and workflow surfaces. */
export function Meter({
    value,
    tone = 'primary',
    className,
}: {
    value: number;
    tone?: Tone;
    className?: string;
}) {
    return (
        <span className={cn('block h-1.5 w-full overflow-hidden rounded-full bg-up-raise', className)}>
            <span
                className="block h-full rounded-full"
                style={{ width: `${Math.min(value, 100)}%`, backgroundColor: TONE_HEX[tone] }}
            />
        </span>
    );
}

/* -------------------------------------------------------------------------- */
/* Table primitives                                                            */
/* -------------------------------------------------------------------------- */

// Cells stay on one line — panels scroll horizontally instead of reflowing rows
// into different heights, which is what keeps the tables reading as a grid.
export const TH =
    'whitespace-nowrap px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-up-faint';
export const TD = 'whitespace-nowrap px-2 py-2.5 text-[12.5px] text-up-text';
export const TR = 'border-t border-up-line-soft transition-colors hover:bg-up-raise/40';

export function TableShell({
    children,
    fixed = false,
}: {
    children: React.ReactNode;
    /** Fixed layout + <colgroup> widths, for panels too narrow to auto-size. */
    fixed?: boolean;
}) {
    return (
        <div className="up-scroll overflow-x-auto">
            <table className={cn('w-full min-w-full border-collapse', fixed && 'table-fixed')}>
                {children}
            </table>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Misc                                                                        */
/* -------------------------------------------------------------------------- */

export function IconTile({
    tone = 'primary',
    className,
    children,
}: {
    tone?: Tone;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <span
            className={cn(
                'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/5',
                TONE_SOFT_BG[tone],
                TONE_TEXT[tone],
                className
            )}
        >
            {children}
        </span>
    );
}

/** Compact metric tile used at the top of secondary pages. */
export function StatTile({
    label,
    value,
    hint,
    tone = 'primary',
}: {
    label: string;
    value: string;
    hint?: string;
    tone?: Tone;
}) {
    return (
        <div className="rounded-xl border border-up-line bg-up-panel/90 px-4 py-3.5">
            <p className="up-label text-up-faint">{label}</p>
            <p className={cn('up-num mt-2 text-2xl font-semibold', TONE_TEXT[tone])}>{value}</p>
            {hint && <p className="mt-1 text-[11px] text-up-faint">{hint}</p>}
        </div>
    );
}

export function EmptyState({ message }: { message: string }) {
    return (
        <div className="rounded-lg border border-dashed border-up-line px-4 py-10 text-center text-sm text-up-faint">
            {message}
        </div>
    );
}
