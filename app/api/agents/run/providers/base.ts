/**
 * Base provider interface and utilities
 */

import { ErrorType, ProviderName, ResponseMetadata } from "../types";

export interface ProviderResponse {
    success: boolean;
    message: string;
    metadata?: ResponseMetadata;
    error?: {
        type: ErrorType;
        details: string;
    };
}

export interface Provider {
    name: ProviderName;
    isAvailable(): boolean;
    execute(task: string, timeoutMs: number, signal?: AbortSignal): Promise<ProviderResponse>;
}

/**
 * Normalize provider responses to consistent format
 */
export function normalizeResponse(
    provider: ProviderName,
    model: string,
    text: string,
    startTime: number,
    tokensUsed?: number
): ProviderResponse {
    return {
        success: true,
        message: text,
        metadata: {
            provider,
            model,
            timestamp: new Date().toISOString(),
            latencyMs: Date.now() - startTime,
            tokensUsed,
        },
    };
}

/**
 * Create error response
 */
export function createErrorResponse(
    provider: ProviderName,
    errorType: ErrorType,
    details: string
): ProviderResponse {
    return {
        success: false,
        message: `${provider} Error: ${details}`,
        error: {
            type: errorType,
            details,
        },
    };
}
