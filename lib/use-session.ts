'use client';

/**
 * Hook for fetching a pipeline session and providing mutation helpers.
 * Wraps usePortalData with PATCH convenience methods.
 */

import { useState, useCallback } from 'react';
import { usePortalData } from '@/app/portal/use-portal-data';
import type { SessionData } from './stage-state-machine';
import { getCSRFToken } from '@/lib/auth-context';

interface UseSessionResult {
  session: SessionData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  saving: boolean;
  saveOutput: (agentId: number, output: unknown, cost: number) => Promise<void>;
  saveProspectSelection: (ids: string[]) => Promise<void>;
  saveBookingSelection: (ids: string[]) => Promise<void>;
  approveStage: (stageNum: number) => Promise<void>;
  completeSession: () => Promise<void>;
}

async function patchSession(id: string, body: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`/api/pipeline/sessions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCSRFToken() },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || `PATCH failed: ${res.status}`);
  }
  return res.json();
}

export function useSession(id: string): UseSessionResult {
  const { data: session, loading, error, refetch } = usePortalData<SessionData>(
    `/api/pipeline/sessions/${id}`
  );
  const [saving, setSaving] = useState(false);

  const withSaving = useCallback(
    async (fn: () => Promise<void>) => {
      setSaving(true);
      try {
        await fn();
        refetch();
      } finally {
        setSaving(false);
      }
    },
    [refetch]
  );

  const saveOutput = useCallback(
    async (agentId: number, output: unknown, cost: number) => {
      await withSaving(async () => {
        await patchSession(id, {
          [`agent${agentId}Output`]: output,
          addCost: cost,
        });
      });
    },
    [id, withSaving]
  );

  const saveProspectSelection = useCallback(
    async (ids: string[]) => {
      await withSaving(async () => {
        await patchSession(id, {
          selectedProspects: ids,
        });
      });
    },
    [id, withSaving]
  );

  const saveBookingSelection = useCallback(
    async (ids: string[]) => {
      await withSaving(async () => {
        await patchSession(id, {
          selectedBookings: ids,
        });
      });
    },
    [id, withSaving]
  );

  const approveStage = useCallback(
    async (stageNum: number) => {
      await withSaving(async () => {
        await patchSession(id, { currentStage: stageNum });
      });
    },
    [id, withSaving]
  );

  const completeSession = useCallback(
    async () => {
      await withSaving(async () => {
        await patchSession(id, {
          currentStage: 5,
          status: 'completed',
        });
      });
    },
    [id, withSaving]
  );

  return {
    session,
    loading,
    error,
    refetch,
    saving,
    saveOutput,
    saveProspectSelection,
    saveBookingSelection,
    approveStage,
    completeSession,
  };
}
