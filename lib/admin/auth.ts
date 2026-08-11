/**
 * Admin auth — bearer token guard for /api/admin/* routes.
 *
 * Behavior:
 *  - If `ADMIN_TOKEN` env var is set, the request must include
 *    `Authorization: Bearer <token>` matching it.
 *  - If `ADMIN_TOKEN` is unset and `NODE_ENV !== 'production'`, allow (dev only).
 *  - If `ADMIN_TOKEN` is unset in production, fail closed.
 *
 * Swap implementation when real admin sessions land — call site doesn't change.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export type AdminAuthResult = { ok: true } | { ok: false; response: NextResponse };

export function requireAdmin(request: NextRequest): AdminAuthResult {
  const expected = process.env.ADMIN_TOKEN;

  if (!expected) {
    if (process.env.NODE_ENV === 'production') {
      return {
        ok: false,
        response: NextResponse.json(
          { error: 'Admin auth not configured' },
          { status: 503 },
        ),
      };
    }
    return { ok: true };
  }

  const header = request.headers.get('authorization') ?? '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match || match[1] !== expected) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  return { ok: true };
}