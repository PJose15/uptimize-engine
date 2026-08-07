/**
 * Sub-agent 12B — Invoice & Collections Manager
 * Source: UPTIMIZE_OPERATIONAL_AGENTS_COMPLETE.md (Sub-agent 12B)
 */

import { executeWithFallback } from '@/lib/providers/fallback';
import { withMemoryContext } from '@/lib/subagent/context-builder';
import type { SubAgentContext, SubAgentResult } from '@/lib/subagent';
import { buildP1Failure } from '@/lib/subagent';
import type { Agent12Input, InvoiceManagerResult, OverdueInvoiceItem } from '../types';
import type { ComplianceTrackerResult } from '../types';

const SYSTEM_PROMPT = `You are the Invoice & Collections Manager sub-agent for the Uptimize Compliance system.

YOUR SINGLE FUNCTION:
Generate invoices per contract terms, track payment status, manage overdue follow-up
sequences, and report the receivables position.

YOU ARE NOT RESPONSIBLE FOR:
- Contract tracking or renewal management (12A)
- Making write-off decisions — only Pedro
- Sending any communication without Pedro's review

INVOICE GENERATION:
Generate 7 days before due date. Content: client, invoice_number, line items, due_date,
total. No invoices for scope not in the signed contract.

OVERDUE BUCKETS:
1-7 days: First gentle reminder (drafted, not sent)
8-14 days: Second notice (drafted)
15-29 days: Third notice (drafted, more direct)
30+ days: STOP automated sequence. P1 alert. Pedro handles directly.

ALL FOLLOW-UP COMMUNICATIONS:
approval_required: true. Always. No automated financial communications.

RECEIVABLES SUMMARY:
Total outstanding, current, and bucketed by age. Specific clients per bucket.

OUTPUT FORMAT:
Return valid JSON matching InvoiceManagerResult. Every overdue item must show
days_overdue, bucket, action_recommended. No markdown fences.`;

interface SubAgentBInputs extends Record<string, unknown> {
  agent12_input: Agent12Input;
  sub_agent_a_result?: ComplianceTrackerResult;
}

function buildUserPrompt(input: Agent12Input): string {
  const lines: string[] = [];
  lines.push(`Today: ${input.today}`);
  lines.push('');
  lines.push(`## ACTIVE INVOICES (${input.invoices.length})`);
  for (const i of input.invoices) {
    lines.push(`- ${i.invoice_id} (${i.invoice_number}) ${i.client_id}: $${i.amount_usd} due ${i.due_date}, status=${i.payment_status}, followups=${i.followup_count}${i.paid_at ? `, paid ${i.paid_at}` : ''}`);
  }
  lines.push('');
  lines.push(`## CONTRACTS FOR INVOICE GENERATION (${input.contracts.length})`);
  for (const c of input.contracts) {
    lines.push(`- ${c.client_id}: tier=${c.tier ?? 'unknown'}, retainer=$${c.monthly_retainer_usd ?? 0}/mo, build=$${c.build_fee_usd ?? 0}, terms=${c.payment_terms ?? 'monthly'}`);
  }
  lines.push('');
  lines.push('## YOUR TASK');
  lines.push('Generate any invoices due (7 days before due date per contract). Track current invoices into buckets. Draft follow-ups (approval_required=true).');
  lines.push('Produce the receivables_position summary. Return ONLY valid JSON matching InvoiceManagerResult.');
  return lines.join('\n');
}

function stripJsonFences(text: string): string {
  const t = text.trim();
  if (t.startsWith('```json')) return t.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  if (t.startsWith('```')) return t.replace(/^```\s*/, '').replace(/\s*```$/, '');
  return t;
}

function enforceApprovalRequired(result: InvoiceManagerResult): InvoiceManagerResult {
  for (const item of result.overdue_items) {
    item.approval_required = true;
  }
  return result;
}

export async function runInvoiceManager(
  ctx: SubAgentContext,
): Promise<SubAgentResult<InvoiceManagerResult>> {
  const inputs = ctx.inputs as SubAgentBInputs;
  const input = inputs.agent12_input;
  const start = Date.now();

  if (input.invoices.length === 0 && input.contracts.length === 0) {
    return {
      sub_agent_id: '12B-invoice-manager',
      parent_agent_id: 'agent-12-compliance',
      task_completed: true,
      result: {
        invoices_generated: [],
        overdue_items: [],
        receivables_position: {
          total_outstanding_usd: 0, current_usd: 0,
          overdue_1_7_usd: 0, overdue_8_14_usd: 0, overdue_15_29_usd: 0, overdue_30_plus_usd: 0,
          clients_by_bucket: { current: [], '1-7': [], '8-14': [], '15-29': [], '30+': [] },
        },
      },
      confidence: 'high',
      cost_usd: 0,
      duration_ms: 0,
      model_used: 'none',
      tokens_input: 0,
      tokens_output: 0,
      processing_notes: ['No invoices or contracts'],
      fallbacks_used: [],
      escalation_needed: false,
    };
  }

  try {
    // Learned context from previous runs, filtered to this sub-agent's
    // permitted memory keys by buildSubAgentContext.
    const userPrompt = withMemoryContext(buildUserPrompt(input), ctx.memory_context);
    const fallback = await executeWithFallback(
      'invoice_generation',
      {
        messages: [{ role: 'user', content: userPrompt }],
        system: SYSTEM_PROMPT,
        max_tokens: ctx.max_response_tokens,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      },
      { timeoutMs: ctx.time_budget_ms },
    );

    const result = enforceApprovalRequired(JSON.parse(stripJsonFences(fallback.content)) as InvoiceManagerResult);
    const thirtyPlusOverdue = result.overdue_items.filter((o: OverdueInvoiceItem) => o.bucket === '30+').length;

    return {
      sub_agent_id: '12B-invoice-manager',
      parent_agent_id: 'agent-12-compliance',
      task_completed: true,
      result,
      confidence: fallback.fallback_used ? 'medium' : 'high',
      cost_usd: fallback.cost_usd,
      duration_ms: Date.now() - start,
      model_used: fallback.model_used,
      tokens_input: fallback.usage.input_tokens,
      tokens_output: fallback.usage.output_tokens,
      processing_notes: [
        ...(fallback.fallback_used ? [`Fallback used (${fallback.attempts})`] : []),
        `Invoices generated: ${result.invoices_generated.length}, overdue: ${result.overdue_items.length}`,
      ],
      fallbacks_used: fallback.fallback_used ? [fallback.model_used] : [],
      escalation_needed: thirtyPlusOverdue > 0,
      escalation_severity: thirtyPlusOverdue > 0 ? 'P1' : undefined,
      escalation_reason: thirtyPlusOverdue > 0 ? `${thirtyPlusOverdue} invoice(s) 30+ days overdue — Pedro intervention required` : undefined,
    };
  } catch (err) {
    return buildP1Failure<InvoiceManagerResult>(
      '12B-invoice-manager',
      'agent-12-compliance',
      `Invoice manager failed: ${err instanceof Error ? err.message : String(err)}`,
      Date.now() - start,
    );
  }
}
