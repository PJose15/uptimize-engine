/**
 * Pipeline State Management
 * Track active runs and enable cancellation
 */

export interface ActiveRun {
    id: string;
    startTime: number;
    currentAgent: number;
    controller: AbortController;
    status: 'running' | 'cancelled' | 'completed' | 'failed';
}

// Store active pipeline runs
const activeRuns = new Map<string, ActiveRun>();

/**
 * Start tracking a new pipeline run
 */
export function startRun(runId: string): AbortController {
    const controller = new AbortController();

    activeRuns.set(runId, {
        id: runId,
        startTime: Date.now(),
        currentAgent: 1,
        controller,
        status: 'running',
    });

    return controller;
}

/**
 * Update which agent is currently running
 */
export function updateRunAgent(runId: string, agentNumber: number): void {
    const run = activeRuns.get(runId);
    if (run) {
        run.currentAgent = agentNumber;
    }
}

/**
 * Mark run as completed
 */
export function completeRun(runId: string, status: 'completed' | 'failed' = 'completed'): void {
    const run = activeRuns.get(runId);
    if (run) {
        run.status = status;
        // Clean up after a delay
        setTimeout(() => activeRuns.delete(runId), 60000);
    }
}

/**
 * Cancel a running pipeline
 */
export function cancelRun(runId: string): boolean {
    const run = activeRuns.get(runId);

    if (!run || run.status !== 'running') {
        return false;
    }

    run.controller.abort();
    run.status = 'cancelled';

    return true;
}

/**
 * Get status of a specific run
 */
export function getRunStatus(runId: string): ActiveRun | null {
    return activeRuns.get(runId) || null;
}

/**
 * Get all active runs
 */
export function getAllActiveRuns(): ActiveRun[] {
    return Array.from(activeRuns.values())
        .filter(run => run.status === 'running');
}

/**
 * Check if a run is cancelled
 */
export function isRunCancelled(runId: string): boolean {
    const run = activeRuns.get(runId);
    return run?.status === 'cancelled' || run?.controller.signal.aborted || false;
}

/**
 * Get abort signal for a run
 */
export function getAbortSignal(runId: string): AbortSignal | null {
    const run = activeRuns.get(runId);
    return run?.controller.signal || null;
}

/**
 * Clean up stale runs (older than 30 minutes)
 */
export function cleanupStaleRuns(): number {
    const staleThreshold = Date.now() - (30 * 60 * 1000);
    let cleaned = 0;

    for (const [runId, run] of activeRuns.entries()) {
        if (run.startTime < staleThreshold && run.status === 'running') {
            run.controller.abort();
            run.status = 'failed';
            activeRuns.delete(runId);
            cleaned++;
        }
    }

    return cleaned;
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(cleanupStaleRuns, 5 * 60 * 1000);
}
