/**
 * Agent 9 Worker — weekly portfolio + revenue snapshot.
 */

import { prisma } from '@/lib/prisma';
import { runAgent9Revenue } from './agent';
import type { Agent9Input, RetainerStatus } from './types';

function asRetainerStatus(stage: string): RetainerStatus {
  if (stage === 'active') return 'active';
  if (stage === 'expiring_soon' || stage === 'renewal') return 'expiring_soon';
  if (stage === 'cancelled' || stage === 'churned') return 'cancelled';
  if (stage === 'on_hold' || stage === 'paused') return 'on_hold';
  return 'active';
}

function daysOverdue(dueDate: Date): number {
  const ms = Date.now() - dueDate.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export interface RevenueSummary {
  active_clients: number;
  mrr_usd: number;
  arr_usd: number;
  clients_at_risk: number;
  pedro_alerts: number;
  cost_usd: number;
}

export async function runAgent9WeeklyPortfolio(): Promise<RevenueSummary> {
  const week_of = new Date().toISOString().split('T')[0];

  const portfolios = await prisma.clientPortfolio.findMany({
    where: { stage: { in: ['active', 'expiring_soon', 'on_hold'] } },
    take: 200,
  });

  const dbInvoices = await prisma.invoice.findMany({
    where: { paymentStatus: { in: ['pending', 'sent', 'overdue'] } },
    take: 200,
  });

  const active_clients = portfolios.map(p => ({
    client_id: p.clientId,
    vertical: p.vertical,
    retainer_usd: p.retainerUsd ?? 0,
    retainer_status: asRetainerStatus(p.stage),
    health_score: p.currentHealthScore ?? undefined,
    health_trend: undefined,
  }));

  const payments = dbInvoices.map(i => ({
    invoice_id: i.id,
    client_id: i.clientId,
    amount_usd: i.amountUsd,
    due_date: i.dueDate.toISOString(),
    paid_at: i.paidAt?.toISOString(),
    days_overdue: i.paidAt ? 0 : daysOverdue(i.dueDate),
  }));

  const input: Agent9Input = {
    trigger: 'cron_weekly',
    week_of,
    active_clients,
    payments,
    pipeline_proposals: [],
  };

  const synthesis = await runAgent9Revenue(input);
  const out = synthesis.final_output;

  return {
    active_clients: out.portfolio.portfolio_summary.total_active_clients,
    mrr_usd: out.financials.mrr_usd,
    arr_usd: out.financials.arr_usd,
    clients_at_risk: out.portfolio.portfolio_summary.clients_at_risk,
    pedro_alerts: out.pedro_alerts.length,
    cost_usd: synthesis.total_cost_usd,
  };
}
