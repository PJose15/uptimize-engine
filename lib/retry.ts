/**
 * Retry utility with exponential backoff
 * Used to handle transient API failures gracefully
 */

export interface RetryOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
    retryableErrors?: string[];
    onRetry?: (error: Error, attempt: number, delayMs: number) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry' | 'retryableErrors'>> = {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
};

// Common retryable error patterns
const DEFAULT_RETRYABLE_ERRORS = [
    'ECONNRESET',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'rate limit',
    'rate_limit',
    'too many requests',
    '429',
    '500',
    '502',
    '503',
    '504',
    'timeout',
    'network error',
];

function isRetryableError(error: Error, retryablePatterns: string[]): boolean {
    const errorString = `${error.name} ${error.message}`.toLowerCase();
    return retryablePatterns.some(pattern =>
        errorString.includes(pattern.toLowerCase())
    );
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wraps an async function with retry logic and exponential backoff
 * 
 * @example
 * const result = await withRetry(
 *   () => callExternalAPI(data),
 *   { maxAttempts: 3, initialDelayMs: 1000 }
 * );
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const {
        maxAttempts,
        initialDelayMs,
        maxDelayMs,
        backoffMultiplier,
    } = { ...DEFAULT_OPTIONS, ...options };

    const retryableErrors = options.retryableErrors || DEFAULT_RETRYABLE_ERRORS;

    let lastError: Error | null = null;
    let currentDelay = initialDelayMs;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            // Check if this is the last attempt
            if (attempt >= maxAttempts) {
                throw new RetryError(
                    `Failed after ${maxAttempts} attempts: ${lastError.message}`,
                    lastError,
                    attempt
                );
            }

            // Check if error is retryable
            if (!isRetryableError(lastError, retryableErrors)) {
                throw lastError;
            }

            // Calculate delay with jitter
            const jitter = Math.random() * 0.3 * currentDelay;
            const delayWithJitter = Math.min(currentDelay + jitter, maxDelayMs);

            // Call retry callback if provided
            if (options.onRetry) {
                options.onRetry(lastError, attempt, delayWithJitter);
            }

            // Wait before retrying
            await sleep(delayWithJitter);

            // Increase delay for next attempt
            currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelayMs);
        }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError || new Error('Unknown error in retry logic');
}

/**
 * Custom error class for retry failures
 */
export class RetryError extends Error {
    public readonly cause: Error;
    public readonly attempts: number;

    constructor(message: string, cause: Error, attempts: number) {
        super(message);
        this.name = 'RetryError';
        this.cause = cause;
        this.attempts = attempts;
    }
}

/**
 * Creates a retry-wrapped version of any async function
 */
export function withRetryWrapper<TArgs extends unknown[], TResult>(
    fn: (...args: TArgs) => Promise<TResult>,
    options: RetryOptions = {}
): (...args: TArgs) => Promise<TResult> {
    return (...args: TArgs) => withRetry(() => fn(...args), options);
}
