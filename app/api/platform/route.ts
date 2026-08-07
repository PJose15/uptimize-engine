import { NextResponse, type NextRequest } from 'next/server';
import { getScopedPayload } from '@/lib/platform/source';

/**
 * Command center snapshot for the UPTIMAIZE platform shell.
 *
 * Pages under `app/(platform)` render from `getScopedPayload()` directly on the
 * server; this endpoint exposes the same payload — including which sections are
 * live and which are still sample data — for polling clients.
 *
 * Supports the same scope as the UI: `?partner=<id>&q=<text>`.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const payload = await getScopedPayload({
        partner: searchParams.get('partner') ?? undefined,
        q: searchParams.get('q') ?? undefined,
    });

    return NextResponse.json(payload);
}
