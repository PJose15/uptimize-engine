import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { loadPortfolioClients } from '@/lib/portfolio/portfolio-loader';
import { calculateWeeklyLoad } from '@/lib/portfolio/portfolio-health';

export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const clients = await loadPortfolioClients();
    const load = calculateWeeklyLoad(clients);
    return NextResponse.json(load);
  } catch (error) {
    console.error('Admin portfolio capacity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
