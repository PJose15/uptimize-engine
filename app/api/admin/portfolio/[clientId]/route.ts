import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { loadPortfolioClient } from '@/lib/portfolio/portfolio-loader';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const { clientId } = await params;
    const client = await loadPortfolioClient(clientId);
    if (!client) {
      return NextResponse.json({ error: 'Client not found in portfolio' }, { status: 404 });
    }
    return NextResponse.json({ client });
  } catch (error) {
    console.error('Admin portfolio client error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
