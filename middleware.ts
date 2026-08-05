import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Route protection middleware.
 *
 * SCOPE: this is a *presence* check on the session cookie, and it guards page
 * navigations only. Middleware runs on the edge runtime, where the Prisma
 * client is unavailable, so it cannot verify that a token is real or unexpired
 * — a forged cookie passes this check.
 *
 * API routes are therefore NOT authorized here. Every API route that reads
 * data or spends money validates the session against the database itself via
 * `requireSession()` / `getSessionFromRequest()` in lib/api-auth.ts. Adding a
 * route below does not make it safe; adding the guard inside the handler does.
 */

// Page routes that require an admin session
const protectedRoutes = [
    '/admin',
    '/pipeline',
    '/history',
    '/templates',
    '/compare',
    '/settings',
    '/results',
];

// Routes that never require auth
const publicRoutes = [
    '/login',
    '/api/auth',
    '/api/health',
    '/api/webhooks',
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public routes
    for (const route of publicRoutes) {
        if (pathname.startsWith(route)) {
            return NextResponse.next();
        }
    }

    // API routes authorize themselves in-handler (see note above)
    if (pathname.startsWith('/api/')) {
        return NextResponse.next();
    }

    // The client portal has its own PortalUser session and is not covered by
    // the admin session checked here.
    if (pathname.startsWith('/portal')) {
        return NextResponse.next();
    }

    let isProtected = pathname === '/';

    for (const route of protectedRoutes) {
        if (pathname.startsWith(route)) {
            isProtected = true;
            break;
        }
    }

    if (isProtected) {
        const sessionToken = request.cookies.get('session')?.value;

        if (!sessionToken) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
