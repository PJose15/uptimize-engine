import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface HistoryPoint {
  weekOf: string;
  score: number;
}

function parseHistory(raw: string): HistoryPoint[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(p => p && typeof p.score === 'number') : [];
  } catch {
    return [];
  }
}

export default async function ClientDetail({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  const [portfolio, config] = await Promise.all([
    prisma.clientPortfolio.findUnique({ where: { clientId } }),
    prisma.clientConfig.findUnique({
      where: { clientId },
      select: { name: true, company: true, industry: true, agentName: true, agentStatus: true },
    }),
  ]);

  if (!portfolio) notFound();

  const history = parseHistory(portfolio.healthScoreHistory);
  const displayName = config?.name || config?.company || portfolio.clientId;

  const trendArrow =
    portfolio.healthTrend === 'improving' ? '↑' : portfolio.healthTrend === 'declining' ? '↓' : '→';
  const trendColor =
    portfolio.healthTrend === 'improving'
      ? 'text-emerald-500'
      : portfolio.healthTrend === 'declining'
      ? 'text-rose-500'
      : 'text-zinc-400';

  return (
    <div className="p-8 max-w-5xl">
      <Link
        href="/portfolio"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-violet-600 dark:hover:text-violet-400 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to portfolio
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{displayName}</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          {portfolio.clientId} · {portfolio.vertical || 'no vertical'} · {portfolio.stage}
          {config?.agentName && (
            <>
              {' · '}
              <span className="text-violet-600 dark:text-violet-400">{config.agentName}</span>
              {config.agentStatus !== 'active' && (
                <span className="ml-1 text-xs text-amber-600">({config.agentStatus})</span>
              )}
            </>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Health Score" value={`${portfolio.currentHealthScore}/100`}>
          <span className={`text-sm ${trendColor}`}>
            {trendArrow} from {portfolio.previousHealthScore}
          </span>
        </StatCard>
        <StatCard label="MRR" value={`$${portfolio.retainerUsd.toLocaleString()}`} />
        <StatCard label="Weekly Hours" value={portfolio.weeklyHoursEstimate.toFixed(1)} />
        <StatCard
          label="Start Date"
          value={new Date(portfolio.startDate).toLocaleDateString()}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Expansion</h2>
          {portfolio.expansionReady ? (
            <div className="space-y-2 text-sm">
              <Row label="Status" value="Ready" valueClass="text-violet-600 dark:text-violet-400 font-semibold" />
              {portfolio.expansionReadySince && (
                <Row
                  label="Ready since"
                  value={new Date(portfolio.expansionReadySince).toLocaleDateString()}
                />
              )}
              {portfolio.expansionStage && <Row label="Stage" value={portfolio.expansionStage} />}
              {portfolio.expansionValueUsd > 0 && (
                <Row label="Estimated value" value={`$${portfolio.expansionValueUsd.toLocaleString()}`} />
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">Not currently expansion-ready.</p>
          )}
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Alerts</h2>
          {portfolio.hasOpenAlert ? (
            <div className="space-y-2 text-sm">
              {portfolio.alertSeverity && (
                <span
                  className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
                    portfolio.alertSeverity === 'P1'
                      ? 'bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300'
                      : portfolio.alertSeverity === 'P2'
                      ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {portfolio.alertSeverity}
                </span>
              )}
              {portfolio.alertDescription && (
                <p className="text-zinc-700 dark:text-zinc-300">{portfolio.alertDescription}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No open alerts.</p>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Health Score History
          </h2>
          <div className="flex items-end gap-2 h-32">
            {history.map((point, i) => {
              const maxVal = Math.max(100, ...history.map(p => p.score));
              const height = (point.score / maxVal) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <span className="text-[10px] text-zinc-500 font-medium">{point.score}</span>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-violet-500 to-indigo-400"
                    style={{ height: `${height}%`, minHeight: '4px' }}
                  />
                  <span className="text-[9px] text-zinc-400 truncate w-full text-center">{point.weekOf}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
      <p className="text-xs uppercase text-zinc-500 mb-2">{label}</p>
      <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
      {children && <div className="mt-1">{children}</div>}
    </div>
  );
}

function Row({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className={valueClass ?? 'text-zinc-900 dark:text-zinc-100'}>{value}</span>
    </div>
  );
}
