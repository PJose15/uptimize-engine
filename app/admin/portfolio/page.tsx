'use client';

/**
 * Admin Portfolio Dashboard
 *
 * Renders the Sprint 14 portfolio model: retainer-weighted health, weekly
 * capacity against the 33.5h cap, cross-client patterns, and the client roster.
 */

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { MetricCard } from '@/components/dashboard';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Progress } from '@/components/ui';
import { usePortalData } from '@/app/portal/use-portal-data';
import { getCSRFToken } from '@/lib/auth-context';
import type { PortfolioClientView, PortfolioHealth, CapacityLoad } from '@/lib/portfolio';
import {
    AlertTriangle,
    ArrowLeft,
    Clock,
    DollarSign,
    HeartPulse,
    TrendingUp,
    Users,
} from 'lucide-react';

interface PortfolioResponse {
    health: PortfolioHealth;
    capacity: CapacityLoad;
    clients: PortfolioClientView[];
}

interface PatternRow {
    id: string;
    week_of: string;
    pattern_type: string;
    severity: 'info' | 'warning' | 'critical';
    description: string;
    affected_client_ids: string[];
    verticals_affected: string[];
    was_acted_on: boolean;
    notes: string | null;
}

interface PatternsResponse {
    detected_now: number;
    newly_recorded: number;
    patterns: PatternRow[];
}

const STAGE_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline'> = {
    onboarding: 'info',
    active: 'success',
    expansion: 'default',
    at_risk: 'error',
    churned: 'outline',
};

const SEVERITY_VARIANT: Record<string, 'warning' | 'error' | 'info'> = {
    info: 'info',
    warning: 'warning',
    critical: 'error',
};

function healthVariant(score: number): 'success' | 'warning' | 'error' {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
}

function formatUsd(value: number): string {
    return `$${Math.round(value).toLocaleString()}`;
}

export default function AdminPortfolioPage() {
    const { data, loading, error } = usePortalData<PortfolioResponse>('/api/admin/portfolio');
    const {
        data: patternData,
        loading: patternsLoading,
        refetch: refetchPatterns,
    } = usePortalData<PatternsResponse>('/api/admin/portfolio/patterns');

    const [updating, setUpdating] = useState<string | null>(null);

    const markActedOn = useCallback(async (id: string) => {
        setUpdating(id);
        try {
            const res = await fetch('/api/admin/portfolio/patterns', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCSRFToken() },
                body: JSON.stringify({ id, wasActedOn: true }),
            });
            if (res.ok) refetchPatterns();
        } finally {
            setUpdating(null);
        }
    }, [refetchPatterns]);

    if (loading) {
        return <div className="p-8 text-zinc-500">Loading portfolio…</div>;
    }

    if (error) {
        return (
            <div className="p-8">
                <p className="text-red-600 dark:text-red-400">Failed to load portfolio: {error}</p>
            </div>
        );
    }

    if (!data || data.clients.length === 0) {
        return (
            <div className="p-8 space-y-4">
                <h1 className="text-2xl font-bold">Portfolio</h1>
                <p className="text-zinc-500">
                    No portfolio clients yet. Populate ClientPortfolio from existing client configs with{' '}
                    <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm dark:bg-zinc-800">
                        npx tsx scripts/migrate-to-portfolio.ts
                    </code>
                    .
                </p>
            </div>
        );
    }

    const { health, capacity, clients } = data;
    const openPatterns = (patternData?.patterns ?? []).filter(p => !p.was_acted_on);

    return (
        <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <Link
                        href="/"
                        className="mb-2 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight">Portfolio</h1>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Portfolio health"
                    value={health.weighted_score_0_100}
                    subtitle={`Retainer-weighted · simple avg ${health.simple_avg_score_0_100}`}
                    icon={HeartPulse}
                />
                <MetricCard
                    title="Monthly recurring"
                    value={formatUsd(health.total_mrr_usd)}
                    subtitle={`${health.total_active_clients} active clients`}
                    icon={DollarSign}
                />
                <MetricCard
                    title="Weekly load"
                    value={`${capacity.total_hours_committed}h`}
                    subtitle={`${Math.round(capacity.utilization_pct)}% of ${capacity.capacity_hours}h capacity`}
                    icon={Clock}
                />
                <MetricCard
                    title="Expansion ready"
                    value={health.expansion_ready_count}
                    subtitle={`${health.at_risk_count} at risk`}
                    icon={TrendingUp}
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Clock className="h-4 w-4" /> Capacity
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Progress value={Math.min(100, capacity.utilization_pct)} />
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className="text-zinc-500">
                            {capacity.total_hours_committed}h committed of {capacity.capacity_hours}h
                        </span>
                        {capacity.is_overloaded && (
                            <Badge variant="error">
                                Over by {capacity.over_capacity_hours.toFixed(1)}h
                            </Badge>
                        )}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {capacity.per_client.map(entry => (
                            <div
                                key={entry.client_id}
                                className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
                            >
                                <span className="truncate">{entry.client_id}</span>
                                <span className="text-zinc-500">{entry.hours}h · {entry.stage}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <AlertTriangle className="h-4 w-4" /> Cross-client patterns
                        {openPatterns.length > 0 && (
                            <Badge variant="warning">{openPatterns.length} open</Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {patternsLoading && <p className="text-sm text-zinc-500">Detecting…</p>}

                    {!patternsLoading && openPatterns.length === 0 && (
                        <p className="text-sm text-zinc-500">
                            No open patterns. Detection runs against current portfolio state on each load.
                        </p>
                    )}

                    <div className="space-y-3">
                        {openPatterns.map(pattern => (
                            <div
                                key={pattern.id}
                                className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                            >
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                    <Badge variant={SEVERITY_VARIANT[pattern.severity] ?? 'info'}>
                                        {pattern.severity}
                                    </Badge>
                                    <span className="text-sm font-medium">
                                        {pattern.pattern_type.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-xs text-zinc-500">{pattern.week_of}</span>
                                </div>
                                <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
                                    {pattern.description}
                                </p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-zinc-500">
                                        {pattern.affected_client_ids.length} client
                                        {pattern.affected_client_ids.length === 1 ? '' : 's'}
                                        {pattern.verticals_affected.length > 0 &&
                                            ` · ${pattern.verticals_affected.join(', ')}`}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={updating === pattern.id}
                                        onClick={() => markActedOn(pattern.id)}
                                    >
                                        {updating === pattern.id ? 'Saving…' : 'Mark acted on'}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Users className="h-4 w-4" /> Clients
                    </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
                                <th className="pb-2 pr-4 font-medium">Client</th>
                                <th className="pb-2 pr-4 font-medium">Vertical</th>
                                <th className="pb-2 pr-4 font-medium">Stage</th>
                                <th className="pb-2 pr-4 font-medium">Health</th>
                                <th className="pb-2 pr-4 font-medium">Trend</th>
                                <th className="pb-2 pr-4 font-medium">Retainer</th>
                                <th className="pb-2 font-medium">Flags</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.map(client => (
                                <tr
                                    key={client.client_id}
                                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                                >
                                    <td className="py-2 pr-4">
                                        <div className="font-medium">
                                            {client.client_name ?? client.client_id}
                                        </div>
                                        {client.client_name && (
                                            <div className="text-xs text-zinc-500">{client.client_id}</div>
                                        )}
                                    </td>
                                    <td className="py-2 pr-4 text-zinc-500">{client.vertical || '—'}</td>
                                    <td className="py-2 pr-4">
                                        <Badge variant={STAGE_VARIANT[client.stage] ?? 'outline'}>
                                            {client.stage.replace(/_/g, ' ')}
                                        </Badge>
                                    </td>
                                    <td className="py-2 pr-4">
                                        <Badge variant={healthVariant(client.current_health_score)}>
                                            {client.current_health_score}
                                        </Badge>
                                    </td>
                                    <td className="py-2 pr-4 text-zinc-500">{client.health_trend ?? 'stable'}</td>
                                    <td className="py-2 pr-4">{formatUsd(client.retainer_usd)}</td>
                                    <td className="py-2">
                                        <div className="flex flex-wrap gap-1">
                                            {client.expansion_ready && (
                                                <Badge variant="default">expansion</Badge>
                                            )}
                                            {client.has_open_alert && (
                                                <Badge variant="error">
                                                    {client.alert_severity ?? 'alert'}
                                                </Badge>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}
