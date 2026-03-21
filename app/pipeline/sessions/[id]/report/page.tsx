'use client';

import { useParams } from 'next/navigation';
import { useSession } from '@/lib/use-session';
import { ArrowLeft, Loader2, FileText } from 'lucide-react';
import Link from 'next/link';

export default function SessionReportPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const { session, loading, error } = useSession(sessionId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">
          {error || 'Session not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link
        href={`/pipeline/sessions/${session.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Session
      </Link>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8">
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Client Report</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 max-w-md mx-auto">
            The Money Leak Map report renderer will be built in Sprint 4.
            This page will transform Agent 3&apos;s output into a client-presentable document.
          </p>
          <p className="text-xs text-zinc-400">
            Session: {session.label} &middot;
            Status: {session.status} &middot;
            Stage: {session.currentStage}/5
          </p>
        </div>
      </div>
    </div>
  );
}
