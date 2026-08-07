'use client';

import {
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { money } from '@/lib/platform/format';
import type { TrendPoint } from '@/lib/platform/types';

const AXIS = { fill: '#6b6684', fontSize: 11 };
const GRID = '#1b1830';

/* -------------------------------------------------------------------------- */
/* Tooltip                                                                     */
/* -------------------------------------------------------------------------- */

interface TooltipEntry {
    name?: string;
    value?: number | string;
    color?: string;
    dataKey?: string | number;
}

function DarkTooltip({
    active,
    payload,
    label,
    format,
}: {
    active?: boolean;
    payload?: TooltipEntry[];
    label?: string | number;
    format?: (value: number) => string;
}) {
    if (!active || !payload?.length) return null;

    return (
        <div className="rounded-lg border border-up-line bg-up-deep/95 px-3 py-2 shadow-xl backdrop-blur">
            {label !== undefined && (
                <p className="mb-1.5 text-xs font-medium text-up-text">{label}, 2025</p>
            )}
            <ul className="space-y-1">
                {payload.map((entry, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs">
                        <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-up-dim">{entry.name}</span>
                        <span className="up-num ml-auto font-semibold text-up-text">
                            {format ? format(Number(entry.value)) : entry.value}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Revenue & savings trend                                                     */
/* -------------------------------------------------------------------------- */

export function TrendChart({ data, height = 220 }: { data: TrendPoint[]; height?: number }) {
    return (
        <div style={{ height }} className="w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                    <CartesianGrid stroke={GRID} strokeDasharray="3 4" vertical={false} />
                    <XAxis
                        dataKey="date"
                        tick={AXIS}
                        tickLine={false}
                        axisLine={{ stroke: GRID }}
                        dy={6}
                    />
                    <YAxis
                        tick={AXIS}
                        tickLine={false}
                        axisLine={false}
                        width={56}
                        domain={[0, 3]}
                        ticks={[0, 1, 2, 3]}
                        tickFormatter={(value: number) => `$${value.toFixed(1)}M`}
                    />
                    <Tooltip
                        cursor={{ stroke: '#3a3159', strokeWidth: 1 }}
                        content={
                            <DarkTooltip format={(value) => `$${Number(value).toFixed(2)}M`} />
                        }
                    />
                    <Line
                        type="monotone"
                        dataKey="revenueProtected"
                        name="Revenue Protected"
                        stroke="#7c5cff"
                        strokeWidth={2.2}
                        dot={{ r: 3, fill: '#7c5cff', strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: '#7c5cff', stroke: '#0a0912', strokeWidth: 2 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="moneySaved"
                        name="Money Saved"
                        stroke="#f5b301"
                        strokeWidth={2.2}
                        dot={{ r: 3, fill: '#f5b301', strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: '#f5b301', stroke: '#0a0912', strokeWidth: 2 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Donut                                                                       */
/* -------------------------------------------------------------------------- */

export interface DonutSlice {
    name: string;
    value: number;
    color: string;
}

export function DonutChart({
    slices,
    centerValue,
    centerLabel,
    size = 200,
    thickness = 26,
    valueFormat = 'number',
}: {
    slices: DonutSlice[];
    centerValue: string;
    centerLabel: string;
    size?: number;
    thickness?: number;
    /** Named formatter — a function prop cannot cross the server/client boundary. */
    valueFormat?: 'number' | 'money';
}) {
    const outer = size / 2 - 4;
    const format = valueFormat === 'money' ? money : undefined;

    return (
        <div className="relative mx-auto" style={{ width: size, height: size }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={slices}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={outer - thickness}
                        outerRadius={outer}
                        paddingAngle={1.5}
                        startAngle={90}
                        endAngle={-270}
                        stroke="none"
                    >
                        {slices.map((slice) => (
                            <Cell key={slice.name} fill={slice.color} />
                        ))}
                    </Pie>
                    <Tooltip content={<DarkTooltip format={format} />} />
                </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="up-num text-2xl font-semibold text-up-text">{centerValue}</span>
                <span className="mt-0.5 text-xs text-up-faint">{centerLabel}</span>
            </div>
        </div>
    );
}
