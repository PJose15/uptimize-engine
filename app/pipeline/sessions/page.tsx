'use client';

import { useState } from 'react';
import { usePortalData } from '@/app/portal/use-portal-data';
import { Button, Badge } from '@/components/ui';
import { Plus, Loader2, FolderOpen, Archive } from 'lucide-react';
import Link from 'next/link';

interface SessionSummary {
  id: string;
  sessionId: string;
  label: string;
  status: string;
  currentStage: number;
  totalCost: number;
  createdAt: string;
  updatedAt: string;
  hasAgent1Output: boolean;
  hasAgent2Output: boolean;
  hasAgent3Output: boolean;
  hasAgent4Output: boolean;
  hasAgent5Output: boolean;
}

const STATUS_BADGE: Record<string, { variant: 'default' | 'success' | 'warning' | 'error' | 'outline'; label: string }> = {
  active: { variant: 'default', label: 'Active' },
  paused: { variant: 'warning', label: 'Paused' },
  completed: { variant: 'success', label: 'Completed' },
  archived: { variant: 'outline', label: 'Archived' },
};

export default function PipelineSessionsPage() {
  const [filter, setFilter] = useState<string>('active');
  const url = filter ? `/api/pipeline/sessions?status=${filter}` : '/api/pipeline/sessions';
  const { data, loading, error } = usePortalData<SessionSummary[]>(url);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Pipeline Sessions</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Stage-by-stage client journeys through the 5-agent pipeline
          </p>
        </div>
        <Link href="/pipeline/sessions/new">
          <Button>
            <Plus className="h-4 w-4 mr-1.5" />
            New Session
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        {['active', 'completed', 'paused', 'archived', ''].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === status
                ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            {status || 'All'}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && data?.length === 0 && (
        <div className="text-center py-16">
          <FolderOpen className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">No sessions found</p>
          <Link href="/pipeline/sessions/new">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-1.5" />
              Create Your First Session
            </Button>
          </Link>
        </div>
      )}

      {/* Session List */}
      {data && data.length > 0 && (
        <div className="space-y-3">
          {data.map(session => {
            const badge = STATUS_BADGE[session.status] ?? STATUS_BADGE.active;
            const stageProgress = [
              session.hasAgent1Output,
              session.hasAgent2Output,
              session.hasAgent3Output,
              session.hasAgent4Output,
              session.hasAgent5Output,
            ];
            const completedStages = stageProgress.filter(Boolean).length;

            return (
              <Link
                key={session.id}
                href={`/pipeline/sessions/${session.id}`}
                className="block bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate">{session.label}</h3>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Created {new Date(session.createdAt).toLocaleDateString()} &middot; Stage {session.currentStage}/5
                    </p>
                  </div>

                  <div className="flex items-center gap-4 ml-4">
                    {/* Stage dots */}
                    <div className="flex items-center gap-1">
                      {stageProgress.map((done, i) => (
                        <div
                          key={i}
                          className={`h-2 w-2 rounded-full ${
                            done
                              ? 'bg-emerald-500'
                              : i === completedStages
                                ? 'bg-violet-500'
                                : 'bg-zinc-200 dark:bg-zinc-700'
                          }`}
                        />
                      ))}
                    </div>

                    {session.totalCost > 0 && (
                      <span className="text-xs font-mono text-zinc-400">
                        ${session.totalCost.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
