import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { loadPortfolioClients } from '@/lib/portfolio/portfolio-loader';

export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const clients = await loadPortfolioClients();
    const expansion_ready = clients.filter(
      c => c.expansion_ready && c.stage !== 'churned',
    );
    const total_expansion_value_usd = expansion_ready.reduce(
      (sum, c) => sum + c.retainer_usd,
      0,
    );
    return NextResponse.json({
      clients: expansion_ready,
      count: expansion_ready.length,
      total_current_retainer_usd: total_expansion_value_usd,
    });
  } catch (error) {
    console.error('Admin portfolio expansion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
