/**
 * Agent 12 Worker — daily compliance run + event-triggered on contract signed.
 */

import { prisma } from '@/lib/prisma';
import { runAgent12Compliance } from './agent';
import type { Agent12Input, Agent12ContractInput, Agent12InvoiceInput, PaymentStatus } from './types';

function asPaymentStatus(s: string): PaymentStatus {
  return (s === 'pending' || s === 'sent' || s === 'paid' || s === 'overdue' || s === 'write_off') ? s : 'pending';
}

export interface DailyComplianceSummary {
  contracts_tracked: number;
  alerts_total: number;
  pedro_alerts: number;
  overdue_invoices: number;
  invoices_generated: number;
  cost_usd: number;
}

export async function runDailyCompliance(): Promise<DailyComplianceSummary> {
  const today = new Date().toISOString().split('T')[0];

  const dbCompliance = await prisma.complianceRecord.findMany({
    where: { status: 'active' },
    take: 200,
  });

  const dbInvoices = await prisma.invoice.findMany({
    where: { paymentStatus: { in: ['pending', 'sent', 'overdue'] } },
    take: 200,
  });

  const contracts: Agent12ContractInput[] = dbCompliance
    .filter(c => c.recordType === 'contract')
    .map(c => ({
      client_id: c.clientId,
      contract_start: c.effectiveDate.toISOString(),
      renewal_date: c.expiryDate?.toISOString() ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      notice_period_days: 30,
      baa_required: c.requiresBAA,
      baa_signed_at: c.baaSignedAt?.toISOString(),
      baa_expiry: undefined,
      nda_signed: false,
    }));

  const invoices: Agent12InvoiceInput[] = dbInvoices.map(i => ({
    invoice_id: i.id,
    client_id: i.clientId,
    invoice_number: i.invoiceNumber,
    amount_usd: i.amountUsd,
    due_date: i.dueDate.toISOString(),
    payment_status: asPaymentStatus(i.paymentStatus),
    paid_at: i.paidAt?.toISOString(),
    followup_count: i.followUpCount,
  }));

  const input: Agent12Input = {
    trigger: 'cron_daily',
    today,
    contracts,
    invoices,
  };

  const synthesis = await runAgent12Compliance(input);
  const out = synthesis.final_output;

  // Persist generated invoices (best-effort)
  for (const gen of out.invoices.invoices_generated) {
    try {
      await prisma.invoice.upsert({
        where: { invoiceNumber: gen.invoice_number },
        update: {},
        create: {
          clientId: gen.client_id,
          invoiceNumber: gen.invoice_number,
          amountUsd: gen.amount_usd,
          dueDate: new Date(gen.due_date),
          paymentStatus: gen.payment_status,
          lineItems: JSON.stringify(gen.line_items),
        },
      });
    } catch (err) {
      console.error('[agent-12 worker] invoice persist failed:', err);
    }
  }

  return {
    contracts_tracked: out.compliance.contracts.length,
    alerts_total: out.compliance.alerts.length,
    pedro_alerts: out.pedro_alerts.length,
    overdue_invoices: out.invoices.overdue_items.length,
    invoices_generated: out.invoices.invoices_generated.length,
    cost_usd: synthesis.total_cost_usd,
  };
}

/**
 * Triggered by event-dispatcher.onAgent6Complete when a contract is signed.
 * Creates a ComplianceRecord. If a build fee was agreed, also creates the
 * initial invoice record per payment terms.
 */
export async function notifyAgent12OfContractSigned(input: {
  clientId: string;
  signedAt: string;
  agreedTerms?: { build_fee_usd?: number; monthly_retainer_usd?: number; payment_terms?: string };
  baaRequired?: boolean;
}): Promise<void> {
  try {
    await prisma.complianceRecord.create({
      data: {
        clientId: input.clientId,
        recordType: 'contract',
        effectiveDate: new Date(input.signedAt),
        status: 'active',
        requiresBAA: input.baaRequired ?? false,
      },
    });
  } catch (err) {
    console.error('[agent-12 worker] contract record create failed:', err);
  }

  // Initial invoice for build fee (if applicable) — half at signing per typical 50/50 terms
  const buildFee = input.agreedTerms?.build_fee_usd ?? 0;
  if (buildFee > 0) {
    try {
      const initialAmount = (input.agreedTerms?.payment_terms ?? '').includes('50')
        ? buildFee / 2
        : buildFee;
      await prisma.invoice.create({
        data: {
          clientId: input.clientId,
          invoiceNumber: `INV-${input.clientId}-${Date.now()}`,
          amountUsd: initialAmount,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          paymentStatus: 'pending',
          lineItems: JSON.stringify([{ description: 'Build fee — initial', amount_usd: initialAmount }]),
        },
      });
    } catch (err) {
      console.error('[agent-12 worker] initial invoice create failed:', err);
    }
  }
}
