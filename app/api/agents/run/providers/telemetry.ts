/**
 * Provider Telemetry — Cost, Latency, Success Tracking
 *
 * Records every LLM call and provides aggregate metrics.
 * Feeds back into routing decisions over time.
 */

import type { ProviderName, StandardLLMResponse } from "./adapter";

// ============================================================================
// TYPES
// ============================================================================

export interface TelemetryRecord {
    record_id: string;
    timestamp: string;
    provider: ProviderName;
    model: string;
    agent_id: string;
    run_id: string | null;
    /** Call metrics */
    latency_ms: number;
    cost_usd: number;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    /** Outcome */
    success: boolean;
    error: string | null;
    /** Response quality */
    json_valid: boolean;
    /** Task type for pattern analysis */
    task_type: string;
}

export interface ProviderStats {
    provider: ProviderName;
    total_calls: number;
    success_count: number;
    failure_count: number;
    success_rate: number;
    avg_latency_ms: number;
    p95_latency_ms: number;
    total_cost_usd: number;
    total_tokens: number;
    json_success_rate: number;
    /** By model breakdown */
    models: Record<string, {
        calls: number;
        success_rate: number;
        avg_latency_ms: number;
        total_cost_usd: number;
    }>;
}

export interface AgentStats {
    agent_id: string;
    total_calls: number;
    avg_latency_ms: number;
    total_cost_usd: number;
    preferred_provider: ProviderName | null;
    preferred_model: string | null;
}

// ============================================================================
// TELEMETRY ENGINE
// ============================================================================

export class TelemetryEngine {
    private records: TelemetryRecord[] = [];
    private maxRecords: number;

    constructor(maxRecords: number = 10_000) {
        this.maxRecords = maxRecords;
    }

    /**
     * Record a completed LLM call
     */
    record(params: {
        response: StandardLLMResponse;
        agent_id: string;
        run_id?: string;
        task_type?: string;
        json_valid?: boolean;
    }): TelemetryRecord {
        const { response, agent_id, run_id, task_type, json_valid } = params;

        const record: TelemetryRecord = {
            record_id: `tel_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            timestamp: new Date().toISOString(),
            provider: response.provider,
            model: response.model,
            agent_id,
            run_id: run_id || null,
            latency_ms: response.latency_ms,
            cost_usd: response.cost_usd,
            prompt_tokens: response.usage.prompt_tokens,
            completion_tokens: response.usage.completion_tokens,
            total_tokens: response.usage.total_tokens,
            success: response.success,
            error: response.error,
            json_valid: json_valid ?? (response.parsed_json !== null),
            task_type: task_type || "general",
        };

        this.records.push(record);

        // Trim old records if over limit
        if (this.records.length > this.maxRecords) {
            this.records = this.records.slice(-this.maxRecords);
        }

        return record;
    }

    /**
     * Get stats for a specific provider
     */
    getProviderStats(provider: ProviderName): ProviderStats {
        const providerRecords = this.records.filter(r => r.provider === provider);

        const successRecords = providerRecords.filter(r => r.success);
        const latencies = providerRecords.map(r => r.latency_ms).sort((a, b) => a - b);
        const jsonRecords = providerRecords.filter(r => r.json_valid);

        // Model breakdown
        const modelMap: Record<string, TelemetryRecord[]> = {};
        for (const rec of providerRecords) {
            if (!modelMap[rec.model]) modelMap[rec.model] = [];
            modelMap[rec.model].push(rec);
        }

        const models: ProviderStats["models"] = {};
        for (const [model, recs] of Object.entries(modelMap)) {
            const successes = recs.filter(r => r.success);
            models[model] = {
                calls: recs.length,
                success_rate: recs.length > 0 ? successes.length / recs.length : 0,
                avg_latency_ms: recs.length > 0
                    ? Math.round(recs.reduce((sum, r) => sum + r.latency_ms, 0) / recs.length)
                    : 0,
                total_cost_usd: Number(recs.reduce((sum, r) => sum + r.cost_usd, 0).toFixed(6)),
            };
        }

        return {
            provider,
            total_calls: providerRecords.length,
            success_count: successRecords.length,
            failure_count: providerRecords.length - successRecords.length,
            success_rate: providerRecords.length > 0
                ? successRecords.length / providerRecords.length
                : 0,
            avg_latency_ms: latencies.length > 0
                ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
                : 0,
            p95_latency_ms: latencies.length > 0
                ? latencies[Math.floor(latencies.length * 0.95)] || latencies[latencies.length - 1]
                : 0,
            total_cost_usd: Number(
                providerRecords.reduce((sum, r) => sum + r.cost_usd, 0).toFixed(6)
            ),
            total_tokens: providerRecords.reduce((sum, r) => sum + r.total_tokens, 0),
            json_success_rate: providerRecords.length > 0
                ? jsonRecords.length / providerRecords.length
                : 0,
            models,
        };
    }

    /**
     * Get stats for a specific agent
     */
    getAgentStats(agentId: string): AgentStats {
        const agentRecords = this.records.filter(r => r.agent_id === agentId);

        // Find most-used provider/model
        const providerCounts: Record<string, number> = {};
        const modelCounts: Record<string, number> = {};
        for (const rec of agentRecords) {
            providerCounts[rec.provider] = (providerCounts[rec.provider] || 0) + 1;
            modelCounts[rec.model] = (modelCounts[rec.model] || 0) + 1;
        }

        const topProvider = Object.entries(providerCounts).sort((a, b) => b[1] - a[1])[0];
        const topModel = Object.entries(modelCounts).sort((a, b) => b[1] - a[1])[0];

        return {
            agent_id: agentId,
            total_calls: agentRecords.length,
            avg_latency_ms: agentRecords.length > 0
                ? Math.round(agentRecords.reduce((sum, r) => sum + r.latency_ms, 0) / agentRecords.length)
                : 0,
            total_cost_usd: Number(
                agentRecords.reduce((sum, r) => sum + r.cost_usd, 0).toFixed(6)
            ),
            preferred_provider: topProvider ? topProvider[0] as ProviderName : null,
            preferred_model: topModel ? topModel[0] : null,
        };
    }

    /**
     * Get all provider stats
     */
    getAllProviderStats(): ProviderStats[] {
        const providers = [...new Set(this.records.map(r => r.provider))];
        return providers.map(p => this.getProviderStats(p));
    }

    /**
     * Get total cost across all providers
     */
    getTotalCost(): number {
        return Number(
            this.records.reduce((sum, r) => sum + r.cost_usd, 0).toFixed(6)
        );
    }

    /**
     * Get recent records
     */
    getRecent(limit: number = 50): TelemetryRecord[] {
        return this.records.slice(-limit).reverse();
    }

    /**
     * Clear all records
     */
    clear(): void {
        this.records = [];
    }
}

// ============================================================================
// SINGLETON
// ============================================================================

let _engine: TelemetryEngine | null = null;

export function getTelemetryEngine(): TelemetryEngine {
    if (!_engine) {
        _engine = new TelemetryEngine();
    }
    return _engine;
}
