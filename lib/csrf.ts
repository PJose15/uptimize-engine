/**
 * CSRF Protection Utility
 * HMAC-signed tokens tied to the user's session, with 1-hour expiry.
 */

import { createHmac } from 'crypto';

/**
 * Signing secret for CSRF tokens. A shared default is worthless in production
 * — anyone who knows it can mint valid tokens — so we refuse to start without
 * a real secret outside development.
 */
function resolveSecret(): string {
    const secret = process.env.NEXTAUTH_SECRET;

    if (!secret) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('NEXTAUTH_SECRET is required in production (see .env.example)');
        }
        return 'dev-secret-change-me';
    }

    return secret;
}

const CSRF_SECRET = resolveSecret();
const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

/**
 * Generate a CSRF token for a given session identifier.
 */
export function generateCSRFToken(sessionId: string): string {
    const timestamp = Date.now().toString();
    const payload = `${sessionId}:${timestamp}`;
    const signature = createHmac('sha256', CSRF_SECRET)
        .update(payload)
        .digest('hex');
    return `${timestamp}.${signature}`;
}

/**
 * Validate a CSRF token against the session identifier.
 */
export function validateCSRFToken(token: string, sessionId: string): boolean {
    const parts = token.split('.');
    if (parts.length !== 2) return false;

    const [timestamp, signature] = parts;
    const ts = parseInt(timestamp, 10);
    if (isNaN(ts)) return false;

    // Check expiry
    if (Date.now() - ts > TOKEN_EXPIRY_MS) return false;

    // Verify signature
    const expectedPayload = `${sessionId}:${timestamp}`;
    const expectedSignature = createHmac('sha256', CSRF_SECRET)
        .update(expectedPayload)
        .digest('hex');

    // Constant-time comparison
    if (signature.length !== expectedSignature.length) return false;
    let mismatch = 0;
    for (let i = 0; i < signature.length; i++) {
        mismatch |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }
    return mismatch === 0;
}
