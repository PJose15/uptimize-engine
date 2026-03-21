'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';

const EXAMPLE_QUERIES = [
  'Find 10 gyms in Ponce, Puerto Rico',
  'Find 5 logistics companies in Miami with 10-50 employees',
  'Find healthcare administrators managing multiple departments in PR',
  'Find 8 window tint shops in San Juan area',
  'Find 10 content creators with 10K+ followers in fitness niche',
];

export default function NewSessionPage() {
  const router = useRouter();
  const [label, setLabel] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!label.trim()) return;

    setCreating(true);
    setError(null);

    try {
      const res = await fetch('/api/pipeline/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create session');
      }

      const session = await res.json();
      router.push(`/pipeline/sessions/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setCreating(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Back */}
      <Link
        href="/pipeline/sessions"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Sessions
      </Link>

      <h1 className="text-2xl font-bold mb-2">New Pipeline Session</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
        Describe what you want Agent 1 to find. This becomes the session label and the initial query.
      </p>

      {/* Query Input */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
        <label className="block text-sm font-medium mb-2">
          Target Query
        </label>
        <textarea
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder='e.g. "Find 10 gyms in Ponce, Puerto Rico"'
          rows={3}
          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 py-3 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 resize-none"
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleCreate();
            }
          }}
        />

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>
        )}

        <Button
          onClick={handleCreate}
          disabled={!label.trim() || creating}
          className="mt-4 w-full"
        >
          {creating ? (
            <>
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-1.5" />
              Create Session
            </>
          )}
        </Button>
      </div>

      {/* Examples */}
      <div>
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">
          Example Queries
        </p>
        <div className="space-y-2">
          {EXAMPLE_QUERIES.map(query => (
            <button
              key={query}
              onClick={() => setLabel(query)}
              className="block w-full text-left px-4 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-colors"
            >
              {query}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
