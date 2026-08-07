/**
 * API Route Authentication Helpers
 *
 * Session-cookie extraction and validation for API route handlers.
 *
 * Middleware cannot do this work: it runs on the edge runtime, where the
 * Prisma client is unavailable, so it can only check that a session cookie
 * is *present*. Every API route that does privileged work must validate the
 * token against the database itself — that is what these helpers are for.
 */

import { validateSession, type Session } from './auth';

/**
 * Extract the session token value from a raw Cookie header.
 * Tolerates '=' inside the token value.
 */
export function extractSessionToken(cookieHeader: string | null): string | null {
    if (!cookieHeader) return null;

    for (const cookie of cookieHeader.split(';')) {
        const [name, ...rest] = cookie.trim().split('=');
        if (name.trim() === 'session') {
            const value = rest.join('=').trim();
            return value.length > 0 ? value : null;
        }
    }

    return null;
}

/**
 * Resolve the authenticated session for a request, or null if there isn't one.
 */
export async function getSessionFromRequest(request: Request): Promise<Session | null> {
    const token = extractSessionToken(request.headers.get('cookie'));
    if (!token) return null;

    return validateSession(token);
}

/**
 * Guard for API routes: returns the session, or a 401 Response to return
 * directly from the handler.
 *
 * Usage:
 *   const auth = await requireSession(request);
 *   if (auth instanceof Response) return auth;
 *   // auth is a valid Session from here on
 */
export async function requireSession(request: Request): Promise<Session | Response> {
    const session = await getSessionFromRequest(request);

    if (!session) {
        return new Response(
            JSON.stringify({
                success: false,
                message: 'Unauthorized',
                error: {
                    type: 'AUTH_ERROR',
                    details: 'Valid session required',
                    timestamp: new Date().toISOString(),
                },
            }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
    }

    return session;
}
