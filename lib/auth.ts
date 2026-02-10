/**
 * Authentication Utilities (Prisma)
 * Database-backed session authentication with SQLite
 */

import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

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
    const user = await prisma.user.findUnique({
        where: { username },
    });

    if (!user) {
        return { success: false, error: 'Invalid credentials' };
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
        return { success: false, error: 'Invalid credentials' };
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000)); // 24 hours

    await prisma.session.create({
        data: {
            userId: user.id,
            token,
            expiresAt,
        },
    });

    return { success: true, token };
}

/**
 * Validate session token
 */
export async function validateSession(token: string): Promise<Session | null> {
    const session = await prisma.session.findUnique({
        where: { token },
        include: { user: true },
    });

    if (!session) {
        return null;
    }

    if (new Date() > session.expiresAt) {
        await prisma.session.delete({ where: { token } });
        return null;
    }

    return {
        username: session.user.username,
        role: session.user.role,
        expiresAt: session.expiresAt.getTime(),
    };
}

/**
 * Logout - invalidate session
 */
export async function logout(token: string): Promise<boolean> {
    try {
        await prisma.session.delete({ where: { token } });
        return true;
    } catch {
        return false;
    }
}

/**
 * Get session from request cookies
 */
export async function getSessionFromCookies(): Promise<Session | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('session')?.value;

        if (!token) return null;
        return await validateSession(token);
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
export async function cleanupExpiredSessions(): Promise<number> {
    const result = await prisma.session.deleteMany({
        where: {
            expiresAt: {
                lt: new Date(),
            },
        },
    });

    return result.count;
}

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(() => cleanupExpiredSessions(), 5 * 60 * 1000);
}
