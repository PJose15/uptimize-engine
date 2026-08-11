import Link from 'next/link';
import { loadPortfolioClients } from '@/lib/portfolio/portfolio-loader';
import {
  calculatePortfolioHealthScore,
  calculateWeeklyLoad,
  WEEKLY_CAPACITY_HOURS,
  type PortfolioClientView,
} from '@/lib/portfolio/portfolio-health';
import { detectPortfolioPatterns, type DetectedPattern } from '@/lib/portfolio/portfolio-patterns';

export const dynamic = 'force-dynamic';

export default async function PortfolioOverview() {
  const clients = await loadPortfolioClients();

  if (clients.length === 0) {
    return (
      <div className="p-8 max-w-3xl">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Portfolio</h1>
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center">
          <p className="text-zinc-700 dark:text-zinc-300 font-medium">No clients in portfolio yet</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            Run{' '}
            <code className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-xs">
              npx tsx scripts/migrate-to-portfolio.ts
            </code>{' '}
            to populate from existing ClientConfig rows.
          </p>
        </div>
      </div>
    );
  }

  const health = calculatePortfolioHealthScore(clients);
  const load = calculateWeeklyLoad(clients);
  const patterns = detectPortfolioPatterns(clients);

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Portfolio</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          {health.total_active_clients} active clients · ${health.total_mrr_usd.toLocaleString()} MRR
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Portfolio Health"
          value={health.weighted_score_0_100}
          suffix="/100"
          color={health.weighted_score_0_100 >= 80 ? 'emerald' : health.weighted_score_0_100 >= 60 ? 'amber' : 'rose'}
        />
        <MetricCard
          label="At Risk"
          value={health.at_risk_count}
          color={health.at_risk_count === 0 ? 'emerald' : 'rose'}
        />
        <MetricCard
          label="Expansion Ready"
          value={health.expansion_ready_count}
          color="violet"
        />
        <MetricCard
          label="Capacity"
          value={Math.round(load.utilization_pct)}
          suffix="%"
          color={load.is_overloaded ? 'rose' : load.utilization_pct > 85 ? 'amber' : 'emerald'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Weekly Capacity</h2>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {load.total_hours_committed.toFixed(1)}
            </span>
            <span className="text-zinc-500">/ {WEEKLY_CAPACITY_HOURS} hrs</span>
          </div>
          <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                load.is_overloaded
                  ? 'bg-rose-500'
                  : load.utilization_pct > 85
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, load.utilization_pct)}%` }}
            />
          </div>
          {load.is_overloaded && (
            <p className="text-sm text-rose-600 dark:text-rose-400 mt-3">
              Over capacity by {load.over_capacity_hours.toFixed(1)} hours. Consider rebalancing or
              pausing onboarding.
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Health Distribution</h2>
          <div className="space-y-3">
            <DistRow label="Healthy (80+)" count={health.health_distribution.healthy} color="bg-emerald-500" />
            <DistRow label="Watch (60–79)" count={health.health_distribution.watch} color="bg-amber-500" />
            <DistRow label="At Risk (<60)" count={health.health_distribution.at_risk} color="bg-rose-500" />
          </div>
        </div>
      </div>

      {patterns.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
            Patterns ({patterns.length})
          </h2>
          <div className="space-y-2">
            {patterns.map((p, i) => (
              <PatternCard key={i} pattern={p} />
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Clients</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="text-left px-6 py-3">Client</th>
              <th className="text-left px-6 py-3">Vertical</th>
              <th className="text-left px-6 py-3">Stage</th>
              <th className="text-right px-6 py-3">Health</th>
              <th className="text-right px-6 py-3">MRR</th>
              <th className="text-right px-6 py-3">Hrs/wk</th>
              <th className="text-left px-6 py-3">Flags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {clients.map(c => (
              <ClientRow key={c.client_id} client={c} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  suffix,
  color,
}: {
  label: string;
  value: number;
  suffix?: string;
  color: 'violet' | 'emerald' | 'amber' | 'rose';
}) {
  const colorMap: Record<string, string> = {
    violet: 'from-violet-500 to-indigo-600',
    emerald: 'from-emerald-500 to-teal-600',
    amber: 'from-amber-500 to-orange-600',
    rose: 'from-rose-500 to-pink-600',
  };
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${colorMap[color]} p-5 text-white shadow-lg`}>
      <p className="text-3xl font-bold">
        {value}
        {suffix && <span className="text-lg font-normal ml-1 opacity-80">{suffix}</span>}
      </p>
      <p className="text-sm text-white/80 mt-1">{label}</p>
    </div>
  );
}

function DistRow({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${color}`} />
        <span className="text-zinc-700 dark:text-zinc-300">{label}</span>
      </div>
      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{count}</span>
    </div>
  );
}

function PatternCard({ pattern }: { pattern: DetectedPattern }) {
  const sevColor =
    pattern.severity === 'critical'
      ? 'border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-500/10'
      : pattern.severity === 'warning'
      ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-500/10'
      : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50';
  return (
    <div className={`rounded-xl border p-4 ${sevColor}`}>
      <div className="flex items-start justify-between mb-1">
        <span className="text-xs font-semibold uppercase text-zinc-500">{pattern.pattern_type.replace(/_/g, ' ')}</span>
        <span className="text-xs text-zinc-500">{pattern.week_of}</span>
      </div>
      <p className="text-sm text-zinc-900 dark:text-zinc-100">{pattern.description}</p>
      {pattern.affected_client_ids.length > 0 && (
        <p className="text-xs text-zinc-500 mt-1">
          {pattern.affected_client_ids.length} clients · {pattern.verticals_affected.join(', ') || '—'}
        </p>
      )}
    </div>
  );
}

function ClientRow({ client }: { client: PortfolioClientView }) {
  const healthColor =
    client.current_health_score >= 80
      ? 'text-emerald-600 dark:text-emerald-400'
      : client.current_health_score >= 60
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-rose-600 dark:text-rose-400';

  const stageColor: Record<string, string> = {
    onboarding: 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300',
    active: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    expansion: 'bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300',
    at_risk: 'bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300',
    churned: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500',
  };

  return (
    <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
      <td className="px-6 py-4">
        <Link
          href={`/portfolio/${client.client_id}`}
          className="font-medium text-zinc-900 dark:text-zinc-100 hover:text-violet-600 dark:hover:text-violet-400"
        >
          {client.client_name || client.client_id}
        </Link>
        <div className="text-xs text-zinc-500">{client.client_id}</div>
      </td>
      <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">{client.vertical || '—'}</td>
      <td className="px-6 py-4">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${stageColor[client.stage]}`}>
          {client.stage}
        </span>
      </td>
      <td className={`px-6 py-4 text-right font-semibold ${healthColor}`}>
        {client.current_health_score}
        {client.health_trend === 'improving' && <span className="ml-1 text-emerald-500">↑</span>}
        {client.health_trend === 'declining' && <span className="ml-1 text-rose-500">↓</span>}
      </td>
      <td className="px-6 py-4 text-right text-zinc-700 dark:text-zinc-300">
        ${client.retainer_usd.toLocaleString()}
      </td>
      <td className="px-6 py-4 text-right text-zinc-700 dark:text-zinc-300">
        {client.weekly_hours_estimate?.toFixed(1) ?? '—'}
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1">
          {client.expansion_ready && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300">
              expansion
            </span>
          )}
          {client.has_open_alert && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300">
              {client.alert_severity ?? 'alert'}
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}
