'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    className?: string;
}

export function MetricCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    className
}: MetricCardProps) {
    return (
        <Card className={cn("relative overflow-hidden", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    {title}
                </CardTitle>
                {Icon && (
                    <div className="rounded-lg bg-gradient-to-br from-violet-500/10 to-indigo-500/10 p-2">
                        <Icon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold tracking-tight">{value}</div>
                <div className="flex items-center gap-2 mt-1">
                    {subtitle && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
                    )}
                    {trend && (
                        <span className={cn(
                            "text-xs font-medium",
                            trend.isPositive ? "text-emerald-600" : "text-red-600"
                        )}>
                            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                        </span>
                    )}
                </div>
            </CardContent>
            {/* Decorative gradient */}
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-violet-500/5 to-indigo-500/5" />
        </Card>
    );
}
