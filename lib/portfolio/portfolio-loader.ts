/**
 * Loader: Prisma `ClientPortfolio` rows -> PortfolioClientView shape used by
 * `portfolio-health` / `portfolio-patterns` pure functions.
 *
 * Source: UPTIMIZE_PORTFOLIO_MANAGEMENT_SPEC.md, Sprint 14.1
 */

import { prisma } from '@/lib/prisma';
import type { LifecycleStage, PortfolioClientView } from './portfolio-health';

const STAGES: ReadonlyArray<LifecycleStage> = [
  'onboarding',
  'active',
  'expansion',
  'at_risk',
  'churned',
];

function toLifecycleStage(s: string): LifecycleStage {
  return (STAGES as ReadonlyArray<string>).includes(s) ? (s as LifecycleStage) : 'active';
}

function toHealthTrend(s: string): PortfolioClientView['health_trend'] {
  if (s === 'improving' || s === 'stable' || s === 'declining') return s;
  return undefined;
}

function toAlertSeverity(s: string | null): PortfolioClientView['alert_severity'] {
  if (s === 'P1' || s === 'P2' || s === 'P3') return s;
  return undefined;
}

export async function loadPortfolioClients(): Promise<PortfolioClientView[]> {
  const portfolios = await prisma.clientPortfolio.findMany();
  if (portfolios.length === 0) return [];

  const configs = await prisma.clientConfig.findMany({
    where: { clientId: { in: portfolios.map(p => p.clientId) } },
    select: { clientId: true, name: true, company: true },
  });
  const nameByClientId = new Map(configs.map(c => [c.clientId, c.name || c.company]));

  return portfolios.map(p => ({
    client_id: p.clientId,
    client_name: nameByClientId.get(p.clientId),
    vertical: p.vertical,
    stage: toLifecycleStage(p.stage),
    retainer_usd: p.retainerUsd,
    current_health_score: p.currentHealthScore,
    previous_health_score: p.previousHealthScore,
    health_trend: toHealthTrend(p.healthTrend),
    expansion_ready: p.expansionReady,
    weekly_hours_estimate: p.weeklyHoursEstimate || undefined,
    has_open_alert: p.hasOpenAlert,
    alert_severity: toAlertSeverity(p.alertSeverity),
  }));
}

export async function loadPortfolioClient(clientId: string): Promise<PortfolioClientView | null> {
  const p = await prisma.clientPortfolio.findUnique({ where: { clientId } });
  if (!p) return null;
  const cfg = await prisma.clientConfig.findUnique({
    where: { clientId },
    select: { name: true, company: true },
  });
  return {
    client_id: p.clientId,
    client_name: cfg ? cfg.name || cfg.company : undefined,
    vertical: p.vertical,
    stage: toLifecycleStage(p.stage),
    retainer_usd: p.retainerUsd,
    current_health_score: p.currentHealthScore,
    previous_health_score: p.previousHealthScore,
    health_trend: toHealthTrend(p.healthTrend),
    expansion_ready: p.expansionReady,
    weekly_hours_estimate: p.weeklyHoursEstimate || undefined,
    has_open_alert: p.hasOpenAlert,
    alert_severity: toAlertSeverity(p.alertSeverity),
  };
}