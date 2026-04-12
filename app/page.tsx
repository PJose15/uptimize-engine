'use client';

import {
  MetricCard,
  AgentCard,
  AgentPerformanceChart,
  PipelineHistoryChart,
  LeadDistributionChart,
  PipelineFlow,
  type AgentStatus
} from '@/components/dashboard';
import { Button } from '@/components/ui';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { usePortalPolling } from '@/lib/use-portal-polling';
import {
  Activity,
  Users,
  Zap,
  Clock,
  Play,
  ArrowRight,
  History,
  FileText,
  GitCompare,
  Settings,
  LogOut
} from 'lucide-react';

interface DashboardStats {
  metrics: {
    totalSessions: number;
    completedSessions: number;
    successRate: number;
    avgCost: number;
    agentRuns: {
      agent1Runs: number;
      agent2Runs: number;
      agent3Runs: number;
      agent4Runs: number;
      agent5Runs: number;
    };
  };
  pipelineHistory: { name: string; value: number }[];
  agentPerformance: { name: string; value: number }[];
  leadDistribution: { name: string; value: number }[];
  recentAgents: {
    agentNumber: number;
    name: string;
    description: string;
    status: AgentStatus;
    duration?: number;
    outputPreview: string;
  }[];
  pipelineAgents: {
    id: number;
    name: string;
    status: AgentStatus;
  }[];
}

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { data: stats, loading: statsLoading, error: statsError, refetch } = usePortalPolling<DashboardStats>('/api/agents/stats', 15000);

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
      </div>
    );
  }

  // Auth redirect is handled by AuthProvider
  if (!user) {
    return null;
  }

  const isLoading = statsLoading || !stats;

  // Defaults for when data hasn't loaded yet
  const metrics = stats?.metrics;
  const pipelineHistory = stats?.pipelineHistory ?? [];
  const agentPerformance = stats?.agentPerformance ?? [];
  const leadDistribution = stats?.leadDistribution ?? [];
  const recentAgents = stats?.recentAgents ?? [];
  const pipelineAgents = stats?.pipelineAgents ?? [
    { id: 1, name: 'Market Intel', status: 'pending' as AgentStatus },
    { id: 2, name: 'Outbound', status: 'pending' as AgentStatus },
    { id: 3, name: 'Sales', status: 'pending' as AgentStatus },
    { id: 4, name: 'Delivery', status: 'pending' as AgentStatus },
    { id: 5, name: 'Success', status: 'pending' as AgentStatus },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Uptimize Engine</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Welcome, {user.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/history">
              <Button variant="ghost" size="sm">
                <History className="h-4 w-4 mr-1" />
                History
              </Button>
            </Link>
            <Link href="/templates">
              <Button variant="ghost" size="sm">
                <FileText className="h-4 w-4 mr-1" />
                Templates
              </Button>
            </Link>
            <Link href="/compare">
              <Button variant="ghost" size="sm">
                <GitCompare className="h-4 w-4 mr-1" />
                Compare
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Button>
            </Link>
            <Link href="/results">
              <Button variant="outline">
                What Gets Produced?
              </Button>
            </Link>
            <Link href="/pipeline">
              <Button>
                <Play className="h-4 w-4 mr-2" />
                Run Pipeline
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Error Banner */}
        {statsError && !stats && !statsLoading && (
          <div className="mb-6 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 flex items-center justify-between">
            <p className="text-sm text-red-700 dark:text-red-300">Failed to load dashboard data: {statsError}</p>
            <button
              onClick={refetch}
              className="text-sm font-medium text-red-700 dark:text-red-300 hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Pipeline Flow */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">Pipeline Status</h2>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
            <PipelineFlow agents={pipelineAgents} />
          </div>
        </section>

        {/* Metrics Grid */}
        {isLoading ? (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            ))}
          </section>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard
              title="Total Runs"
              value={metrics?.totalSessions ?? 0}
              subtitle="All sessions"
              icon={Activity}
            />
            <MetricCard
              title="Completed"
              value={metrics?.completedSessions ?? 0}
              subtitle="Pipeline completions"
              icon={Users}
            />
            <MetricCard
              title="Avg. Cost"
              value={`$${(metrics?.avgCost ?? 0).toFixed(2)}`}
              subtitle="Per session"
              icon={Clock}
            />
            <MetricCard
              title="Success Rate"
              value={`${metrics?.successRate ?? 0}%`}
              subtitle="Pipeline completions"
              icon={Zap}
            />
          </section>
        )}

        {/* Charts Grid */}
        {isLoading ? (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-[280px] rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            ))}
          </section>
        ) : (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            <PipelineHistoryChart data={pipelineHistory} />
            <AgentPerformanceChart data={agentPerformance} />
            <LeadDistributionChart data={leadDistribution} />
          </section>
        )}

        {/* Recent Agent Runs */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Recent Agent Runs</h2>
            <Link href="/results" className="text-sm text-violet-600 dark:text-violet-400 hover:underline">
              View all →
            </Link>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-40 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
              ))}
            </div>
          ) : recentAgents.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
              <Activity className="h-8 w-8 mx-auto mb-2 text-zinc-300 dark:text-zinc-600" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No data yet. Run a pipeline to see agent results.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentAgents.map((agent) => (
                <AgentCard key={agent.agentNumber} {...agent} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
