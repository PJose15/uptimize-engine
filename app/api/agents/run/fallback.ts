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

/**
 * Get all available providers in priority order based on mode
 */
function getAvailableProviders(mode: AgentMode = "balanced"): Provider[] {
    const allProviders: Record<ProviderName, Provider> = {
        [ProviderName.GEMINI]: new GeminiProvider(),
        [ProviderName.OPENAI]: new OpenAIProvider(),
        [ProviderName.ANTHROPIC]: new AnthropicProvider(),
        [ProviderName.PERPLEXITY]: new GeminiProvider(), // Placeholder
    };

    // Get priority order based on mode
    const priority = getProviderPriority(mode);

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
    retryPolicy: RetryPolicy = DEFAULT_RETRY_POLICY
): Promise<FallbackResult> {
    const taskSummary = logger.summarizeTask(task);
    const providers = getAvailableProviders(mode);
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

        // Track this attempt
        attempts.push({
            provider: provider.name,
            success: result.success,
            errorType: result.error?.type,
            errorDetails: result.error?.details,
            retryAttempts: retryCount - 1, // Subtract 1 because first attempt isn't a retry
        });

        // If successful, return immediately
        if (result.success) {
            logger.info(`Provider ${provider.name} succeeded`, {
                provider: provider.name,
                taskSummary,
            });

            return {
                ...result,
                attempts,
            };
        }

        logger.warn(`Provider ${provider.name} failed`, {
            provider: provider.name,
            taskSummary,
        }, {
            errorType: result.error?.type,
            errorDetails: result.error?.details,
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
