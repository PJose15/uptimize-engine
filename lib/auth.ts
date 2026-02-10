/**
 * Authentication Utilities
 * Simple session-based auth (can be upgraded to NextAuth later)
 */

import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

// In production, store in database
const USERS: Record<string, { passwordHash: string; role: 'admin' | 'user' }> = {
    admin: {
        passwordHash: bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10),
        role: 'admin',
    },
};

// Session store (in production, use Redis or database)
const sessions = new Map<string, { username: string; role: string; expiresAt: number }>();

export interface Session {
    username: string;
    role: string;
    expiresAt: number;
}

/**
 * Generate session token
 */
function generateToken(): string {
    const array = new Uint8Array(32);
    if (typeof crypto !== 'undefined') {
        crypto.getRandomValues(array);
    } else {
        for (let i = 0; i < 32; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }
    }
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Authenticate user
 */
export async function authenticate(
    username: string,
    password: string
): Promise<{ success: boolean; token?: string; error?: string }> {
    const user = USERS[username];

    if (!user) {
        return { success: false, error: 'Invalid credentials' };
    }

    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
        return { success: false, error: 'Invalid credentials' };
    }

    const token = generateToken();
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

    sessions.set(token, { username, role: user.role, expiresAt });

    return { success: true, token };
}

/**
 * Validate session token
 */
export function validateSession(token: string): Session | null {
    const session = sessions.get(token);

    if (!session) {
        return null;
    }

    if (Date.now() > session.expiresAt) {
        sessions.delete(token);
        return null;
    }

    return session;
}

/**
 * Logout - invalidate session
 */
export function logout(token: string): boolean {
    return sessions.delete(token);
}

/**
 * Get session from request cookies
 */
export async function getSessionFromCookies(): Promise<Session | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('session')?.value;

        if (!token) return null;
        return validateSession(token);
    } catch {
        return null;
    }
}

/**
 * Check if route is protected
 */
export function isProtectedRoute(pathname: string): boolean {
    const protectedRoutes = [
        '/pipeline',
        '/history',
        '/templates',
        '/compare',
        '/settings',
        '/api/pipeline',
        '/api/history',
        '/api/templates',
    ];

    const publicRoutes = [
        '/login',
        '/api/auth',
        '/api/health',
        '/api/webhooks',
    ];

    if (publicRoutes.some(route => pathname.startsWith(route))) {
        return false;
    }

    return protectedRoutes.some(route => pathname.startsWith(route));
}

/**
 * Clean up expired sessions (run periodically)
 */
export function cleanupExpiredSessions(): number {
    let cleaned = 0;
    const now = Date.now();

    for (const [token, session] of sessions.entries()) {
        if (now > session.expiresAt) {
            sessions.delete(token);
            cleaned++;
        }
    }

    return cleaned;
}

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(cleanupExpiredSessions, 5 * 60 * 1000);
}
