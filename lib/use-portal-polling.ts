'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UsePortalPollingResult<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

/**
 * Polling hook — drop-in replacement for usePortalData.
 * Fetches immediately on mount, then polls at `intervalMs`.
 * Pauses when tab is hidden, resumes when visible.
 * Uses AbortController to cancel stale requests on URL change.
 */
export function usePortalPolling<T>(
    url: string,
    intervalMs: number = 10000
): UsePortalPollingResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const hasFetchedRef = useRef(false);

    // Stable refetch that uses the latest abort controller
    const fetchData = useCallback(async (signal?: AbortSignal) => {
        // Only show loading skeleton on initial fetch, not subsequent polls
        if (!hasFetchedRef.current) {
            setLoading(true);
        }
        setError(null);
        try {
            const res = await fetch(url, { signal });
            if (!res.ok) {
                throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
            }
            const json = await res.json();
            if (!signal?.aborted) {
                setData(json);
                hasFetchedRef.current = true;
            }
        } catch (e) {
            if (e instanceof DOMException && e.name === 'AbortError') return;
            if (!signal?.aborted) {
                setError(e instanceof Error ? e.message : 'Unknown error');
            }
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    }, [url]);

    // Manual refetch (exposed to consumers)
    const refetch = useCallback(() => {
        // Cancel any in-flight request before refetching
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        fetchData(controller.signal);
    }, [fetchData]);

    useEffect(() => {
        const controller = new AbortController();
        abortRef.current = controller;
        hasFetchedRef.current = false; // Reset on URL change so new URL shows loading once

        // Initial fetch
        fetchData(controller.signal);

        // Start polling
        const poll = setInterval(() => {
            // Don't abort previous poll — just fire a new one
            // The signal from the effect-level controller handles cleanup
            fetchData(controller.signal);
        }, intervalMs);
        intervalRef.current = poll;

        // Visibility change handler — pause/resume polling
        const onVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
            } else {
                fetchData(controller.signal);
                if (!intervalRef.current) {
                    intervalRef.current = setInterval(() => {
                        fetchData(controller.signal);
                    }, intervalMs);
                }
            }
        };
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            controller.abort();
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [fetchData, intervalMs]);

    return { data, loading, error, refetch };
}
