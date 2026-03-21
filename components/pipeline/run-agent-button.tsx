'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui';
import { Play, Loader2, X } from 'lucide-react';

interface RunAgentButtonProps {
  agentId: number;
  sessionId: string;
  task: string;
  context: Record<string, unknown>;
  onComplete: (result: { success: boolean; result: unknown; duration: number; cost: number }) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export function RunAgentButton({
  agentId,
  task,
  context,
  onComplete,
  onError,
  disabled,
}: RunAgentButtonProps) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const handleRun = useCallback(async () => {
    setRunning(true);
    setElapsed(0);

    const controller = new AbortController();
    abortRef.current = controller;

    const start = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - start);
    }, 100);

    try {
      const res = await fetch(`/api/agents/run/${agentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, context, mode: 'balanced' }),
        signal: controller.signal,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Agent ${agentId} failed`);
      }

      onComplete({
        success: data.success,
        result: data.result,
        duration: data.duration,
        cost: 0, // Cost tracked server-side
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        onError('Agent run cancelled');
      } else {
        onError(err instanceof Error ? err.message : 'Unknown error');
      }
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      abortRef.current = null;
      setRunning(false);
    }
  }, [agentId, task, context, onComplete, onError]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  if (running) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="font-mono text-xs">{(elapsed / 1000).toFixed(1)}s</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleCancel}>
          <X className="h-3 w-3 mr-1" />
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button size="sm" onClick={handleRun} disabled={disabled}>
      <Play className="h-3.5 w-3.5 mr-1.5" />
      Run Agent
    </Button>
  );
}
