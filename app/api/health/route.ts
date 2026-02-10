import { NextResponse } from 'next/server';
import { getAllActiveRuns } from '@/lib/pipeline-state';

interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    version: string;
    uptime: number;
    checks: {
        name: string;
        status: 'pass' | 'fail' | 'warn';
        message?: string;
        duration?: number;
    }[];
}

const startTime = Date.now();

/**
 * GET /api/health - Health check endpoint
 */
export async function GET() {
    const checks: HealthStatus['checks'] = [];

    // Check 1: API Keys configured
    const apiKeysCheck = checkApiKeys();
    checks.push(apiKeysCheck);

    // Check 2: Active pipelines
    const pipelineCheck = checkActivePipelines();
    checks.push(pipelineCheck);

    // Check 3: Memory usage
    const memoryCheck = checkMemory();
    checks.push(memoryCheck);

    // Check 4: Data directory writable
    const dataCheck = await checkDataDirectory();
    checks.push(dataCheck);

    // Determine overall status
    const hasFail = checks.some(c => c.status === 'fail');
    const hasWarn = checks.some(c => c.status === 'warn');

    const status: HealthStatus = {
        status: hasFail ? 'unhealthy' : hasWarn ? 'degraded' : 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime: Math.floor((Date.now() - startTime) / 1000),
        checks,
    };

    return NextResponse.json(status, {
        status: hasFail ? 503 : 200,
    });
}

function checkApiKeys(): HealthStatus['checks'][0] {
    const keys = {
        gemini: !!process.env.GEMINI_API_KEY,
        anthropic: !!process.env.ANTHROPIC_API_KEY,
        openai: !!process.env.OPENAI_API_KEY,
    };

    const configured = Object.values(keys).filter(Boolean).length;
    const total = Object.keys(keys).length;

    if (configured === 0) {
        return { name: 'api_keys', status: 'fail', message: 'No API keys configured' };
    }
    if (configured < total) {
        return { name: 'api_keys', status: 'warn', message: `${configured}/${total} API keys configured` };
    }
    return { name: 'api_keys', status: 'pass', message: 'All API keys configured' };
}

function checkActivePipelines(): HealthStatus['checks'][0] {
    const active = getAllActiveRuns();

    if (active.length > 10) {
        return { name: 'active_pipelines', status: 'warn', message: `${active.length} active pipelines (high load)` };
    }
    return { name: 'active_pipelines', status: 'pass', message: `${active.length} active pipelines` };
}

function checkMemory(): HealthStatus['checks'][0] {
    if (typeof process !== 'undefined' && process.memoryUsage) {
        const usage = process.memoryUsage();
        const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
        const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
        const percentage = (usage.heapUsed / usage.heapTotal) * 100;

        if (percentage > 90) {
            return { name: 'memory', status: 'fail', message: `High memory: ${heapUsedMB}MB / ${heapTotalMB}MB (${percentage.toFixed(0)}%)` };
        }
        if (percentage > 75) {
            return { name: 'memory', status: 'warn', message: `${heapUsedMB}MB / ${heapTotalMB}MB (${percentage.toFixed(0)}%)` };
        }
        return { name: 'memory', status: 'pass', message: `${heapUsedMB}MB / ${heapTotalMB}MB` };
    }
    return { name: 'memory', status: 'pass', message: 'Memory check not available' };
}

async function checkDataDirectory(): Promise<HealthStatus['checks'][0]> {
    try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const dataDir = path.join(process.cwd(), 'data');

        await fs.access(dataDir);
        return { name: 'data_directory', status: 'pass', message: 'Data directory accessible' };
    } catch {
        return { name: 'data_directory', status: 'warn', message: 'Data directory not found (will be created)' };
    }
}
