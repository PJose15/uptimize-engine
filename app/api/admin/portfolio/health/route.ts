import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { loadPortfolioClients } from '@/lib/portfolio/portfolio-loader';
import { calculatePortfolioHealthScore } from '@/lib/portfolio/portfolio-health';

export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const clients = await loadPortfolioClients();
    const health = calculatePortfolioHealthScore(clients);
    return NextResponse.json(health);
  } catch (error) {
    console.error('Admin portfolio health error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
