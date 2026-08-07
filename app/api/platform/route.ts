import { NextResponse } from 'next/server';
import { getCommandCenterData } from '@/lib/platform/data';

/**
 * Command center snapshot for the UPTIMAIZE platform shell.
 *
 * Pages under `app/(platform)` render from `getCommandCenterData()` directly on
 * the server; this endpoint exposes the same payload for polling clients and
 * external consumers.
 */
export async function GET() {
    return NextResponse.json(getCommandCenterData());
}
