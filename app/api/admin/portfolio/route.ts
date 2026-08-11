import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { loadPortfolioClients } from '@/lib/portfolio/portfolio-loader';

export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const clients = await loadPortfolioClients();
    return NextResponse.json({ clients, count: clients.length });
  } catch (error) {
    console.error('Admin portfolio list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}