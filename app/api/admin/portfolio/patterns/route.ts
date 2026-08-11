import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { loadPortfolioClients } from '@/lib/portfolio/portfolio-loader';
import { detectPortfolioPatterns } from '@/lib/portfolio/portfolio-patterns';

export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const clients = await loadPortfolioClients();
    const patterns = detectPortfolioPatterns(clients);
    return NextResponse.json({ patterns, count: patterns.length });
  } catch (error) {
    console.error('Admin portfolio patterns error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
