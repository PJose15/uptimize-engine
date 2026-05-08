/**
 * Portfolio Health & Capacity — pure functions
 *
 * Source: UPTIMIZE_PORTFOLIO_MANAGEMENT_SPEC.md, Sprint 14.1
 */

export type LifecycleStage = 'onboarding' | 'active' | 'expansion' | 'at_risk' | 'churned';

export interface PortfolioClientView {
  client_id: string;
  client_name?: string;
  vertical: string;
  stage: LifecycleStage;
  retainer_usd: number;
  current_health_score: number;
  previous_health_score?: number;
  health_trend?: 'improving' | 'stable' | 'declining';
  expansion_ready: boolean;
  weekly_hours_estimate?: number;
  has_open_alert?: boolean;
  alert_severity?: 'P1' | 'P2' | 'P3';
}

// ============================================================================
// CAPACITY MODEL — Pedro's weekly load (per spec: 33.5h/week cap)
// ============================================================================

export const WEEKLY_CAPACITY_HOURS = 33.5;

export const STAGE_WEEKLY_HOURS: Record<LifecycleStage, number> = {
  onboarding: 8,
  active: 4,
  expansion: 6,
  at_risk: 8,
  churned: 0,
};

export interface CapacityLoad {
  total_hours_committed: number;
  capacity_hours: number;
  utilization_pct: number;
  is_overloaded: boolean;
  over_capacity_hours: number;
  per_client: Array<{ client_id: string; stage: LifecycleStage; hours: number }>;
}

export function calculateWeeklyLoad(clients: PortfolioClientView[]): CapacityLoad {
  const per_client = clients
    .filter(c => c.stage !== 'churned')
    .map(c => ({
      client_id: c.client_id,
      stage: c.stage,
      hours: c.weekly_hours_estimate ?? STAGE_WEEKLY_HOURS[c.stage],
    }));

  const total = per_client.reduce((sum, c) => sum + c.hours, 0);
  const utilization_pct = (total / WEEKLY_CAPACITY_HOURS) * 100;
  const is_overloaded = total > WEEKLY_CAPACITY_HOURS;
  const over_capacity_hours = Math.max(0, total - WEEKLY_CAPACITY_HOURS);

  return {
    total_hours_committed: total,
    capacity_hours: WEEKLY_CAPACITY_HOURS,
    utilization_pct,
    is_overloaded,
    over_capacity_hours,
    per_client,
  };
}

// ============================================================================
// PORTFOLIO HEALTH SCORE — retainer-weighted average
// ============================================================================

export interface PortfolioHealth {
  weighted_score_0_100: number;
  simple_avg_score_0_100: number;
  total_active_clients: number;
  at_risk_count: number;
  expansion_ready_count: number;
  trending_up_count: number;
  trending_down_count: number;
  total_mrr_usd: number;
  health_distribution: {
    healthy: number;     // 80+
    watch: number;       // 60-79
    at_risk: number;     // < 60
  };
}

export function calculatePortfolioHealthScore(clients: PortfolioClientView[]): PortfolioHealth {
  const active = clients.filter(c => c.stage !== 'churned');
  if (active.length === 0) {
    return {
      weighted_score_0_100: 0,
      simple_avg_score_0_100: 0,
      total_active_clients: 0,
      at_risk_count: 0,
      expansion_ready_count: 0,
      trending_up_count: 0,
      trending_down_count: 0,
      total_mrr_usd: 0,
      health_distribution: { healthy: 0, watch: 0, at_risk: 0 },
    };
  }

  const totalRetainer = active.reduce((s, c) => s + c.retainer_usd, 0);
  // Retainer-weighted score (higher-revenue clients matter more to portfolio health).
  // Falls back to simple average if retainers are all zero (test data, etc.)
  const weighted = totalRetainer > 0
    ? active.reduce((s, c) => s + c.current_health_score * c.retainer_usd, 0) / totalRetainer
    : active.reduce((s, c) => s + c.current_health_score, 0) / active.length;

  const simple = active.reduce((s, c) => s + c.current_health_score, 0) / active.length;

  return {
    weighted_score_0_100: Math.round(weighted),
    simple_avg_score_0_100: Math.round(simple),
    total_active_clients: active.length,
    at_risk_count: active.filter(c => c.current_health_score < 60 || c.stage === 'at_risk').length,
    expansion_ready_count: active.filter(c => c.expansion_ready).length,
    trending_up_count: active.filter(c => c.health_trend === 'improving').length,
    trending_down_count: active.filter(c => c.health_trend === 'declining').length,
    total_mrr_usd: totalRetainer,
    health_distribution: {
      healthy: active.filter(c => c.current_health_score >= 80).length,
      watch: active.filter(c => c.current_health_score >= 60 && c.current_health_score < 80).length,
      at_risk: active.filter(c => c.current_health_score < 60).length,
    },
  };
}
