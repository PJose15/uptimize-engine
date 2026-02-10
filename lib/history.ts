/**
 * Pipeline History Storage (Prisma)
 * Saves and retrieves past pipeline runs from SQLite database
 */

import { prisma } from './prisma';

export interface PipelineRun {
    id: string;
    timestamp: string;
    leads: string;
    duration: number;
    cost: number;
    status: string;
    results: Record<string, unknown>;
}

/**
 * Load all pipeline history
 */
export async function loadHistory(): Promise<PipelineRun[]> {
    const runs = await prisma.pipelineRun.findMany({
        orderBy: { timestamp: 'desc' },
        take: 100,
    });

    return runs.map(run => ({
        id: run.id,
        timestamp: run.timestamp.toISOString(),
        leads: run.leads,
        duration: run.duration,
        cost: run.cost,
        status: run.status,
        results: JSON.parse(run.results),
    }));
}

/**
 * Save a new pipeline run to history
 */
export async function saveRun(run: {
    id: string;
    timestamp: string;
    leads: string;
    duration: number;
    cost: number;
    status: string;
    results: Record<string, unknown>;
}): Promise<void> {
    await prisma.pipelineRun.create({
        data: {
            runId: run.id,
            timestamp: new Date(run.timestamp),
            leads: run.leads,
            duration: run.duration,
            cost: run.cost,
            status: run.status,
            results: JSON.stringify(run.results),
        },
    });
}

/**
 * Get a specific run by ID
 */
export async function getRunById(id: string): Promise<PipelineRun | null> {
    const run = await prisma.pipelineRun.findUnique({
        where: { runId: id },
    });

    if (!run) return null;

    return {
        id: run.runId,
        timestamp: run.timestamp.toISOString(),
        leads: run.leads,
        duration: run.duration,
        cost: run.cost,
        status: run.status,
        results: JSON.parse(run.results),
    };
}

/**
 * Delete a run from history
 */
export async function deleteRun(id: string): Promise<boolean> {
    try {
        await prisma.pipelineRun.delete({
            where: { runId: id },
        });
        return true;
    } catch {
        return false;
    }
}

/**
 * Clear all history
 */
export async function clearHistory(): Promise<void> {
    await prisma.pipelineRun.deleteMany({});
}

/**
 * Generate a unique run ID
 */
export function generateRunId(): string {
    return `run_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Get history summary for display
 */
export async function getHistorySummary(): Promise<{
    totalRuns: number;
    successRate: number;
    avgDuration: number;
    totalCost: number;
}> {
    const runs = await prisma.pipelineRun.findMany();

    if (runs.length === 0) {
        return { totalRuns: 0, successRate: 0, avgDuration: 0, totalCost: 0 };
    }

    const successCount = runs.filter(r => r.status === 'completed').length;
    const totalDuration = runs.reduce((sum, r) => sum + r.duration, 0);
    const totalCost = runs.reduce((sum, r) => sum + r.cost, 0);

    return {
        totalRuns: runs.length,
        successRate: (successCount / runs.length) * 100,
        avgDuration: totalDuration / runs.length,
        totalCost,
    };
}
