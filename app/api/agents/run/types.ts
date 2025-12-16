/**
 * Shared TypeScript types for the Agent Orchestrator
 */

export enum ErrorType {
    VALIDATION_ERROR = "VALIDATION_ERROR",
    AUTH_ERROR = "AUTH_ERROR",
    RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
    NETWORK_ERROR = "NETWORK_ERROR",
    TIMEOUT_ERROR = "TIMEOUT_ERROR",
    MODEL_ERROR = "MODEL_ERROR",
    UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export enum ProviderName {
    GEMINI = "gemini",
    OPENAI = "openai",
    ANTHROPIC = "anthropic",
    PERPLEXITY = "perplexity",
}

export interface RequestMetadata {
    requestId: string;
    timestamp: string;
    taskLength: number;
}

export interface ResponseMetadata {
    provider: string;
    model: string;
    timestamp: string;
    latencyMs: number;
    tokensUsed?: number;
}

export type AgentMode = "fast" | "balanced" | "quality";

export interface AgentRequest {
    task: string;
    mode?: AgentMode;
    context?: string;
    preferences?: Record<string, unknown>;
}

export interface UsageInfo {
    totalTokens: number;
    estimatedCostUSD: number;
    providerCosts: Array<{
        provider: string;
        tokens: number;
        costUSD: number;
    }>;
}

export interface AgentResult {
    success: boolean;
    message: string;
    data?: {
        provider: string;
        model: string;
        timestamp: string;
        latencyMs: number;
        tokensUsed?: number;
        result?: any;  // Structured output from specialized agents (e.g., ZGO parsed JSON)
    };
    usage?: UsageInfo;
    error?: {
        type: ErrorType;
        details: string;
        timestamp: string;
    };
}

export interface ProviderConfig {
    name: ProviderName;
    model: string;
    timeoutMs: number;
    maxTokens?: number;
    temperature?: number;
}

export interface OrchestrationError extends Error {
    type: ErrorType;
    provider?: string;
    originalError?: unknown;
}
