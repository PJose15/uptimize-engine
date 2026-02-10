/**
 * Pipeline History Storage
 * Saves and retrieves past pipeline runs
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface PipelineRun {
    id: string;
    timestamp: string;
    leads: string;
    duration: number;
    status: 'success' | 'partial' | 'failed';
    agentResults: AgentResult[];
    totalCost?: number;
}

export interface AgentResult {
    agentNumber: number;
    agentName: string;
    success: boolean;
    duration: number;
    data?: unknown;
    error?: string;
    cost?: {
        inputTokens: number;
        outputTokens: number;
        totalCost: number;
    };
}

const HISTORY_FILE = path.join(process.cwd(), 'data', 'pipeline-history.json');
const MAX_HISTORY_ITEMS = 100;

/**
 * Ensure data directory exists
 */
async function ensureDataDir(): Promise<void> {
    const dataDir = path.dirname(HISTORY_FILE);
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

/**
 * Load all pipeline history
 */
export async function loadHistory(): Promise<PipelineRun[]> {
    try {
        await ensureDataDir();
        const data = await fs.readFile(HISTORY_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

/**
 * Save a new pipeline run to history
 */
export async function saveRun(run: PipelineRun): Promise<void> {
    await ensureDataDir();
    const history = await loadHistory();

    // Add new run at the beginning
    history.unshift(run);

    // Trim to max items
    if (history.length > MAX_HISTORY_ITEMS) {
        history.splice(MAX_HISTORY_ITEMS);
    }

    await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2));
}

/**
 * Get a specific run by ID
 */
export async function getRunById(id: string): Promise<PipelineRun | null> {
    const history = await loadHistory();
    return history.find(run => run.id === id) || null;
}

/**
 * Delete a run from history
 */
export async function deleteRun(id: string): Promise<boolean> {
    const history = await loadHistory();
    const index = history.findIndex(run => run.id === id);

    if (index === -1) {
        return false;
    }

    history.splice(index, 1);
    await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2));
    return true;
}

/**
 * Clear all history
 */
export async function clearHistory(): Promise<void> {
    await ensureDataDir();
    await fs.writeFile(HISTORY_FILE, JSON.stringify([]));
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
    const history = await loadHistory();

    if (history.length === 0) {
        return { totalRuns: 0, successRate: 0, avgDuration: 0, totalCost: 0 };
    }

    const successCount = history.filter(r => r.status === 'success').length;
    const totalDuration = history.reduce((sum, r) => sum + r.duration, 0);
    const totalCost = history.reduce((sum, r) => sum + (r.totalCost || 0), 0);

    return {
        totalRuns: history.length,
        successRate: (successCount / history.length) * 100,
        avgDuration: totalDuration / history.length,
        totalCost,
    };
}
