/**
 * Agent 9 — Revenue Intelligence — Types
 * Source: UPTIMIZE_OPERATIONAL_AGENTS_COMPLETE.md (Part 2)
 */

export type RetainerStatus = 'active' | 'expiring_soon' | 'on_hold' | 'cancelled';
export type ClientPaymentStatus = 'current' | 'overdue_7' | 'overdue_14' | 'overdue_30' | 'write_off_risk';
export type Milestone = 'proof_of_concept' | 'product_market_fit' | 'scale' | 'investment_readiness';

export interface ClientPortfolioRecord {
  client_id: string;
  client_name?: string;
  vertical?: string;
  retainer_usd: number;
  retainer_status: RetainerStatus;
  payment_status: ClientPaymentStatus;
  health_score?: number;
  health_trend?: 'up' | 'down' | 'stable';
  weeks_below_60?: number;
  approval_queue_idle_days?: number;
  weekly_report_unread_weeks?: number;
  is_at_risk: boolean;
  is_expansion_ready: boolean;
  data_gaps: string[];
}

export interface PortfolioMonitorResult {
  clients: ClientPortfolioRecord[];
  portfolio_summary: {
    total_active_clients: number;
    total_mrr_usd: number;
    avg_health_score: number;
    clients_at_risk: number;
    clients_expansion_ready: number;
    payments_overdue: number;
    total_overdue_amount_usd: number;
  };
}

export interface FinancialMetricsResult {
  mrr_usd: number;
  arr_usd: number;
  nrr_pct?: number;
  nrr_basis: string;            // "Calculated" | "insufficient data — <reason>"
  gross_margin_pct?: number;
  gross_margin_basis: string;
  cac_usd?: number;
  cac_basis: string;
  ltv_usd?: number;
  ltv_basis: string;
  pipeline_value_usd: number;
  milestone_progress: {
    active_milestone: Milestone;
    progress_pct: number;
    estimated_months_to_milestone?: number;
    delta_from_last_week_usd: number;
  };
  top_3_revenue_risks: Array<{ description: string; impact_usd?: number }>;
  top_3_revenue_opportunities: Array<{ description: string; potential_usd?: number }>;
}

export type Agent9Trigger = 'cron_weekly' | 'on_payment_confirmed' | 'on_demand';

export interface Agent9Input {
  trigger: Agent9Trigger;
  week_of: string;
  active_clients: Array<{
    client_id: string;
    client_name?: string;
    vertical?: string;
    retainer_usd: number;
    retainer_status: RetainerStatus;
    health_score?: number;
    health_trend?: 'up' | 'down' | 'stable';
    weeks_below_60?: number;
    approval_queue_idle_days?: number;
    weekly_report_unread_weeks?: number;
  }>;
  payments: Array<{
    invoice_id: string;
    client_id: string;
    amount_usd: number;
    due_date: string;
    paid_at?: string;
    days_overdue?: number;
  }>;
  pipeline_proposals: Array<{
    proposal_id: string;
    client_id: string;
    estimated_close_value_usd: number;
    stage: string;
  }>;
  acquisition_costs?: { period_label: string; total_spend_usd: number; new_clients_acquired: number };
  delivery_costs?: { period_label: string; llm_cost_usd: number; pedro_hours: number };
  prior_period_mrr_usd?: number;
  expansion_mrr_this_period_usd?: number;
  churned_mrr_this_period_usd?: number;
}

export interface RevenueIntelligenceOutput {
  portfolio: PortfolioMonitorResult;
  financials: FinancialMetricsResult;
  pedro_alerts: Array<{ severity: 'P1' | 'P2' | 'P3'; description: string; client_id?: string }>;
  generated_at: string;
}
