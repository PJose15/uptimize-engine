import {
    Activity,
    Bot,
    Clock,
    DollarSign,
    Network,
    ShieldCheck,
    type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Kpi, KpiIcon } from '@/lib/platform/types';
import { Delta, TONE_HEX } from './ui';

const ICONS: Record<KpiIcon, LucideIcon> = {
    shield: ShieldCheck,
    dollar: DollarSign,
    clock: Clock,
    bot: Bot,
    network: Network,
    pulse: Activity,
};

function KpiCell({ kpi }: { kpi: Kpi }) {
    const Icon = ICONS[kpi.icon];
    const hex = TONE_HEX[kpi.tone];

    return (
        <div className="flex min-w-0 items-center gap-3 px-4 py-4">
            <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: `${hex}1f`, color: hex, boxShadow: `0 0 0 1px ${hex}2e` }}
            >
                <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
            </span>

            <div className="min-w-0">
                <p className="up-label whitespace-nowrap text-[10px] tracking-[0.07em] text-up-faint">
                    {kpi.label}
                </p>
                <p className="mt-1 flex items-baseline gap-1">
                    <span className="up-num text-[26px] font-semibold leading-none text-up-text">
                        {kpi.value}
                    </span>
                    {kpi.unit && (
                        <span className="up-num text-[17px] font-medium leading-none text-up-dim">
                            {kpi.unit}
                        </span>
                    )}
                    {kpi.of && (
                        <span className="up-num text-[15px] font-medium leading-none text-up-faint">
                            {kpi.of}
                        </span>
                    )}
                </p>
                <div className="mt-1.5 whitespace-nowrap">
                    {kpi.note ? (
                        <span className="text-[11px] font-semibold text-up-green">{kpi.note}</span>
                    ) : (
                        <Delta trend={kpi.trend} value={kpi.delta} label={kpi.deltaLabel} />
                    )}
                </div>
            </div>
        </div>
    );
}

export function KpiStrip({ kpis, className }: { kpis: Kpi[]; className?: string }) {
    return (
        // gap-px over the line colour paints the hairline dividers, so the strip
        // stays seamless at every breakpoint without per-cell border juggling.
        <div
            className={cn(
                'grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-up-line bg-up-line sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
                className
            )}
        >
            {kpis.map((kpi) => (
                <div key={kpi.id} className="bg-up-panel">
                    <KpiCell kpi={kpi} />
                </div>
            ))}
        </div>
    );
}
