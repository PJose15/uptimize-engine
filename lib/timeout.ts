/**
 * Timeout Utilities
 * Wrap async operations with configurable timeouts
 */

export class TimeoutError extends Error {
    constructor(message: string, public readonly timeoutMs: number) {
        super(message);
        this.name = 'TimeoutError';
    }
}

/**
 * Wrap a promise with a timeout
 */
export function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    errorMessage = 'Operation timed out'
): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new TimeoutError(`${errorMessage} after ${timeoutMs}ms`, timeoutMs));
        }, timeoutMs);

        promise
            .then((result) => {
                clearTimeout(timer);
                resolve(result);
            })
            .catch((error) => {
                clearTimeout(timer);
                reject(error);
            });
    });
}

/**
 * Wrap a promise with both timeout and abort signal
 */
export function withTimeoutAndAbort<T>(
    promiseFn: (signal: AbortSignal) => Promise<T>,
    timeoutMs: number,
    externalSignal?: AbortSignal,
    errorMessage = 'Operation timed out'
): Promise<T> {
    const controller = new AbortController();

    // Link to external signal if provided
    if (externalSignal) {
        externalSignal.addEventListener('abort', () => controller.abort());
    }

    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
            controller.abort();
            reject(new TimeoutError(`${errorMessage} after ${timeoutMs}ms`, timeoutMs));
        }, timeoutMs);

        promiseFn(controller.signal)
            .then((result) => {
                clearTimeout(timer);
                resolve(result);
            })
            .catch((error) => {
                clearTimeout(timer);
                if (error.name === 'AbortError') {
                    reject(new Error('Operation was cancelled'));
                } else {
                    reject(error);
                }
            });
    });
}

// Default timeouts per agent (in milliseconds)
export const AGENT_TIMEOUTS: Record<number, number> = {
    1: 120000,  // 2 minutes
    2: 120000,  // 2 minutes
    3: 180000,  // 3 minutes
    4: 180000,  // 3 minutes
    5: 180000,  // 3 minutes
};

/**
 * Get timeout for specific agent
 */
export function getAgentTimeout(agentNumber: number, customTimeout?: number): number {
    return customTimeout || AGENT_TIMEOUTS[agentNumber] || 120000;
}
