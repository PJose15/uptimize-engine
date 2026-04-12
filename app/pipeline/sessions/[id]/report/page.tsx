'use client';

import { useParams } from 'next/navigation';
import { useSession } from '@/lib/use-session';
import { parseAgent3Output } from '@/lib/parse-agent3-output';
import { usePdfExport } from '@/lib/use-pdf-export';
import { MoneyLeakMap } from '@/components/reports';
import { Button } from '@/components/ui';
import { ArrowLeft, Loader2, FileText, Download, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function SessionReportPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const { session, loading, error } = useSession(sessionId);

  const { exporting, exportPdf, error: pdfError } = usePdfExport({
    elementId: 'money-leak-map',
    filename: `uptimize-report-${sessionId}.pdf`,
  });

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

  const agent3Data = parseAgent3Output(session.agent3Output);

  // No Agent 3 output yet
  if (!agent3Data) {
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
            <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">No Report Data</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
              Run Agent 3 (Sales Engineer) first to generate the Money Leak Map report.
              Go back to the session workspace to run the pipeline.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Navigation + Download */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/pipeline/sessions/${session.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Session
        </Link>

        <Button
          variant="outline"
          size="sm"
          onClick={exportPdf}
          disabled={exporting}
        >
          {exporting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Download PDF
            </>
          )}
        </Button>
      </div>

      {pdfError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300 mb-4">
          PDF export failed: {pdfError}
        </div>
      )}

      {/* Report Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="h-5 w-5 text-violet-500" />
          <h1 className="text-xl font-bold">Money Leak Map</h1>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {session.label} &middot; Generated {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* The Report */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 md:p-8">
        <MoneyLeakMap data={agent3Data} />
      </div>
    </div>
  );
}
