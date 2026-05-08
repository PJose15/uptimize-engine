/**
 * Agent 12 — Compliance & Contract — Types
 *
 * Source: UPTIMIZE_OPERATIONAL_AGENTS_COMPLETE.md (Part 5)
 */

export type AlertUrgency = 'P1' | 'P2' | 'P3';

export interface ComplianceAlert {
  urgency: AlertUrgency;
  client_id: string;
  client_name?: string;
  category: 'renewal' | 'baa' | 'sow_amendment' | 'other';
  issue: string;
  due_by: string;       // ISO 8601
  recommended_action: string;
}

export interface ContractStatusItem {
  client_id: string;
  client_name?: string;
  contract_start: string;
  renewal_date: string;
  notice_period_days: number;
  tier?: string;
  baa_required: boolean;
  baa_signed_at?: string;
  baa_expiry?: string;
  nda_signed: boolean;
  data_handling_in_sow: boolean;
  status: 'active' | 'pending_renewal' | 'expired' | 'terminated';
  days_to_renewal?: number;
}

// ============================================================================
// 12A — COMPLIANCE TRACKER RESULT
// ============================================================================

export interface ComplianceTrackerResult {
  contracts: ContractStatusItem[];
  alerts: ComplianceAlert[];
  forward_view_60_days: {
    renewals_due: Array<{ client_id: string; client_name?: string; due_by: string; urgency: AlertUrgency }>;
    baa_renewals_due: Array<{ client_id: string; client_name?: string; due_by: string; urgency: AlertUrgency }>;
    other_deadlines: Array<{ client_id: string; description: string; due_by: string; urgency: AlertUrgency }>;
  };
}

// ============================================================================
// 12B — INVOICE MANAGER RESULT
// ============================================================================

export type PaymentStatus = 'pending' | 'sent' | 'paid' | 'overdue' | 'write_off';
export type OverdueBucket = 'current' | '1-7' | '8-14' | '15-29' | '30+';

export interface GeneratedInvoice {
  invoice_id: string;
  client_id: string;
  invoice_number: string;
  amount_usd: number;
  due_date: string;
  line_items: Array<{ description: string; amount_usd: number }>;
  payment_status: PaymentStatus;
}

export interface OverdueInvoiceItem {
  invoice_id: string;
  client_id: string;
  client_name?: string;
  amount_usd: number;
  due_date: string;
  days_overdue: number;
  bucket: OverdueBucket;
  action_recommended: string;
  followup_communication?: string;  // Drafted, not sent
  followup_count: number;
  approval_required: true;          // Always true — no auto-send for $$
}

export interface ReceivablesPosition {
  total_outstanding_usd: number;
  current_usd: number;
  overdue_1_7_usd: number;
  overdue_8_14_usd: number;
  overdue_15_29_usd: number;
  overdue_30_plus_usd: number;
  clients_by_bucket: Record<OverdueBucket, string[]>; // arrays of client_ids
}

export interface InvoiceManagerResult {
  invoices_generated: GeneratedInvoice[];
  overdue_items: OverdueInvoiceItem[];
  receivables_position: ReceivablesPosition;
}

// ============================================================================
// AGENT 12 INPUT / OUTPUT
// ============================================================================

export type Agent12Trigger = 'cron_daily' | 'on_contract_signed' | 'on_demand';

export interface Agent12ContractInput {
  client_id: string;
  client_name?: string;
  vertical?: string;
  contract_start: string;
  renewal_date: string;
  notice_period_days?: number;
  tier?: string;
  baa_required?: boolean;
  baa_signed_at?: string;
  baa_expiry?: string;
  nda_signed?: boolean;
  monthly_retainer_usd?: number;
  build_fee_usd?: number;
  payment_terms?: string;
  scope_inclusions?: string[];
}

export interface Agent12InvoiceInput {
  invoice_id: string;
  client_id: string;
  invoice_number: string;
  amount_usd: number;
  due_date: string;
  payment_status: PaymentStatus;
  paid_at?: string;
  followup_count: number;
}

export interface Agent12Input {
  trigger: Agent12Trigger;
  today: string;                        // ISO date
  contracts: Agent12ContractInput[];
  invoices: Agent12InvoiceInput[];
}

export interface ComplianceContractOutput {
  compliance: ComplianceTrackerResult;
  invoices: InvoiceManagerResult;
  pedro_alerts: ComplianceAlert[];      // Subset of alerts that are P1/P2 or financially material
  generated_at: string;
}
