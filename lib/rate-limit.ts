/**
 * Rate Limiting Utility
 * In-memory rate limiter with sliding window
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
    windowMs: number;      // Time window in milliseconds
    maxRequests: number;   // Max requests per window
}

// Default configs for different endpoints
export const RATE_LIMITS = {
    pipeline: { windowMs: 60 * 1000, maxRequests: 5 },      // 5 per minute
    api: { windowMs: 60 * 1000, maxRequests: 60 },          // 60 per minute
    auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 },    // 10 per 15 min
    webhook: { windowMs: 60 * 1000, maxRequests: 20 },      // 20 per minute
} as const;

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetIn: number;  // ms until reset
}

/**
 * Check if a request is rate limited
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = RATE_LIMITS.api
): RateLimitResult {
    const now = Date.now();
    const entry = rateLimitStore.get(identifier);

    // Clean up expired entries periodically
    if (rateLimitStore.size > 10000) {
        cleanupExpiredEntries();
    }

    // No existing entry or expired
    if (!entry || now >= entry.resetTime) {
        rateLimitStore.set(identifier, {
            count: 1,
            resetTime: now + config.windowMs,
        });
        return {
            allowed: true,
            remaining: config.maxRequests - 1,
            resetIn: config.windowMs,
        };
    }

    // Check if over limit
    if (entry.count >= config.maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            resetIn: entry.resetTime - now,
        };
    }

    // Increment counter
    entry.count++;
    return {
        allowed: true,
        remaining: config.maxRequests - entry.count,
        resetIn: entry.resetTime - now,
    };
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(result.resetIn / 1000).toString(),
    };
}

/**
 * Create a rate-limited response
 */
export function rateLimitResponse(result: RateLimitResult): Response {
    return new Response(
        JSON.stringify({
            error: 'Too many requests',
            retryAfter: Math.ceil(result.resetIn / 1000),
        }),
        {
            status: 429,
            headers: {
                'Content-Type': 'application/json',
                ...getRateLimitHeaders(result),
            },
        }
    );
}

/**
 * Clean up expired entries from store
 */
function cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now >= entry.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}

/**
 * Get client identifier from request
 */
export function getClientId(request: Request): string {
    // Try to get IP from headers (works behind proxies)
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
        return realIp;
    }

    // Fallback to a hash of user agent + accept headers
    const ua = request.headers.get('user-agent') || 'unknown';
    const accept = request.headers.get('accept') || '';
    return `anon_${hashCode(ua + accept)}`;
}

function hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}
