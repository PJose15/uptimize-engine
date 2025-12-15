/**
 * Retry logic with exponential backoff
 */

import { ErrorType } from "./types";
import { logger } from "./logger";

export interface RetryPolicy {
    maxAttempts: number;
    initialDelayMs: number;
    multiplier: number;
    maxDelayMs: number;
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
    maxAttempts: 3,
    initialDelayMs: 1000, // 1 second
    multiplier: 2,
    maxDelayMs: 10000, // 10 seconds
};

/**
 * Errors that should trigger a retry
 */
const RETRYABLE_ERRORS: ErrorType[] = [
    ErrorType.TIMEOUT_ERROR,
    ErrorType.NETWORK_ERROR,
    ErrorType.RATE_LIMIT_ERROR,
];

/**
 * Check if an error is retryable
 */
function isRetryableError(errorType: ErrorType): boolean {
    return RETRYABLE_ERRORS.includes(errorType);
}

/**
 * Calculate delay for next retry attempt
 */
function calculateDelay(attempt: number, policy: RetryPolicy): number {
    const delay = policy.initialDelayMs * Math.pow(policy.multiplier, attempt - 1);
    return Math.min(delay, policy.maxDelayMs);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    shouldRetry: (result: T) => { retry: boolean; errorType?: ErrorType },
    policy: RetryPolicy = DEFAULT_RETRY_POLICY,
    context?: { provider?: string; taskSummary?: string }
): Promise<T> {
    let lastResult: T;

    for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
        try {
            lastResult = await fn();
            const { retry, errorType } = shouldRetry(lastResult);

            if (!retry) {
                // Success or non-retryable error
                return lastResult;
            }

            // Check if error is retryable
            if (errorType && !isRetryableError(errorType)) {
                logger.warn("Non-retryable error encountered", context, {
                    attempt,
                    errorType,
                });
                return lastResult;
            }

            // If we've exhausted attempts, return the last result
            if (attempt >= policy.maxAttempts) {
                logger.warn("Max retry attempts reached", context, { attempts: attempt });
                return lastResult;
            }

            // Calculate delay and wait
            const delayMs = calculateDelay(attempt, policy);
            logger.info("Retrying after backoff", context, {
                attempt,
                nextAttempt: attempt + 1,
                delayMs,
                errorType,
            });

            await sleep(delayMs);
        } catch (error) {
            // Unexpected error during execution
            logger.error("Error during retry execution", context, { attempt, error });
            throw error;
        }
    }

    // Should never reach here, but TypeScript needs it
    return lastResult!;
}
