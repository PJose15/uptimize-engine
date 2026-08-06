/**
 * Agent 12 — Compliance & Contract (Sequential: 12A → 12B)
 * Source: UPTIMIZE_OPERATIONAL_AGENTS_COMPLETE.md (Agent 12)
 */

import { runSequential, buildSubAgentContext } from '@/lib/subagent';
import { loadAgentMemory, commitAgentMemory } from '@/lib/learning/memory';
import type { AgentSynthesisResult, SubAgentResult } from '@/lib/subagent';
import { runComplianceTracker } from './subagents/12a-compliance-tracker';
import { runInvoiceManager } from './subagents/12b-invoice-manager';
import type {
  Agent12Input,
  ComplianceContractOutput,
  ComplianceTrackerResult,
  InvoiceManagerResult,
  ComplianceAlert,
} from './types';

export const AGENT_12_SYSTEM_PROMPT = `You are the Compliance & Contract Agent for Uptimize AI.

YOUR MISSION:
Track every contract, catch every renewal, meet every compliance deadline,
collect every invoice. Legal precision matters here.

WHAT YOU NEVER DO:
- Never mark contract renewed without Pedro's explicit confirmation
- Never write off overdue payment without Pedro
- Never invoice for scope not in signed contract
- Never miss a healthcare BAA renewal
- Never send a financial communication without Pedro's review`;

const TOTAL_TIMEOUT_MS = 90_000;

export async function runAgent12Compliance(
  input: Agent12Input,
  config: { mode?: 'fast' | 'balanced' | 'quality'; pipelineRunId?: string } = {},
): Promise<AgentSynthesisResult<ComplianceContractOutput>> {
  // Learnings distributed to this agent, delivered into sub-agent memory.
  const memory = await loadAgentMemory('agent-12-compliance');

  const baseCtx = buildSubAgentContext({
    parentAgentId: 'agent-12-compliance',
    subAgentId: '12A-compliance-tracker',
    clientId: 'system',
    pipelineRunId: config.pipelineRunId,
    task: 'Compliance check + invoice management',
    taskProfile: 'compliance_check',
    mode: config.mode ?? 'balanced',
    timeBudgetMs: TOTAL_TIMEOUT_MS,
    inputs: { agent12_input: input },
    memoryEntries: memory.entries,
    maxResponseTokens: 5000,
    confidenceRequired: 'high',
  });

  const { output, resultA, resultB } = await runSequential<
    ComplianceTrackerResult,
    InvoiceManagerResult,
    ComplianceContractOutput
  >(baseCtx, {
    pattern: 'sequential',
    totalTimeoutMs: TOTAL_TIMEOUT_MS,
    timeSplitA: 0.50,
    timeSplitB: 0.50,
    runA: (ctx) => runComplianceTracker({ ...ctx, sub_agent_id: '12A-compliance-tracker', task_profile: 'compliance_check' }),
    runB: (ctx, _aResult) => runInvoiceManager({ ...ctx, sub_agent_id: '12B-invoice-manager', task_profile: 'invoice_generation' }),
    synthesize: (a, b) => synthesize(a, b),
  });

  const subAgentResults: SubAgentResult<unknown>[] = [resultA, resultB];

  // A failed run leaves its notices pending rather than burning them.
  if (subAgentResults.some(r => r.task_completed)) {
    await commitAgentMemory(memory, { clientId: 'system', agentId: 'agent-12-compliance' });
  }
  const totalCost = subAgentResults.reduce((s, r) => s + r.cost_usd, 0);
  const totalDuration = subAgentResults.reduce((s, r) => s + r.duration_ms, 0);
  const requiresHumanAttention = subAgentResults.some(r => r.escalation_needed) || output.pedro_alerts.length > 0;

  return {
    agent_id: 'agent-12-compliance',
    final_output: output,
    sub_agent_results: subAgentResults,
    total_cost_usd: totalCost,
    total_duration_ms: totalDuration,
    synthesis_notes: [
      `Contracts tracked: ${output.compliance.contracts.length}`,
      `Compliance alerts: ${output.compliance.alerts.length}`,
      `Invoices generated: ${output.invoices.invoices_generated.length}, overdue: ${output.invoices.overdue_items.length}`,
      `Pedro-required alerts: ${output.pedro_alerts.length}`,
    ],
    overall_confidence: subAgentResults.some(r => r.confidence === 'low')
      ? 'low' : subAgentResults.some(r => r.confidence === 'medium') ? 'medium' : 'high',
    requires_human_attention: requiresHumanAttention,
    human_attention_reason: requiresHumanAttention
      ? subAgentResults.filter(r => r.escalation_needed).map(r => r.escalation_reason).filter(Boolean).join('; ') || undefined
      : undefined,
  };
}

function synthesize(
  a: SubAgentResult<ComplianceTrackerResult>,
  b: SubAgentResult<InvoiceManagerResult>,
): ComplianceContractOutput {
  const compliance = a.result ?? {
    contracts: [], alerts: [],
    forward_view_60_days: { renewals_due: [], baa_renewals_due: [], other_deadlines: [] },
  };
  const invoices = b.result ?? {
    invoices_generated: [], overdue_items: [],
    receivables_position: {
      total_outstanding_usd: 0, current_usd: 0,
      overdue_1_7_usd: 0, overdue_8_14_usd: 0, overdue_15_29_usd: 0, overdue_30_plus_usd: 0,
      clients_by_bucket: { current: [], '1-7': [], '8-14': [], '15-29': [], '30+': [] },
    },
  };

  // Pedro-alerts: P1+P2 from compliance + 30+ days overdue invoices as synthesized alerts
  const pedro_alerts: ComplianceAlert[] = compliance.alerts.filter(a => a.urgency === 'P1' || a.urgency === 'P2');
  for (const overdue of invoices.overdue_items.filter(o => o.bucket === '30+')) {
    pedro_alerts.push({
      urgency: 'P1',
      client_id: overdue.client_id,
      client_name: overdue.client_name,
      category: 'other',
      issue: `Invoice ${overdue.invoice_id} is ${overdue.days_overdue} days overdue ($${overdue.amount_usd})`,
      due_by: overdue.due_date,
      recommended_action: 'Pedro contacts client directly — automated sequence stopped at 30 days',
    });
  }

  return {
    compliance,
    invoices,
    pedro_alerts,
    generated_at: new Date().toISOString(),
  };
}
