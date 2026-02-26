import { NextResponse } from 'next/server';
import { authenticate, logout, validateSession } from '@/lib/auth';
import { checkRateLimit, getClientId, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';

/**
 * POST /api/auth - Login
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

        // Logout action
        if (action === 'logout') {
            const token = request.headers.get('cookie')?.match(/session=([^;]+)/)?.[1];
            if (token) {
                logout(token);
            }
            return NextResponse.json({ success: true }, {
                headers: {
                    'Set-Cookie': 'session=; Path=/; HttpOnly; Max-Age=0',
                },
            });
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

        return NextResponse.json(
            { success: true, message: 'Login successful' },
            {
                headers: {
                    'Set-Cookie': `session=${result.token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`,
                },
            }
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
