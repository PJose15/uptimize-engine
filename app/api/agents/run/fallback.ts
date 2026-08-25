/**
 * Waterfall fallback orchestration
 */

import { Provider, ProviderResponse } from "./providers/base";
import { GeminiProvider } from "./providers/gemini";
import { OpenAIProvider } from "./providers/openai";
import { AnthropicProvider } from "./providers/anthropic";
import { retryWithBackoff, RetryPolicy, DEFAULT_RETRY_POLICY } from "./retry";
import { logger } from "./logger";
import { ErrorType, ProviderName, AgentMode } from "./types";
import { getProviderPriority } from "./config";

export interface FallbackAttempt {
    provider: string;
    success: boolean;
    errorType?: ErrorType;
    errorDetails?: string;
    retryAttempts?: number;
}

export interface FallbackResult extends ProviderResponse {
    attempts: FallbackAttempt[];
}

export interface FallbackResponseValidation {
    valid: boolean;
    details?: string;
}

export type FallbackResponseValidator = (
    message: string
) => FallbackResponseValidation;

/**
 * Convert a provider's syntactically successful but schema-invalid response
 * into a model error so the waterfall can continue to the next provider.
 */
export function applyResponseValidation(
    response: ProviderResponse,
    validator?: FallbackResponseValidator
): ProviderResponse {
    if (!response.success || !validator) return response;

    try {
        const validation = validator(response.message);
        if (validation.valid) return response;

        const details = validation.details || "Response failed schema validation";
        return {
            success: false,
            message: `Schema validation failed: ${details}`,
            error: {
                type: ErrorType.MODEL_ERROR,
                details,
            },
        };
    } catch (error) {
        const details = error instanceof Error ? error.message : String(error);
        return {
            success: false,
            message: `Schema validation failed: ${details}`,
            error: {
                type: ErrorType.MODEL_ERROR,
                details,
            },
        };
    }
}

/**
 * Resolve provider priority without instantiating clients. Kept pure so routing
 * contracts can be verified without API keys or paid model calls.
 */
export function resolveProviderOrder(
    mode: AgentMode = "balanced",
    providerOrder?: ProviderName[]
): ProviderName[] {
    return providerOrder ?? getProviderPriority(mode);
}

/**
 * Get all available providers in priority order based on mode
 */
function getAvailableProviders(
    mode: AgentMode = "balanced",
    providerOrder?: ProviderName[]
): Provider[] {
    const allProviders: Record<ProviderName, Provider> = {
        [ProviderName.GEMINI]: new GeminiProvider(),
        [ProviderName.OPENAI]: new OpenAIProvider(),
        [ProviderName.ANTHROPIC]: new AnthropicProvider(),
        [ProviderName.PERPLEXITY]: new GeminiProvider(), // Placeholder
    };

    // Explicit override (e.g. schema-strict agents force Anthropic first),
    // otherwise fall back to mode-based priority.
    const priority = resolveProviderOrder(mode, providerOrder);

    // Return providers in priority order, filtered by availability
    return priority
        .map(name => allProviders[name])
        .filter(provider => provider && provider.isAvailable());
}

/**
 * Execute task with waterfall fallback
 * Tries each provider in order until one succeeds
 */
export async function executeWithFallback(
    task: string,
    mode: AgentMode = "balanced",
    timeoutMs: number = 120000, // 2 minutes for large agent prompts
    retryPolicy: RetryPolicy = DEFAULT_RETRY_POLICY,
    providerOrder?: ProviderName[],
    responseValidator?: FallbackResponseValidator
): Promise<FallbackResult> {
    const taskSummary = logger.summarizeTask(task);
    const providers = getAvailableProviders(mode, providerOrder);
    const attempts: FallbackAttempt[] = [];

    if (providers.length === 0) {
        logger.error("No providers available", { taskSummary });
        return {
            success: false,
            message: "No API keys configured. Please set at least one provider API key in .env.local",
            error: {
                type: ErrorType.AUTH_ERROR,
                details: "No providers available",
            },
            attempts: [],
        };
    }

    logger.info("Starting fallback execution", { taskSummary }, {
        availableProviders: providers.map(p => p.name),
    });

    // Try each provider in order
    for (const provider of providers) {
        logger.info(`Attempting provider: ${provider.name}`, {
            provider: provider.name,
            taskSummary,
        });

        let retryCount = 0;

        // Execute with retry
        const result = await retryWithBackoff(
            () => provider.execute(task, timeoutMs),
            (response: ProviderResponse) => {
                retryCount++;
                return {
                    retry: !response.success,
                    errorType: response.error?.type,
                };
            },
            retryPolicy,
            { provider: provider.name, taskSummary }
        );

        const validatedResult = applyResponseValidation(result, responseValidator);

        // Track this attempt, including schema failures from otherwise-successful calls.
        attempts.push({
            provider: provider.name,
            success: validatedResult.success,
            errorType: validatedResult.error?.type,
            errorDetails: validatedResult.error?.details,
            retryAttempts: retryCount - 1, // Subtract 1 because first attempt isn't a retry
        });

        // If successful and schema-valid, return immediately.
        if (validatedResult.success) {
            logger.info(`Provider ${provider.name} succeeded`, {
                provider: provider.name,
                taskSummary,
            });

            return {
                ...validatedResult,
                attempts,
            };
        }

        logger.warn(`Provider ${provider.name} failed`, {
            provider: provider.name,
            taskSummary,
        }, {
            errorType: validatedResult.error?.type,
            errorDetails: validatedResult.error?.details,
        });
    }

    // All providers failed
    logger.error("All providers failed", { taskSummary }, {
        attempts: attempts.length,
    });

    return {
        success: false,
        message: "All providers failed. See attempts for details.",
        error: {
            type: ErrorType.UNKNOWN_ERROR,
            details: `Tried ${attempts.length} provider(s), all failed`,
        },
        attempts,
    };
}
