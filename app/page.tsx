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

// Sample data - in real app this would come from API
const pipelineHistory = [
  { name: 'Mon', value: 3 },
  { name: 'Tue', value: 5 },
  { name: 'Wed', value: 2 },
  { name: 'Thu', value: 8 },
  { name: 'Fri', value: 6 },
  { name: 'Sat', value: 4 },
  { name: 'Sun', value: 7 },
];

const agentPerformance = [
  { name: 'Agent 5', value: 149 },
  { name: 'Agent 4', value: 45 },
  { name: 'Agent 3', value: 53 },
  { name: 'Agent 2', value: 43 },
  { name: 'Agent 1', value: 41 },
];

const leadDistribution = [
  { name: 'High Fit', value: 3 },
  { name: 'Medium', value: 2 },
  { name: 'Low', value: 0 },
];

const agents = [
  { id: 1, name: 'Market Intel', status: 'success' as AgentStatus },
  { id: 2, name: 'Outbound', status: 'success' as AgentStatus },
  { id: 3, name: 'Sales', status: 'success' as AgentStatus },
  { id: 4, name: 'Delivery', status: 'success' as AgentStatus },
  { id: 5, name: 'Success', status: 'success' as AgentStatus },
];

const recentAgents: Array<{
  agentNumber: number;
  name: string;
  description: string;
  status: AgentStatus;
  duration: number;
  outputPreview: string;
}> = [
    {
      agentNumber: 1,
      name: 'Market Intelligence',
      description: 'Analyze leads, score by fit',
      status: 'success',
      duration: 40984,
      outputPreview: '{"target_pack_primary": [{"name": "Sarah Chen", "fit_score": 87}...]',
    },
    {
      agentNumber: 2,
      name: 'Outbound & Appointment',
      description: 'Generate campaigns, book meetings',
      status: 'success',
      duration: 43372,
      outputPreview: '{"message_library": [{"lead_id": "lead_001", "track_messages": {...}}...]',
    },
    {
      agentNumber: 3,
      name: 'Sales Engineer',
      description: 'Discovery, proposals, SOW',
      status: 'success',
      duration: 52508,
      outputPreview: '{"shadow_ops_map": {"top_invisible_tasks": [...]}, "value_calc": {...}}',
    },
  ];

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
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
        {/* Pipeline Flow */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">Pipeline Status</h2>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
            <PipelineFlow agents={agents} />
          </div>
        </section>

        {/* Metrics Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Total Runs"
            value="35"
            subtitle="Last 7 days"
            icon={Activity}
            trend={{ value: 12, isPositive: true }}
          />
          <MetricCard
            title="Leads Analyzed"
            value="175"
            subtitle="Across all runs"
            icon={Users}
            trend={{ value: 8, isPositive: true }}
          />
          <MetricCard
            title="Avg. Pipeline Time"
            value="5.5m"
            subtitle="All 5 agents"
            icon={Clock}
          />
          <MetricCard
            title="Success Rate"
            value="94%"
            subtitle="Pipeline completions"
            icon={Zap}
            trend={{ value: 2, isPositive: true }}
          />
        </section>

        {/* Charts Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <PipelineHistoryChart data={pipelineHistory} />
          <AgentPerformanceChart data={agentPerformance} />
          <LeadDistributionChart data={leadDistribution} />
        </section>

        {/* Recent Agent Runs */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Recent Agent Runs</h2>
            <Link href="/results" className="text-sm text-violet-600 dark:text-violet-400 hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentAgents.map((agent) => (
              <AgentCard key={agent.agentNumber} {...agent} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
