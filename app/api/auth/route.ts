import { NextResponse } from 'next/server';
import { authenticate, logout, validateSession } from '@/lib/auth';
import { checkRateLimit, getClientId, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { generateCSRFToken, validateCSRFToken } from '@/lib/csrf';

/**
 * POST /api/auth - Login / Logout
 */
export async function POST(request: Request) {
    // Rate limit login attempts
    const clientId = getClientId(request);
    const rateLimitResult = checkRateLimit(`auth_${clientId}`, RATE_LIMITS.auth);

    if (!rateLimitResult.allowed) {
        return rateLimitResponse(rateLimitResult);
    }

    try {
        const body = await request.json();
        const { username, password, action } = body;

        // Logout action — requires valid CSRF token
        if (action === 'logout') {
            const sessionToken = request.headers.get('cookie')?.match(/session=([^;]+)/)?.[1];
            const csrfToken = request.headers.get('x-csrf-token');

            if (!csrfToken || !sessionToken || !validateCSRFToken(csrfToken, sessionToken)) {
                return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
            }

            logout(sessionToken);
            const headers = new Headers();
            headers.append('Set-Cookie', 'session=; Path=/; HttpOnly; Max-Age=0');
            headers.append('Set-Cookie', 'csrf-token=; Path=/; Max-Age=0');
            return NextResponse.json({ success: true }, { headers });
        }

        // Login
        if (!username || !password) {
            return NextResponse.json(
                { error: 'Username and password are required' },
                { status: 400 }
            );
        }

        const result = await authenticate(username, password);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 401 }
            );
        }

        // Generate CSRF token tied to session
        const csrfToken = generateCSRFToken(result.token!);
        const isProduction = process.env.NODE_ENV === 'production';
        const secureFlag = isProduction ? ' Secure;' : '';

        const headers = new Headers();
        headers.append('Set-Cookie', `session=${result.token}; Path=/; HttpOnly; SameSite=Strict;${secureFlag} Max-Age=86400`);
        headers.append('Set-Cookie', `csrf-token=${csrfToken}; Path=/; SameSite=Strict;${secureFlag} Max-Age=86400`);

        return NextResponse.json(
            { success: true, message: 'Login successful' },
            { headers }
        );

    } catch (error) {
        console.error('Auth error:', error);
        return NextResponse.json(
            { error: 'Authentication failed' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/auth - Check session
 */
export async function GET(request: Request): Promise<Response> {
    const token = request.headers.get('cookie')?.match(/session=([^;]+)/)?.[1];

    if (!token) {
        return NextResponse.json({ authenticated: false });
    }

    const session = await validateSession(token);

    if (!session) {
        return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
        authenticated: true,
        user: {
            username: session.username,
            role: session.role,
        },
    });
}
