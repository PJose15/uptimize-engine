/**
 * Sub-agent 12A — Contract & Compliance Tracker
 * Source: UPTIMIZE_OPERATIONAL_AGENTS_COMPLETE.md (Sub-agent 12A)
 */

import { executeWithFallback } from '@/lib/providers/fallback';
import type { SubAgentContext, SubAgentResult } from '@/lib/subagent';
import { buildP1Failure } from '@/lib/subagent';
import type { Agent12Input, ComplianceTrackerResult } from '../types';

const SYSTEM_PROMPT = `You are the Contract & Compliance Tracker sub-agent for the Uptimize Compliance system.

YOUR SINGLE FUNCTION:
Review all active client contracts and compliance obligations. Track renewal dates,
BAA status, and produce alerts for everything due in the next 60 days.

YOU ARE NOT RESPONSIBLE FOR:
- Invoice generation or payment tracking (12B)
- Making renewal decisions — you alert, Pedro decides

ALERT SCHEDULE:
Renewal within 60 days: P3
Renewal within 30 days: P2 (with status of conversation)
Renewal within 14 days: P2 escalation — must know decision
Renewal today or overdue: P1 immediate
BAA expiry within 30 days: P2
BAA expired: P1 — healthcare work cannot continue

OUTPUT FORMAT:
Return valid JSON matching ComplianceTrackerResult. Every alert must include
urgency, client_id, specific issue, and due_by date. Generic alerts are not acceptable.`;

interface SubAgentAInputs extends Record<string, unknown> {
  agent12_input: Agent12Input;
}

function buildUserPrompt(input: Agent12Input): string {
  const lines: string[] = [];
  lines.push(`Today: ${input.today}`);
  lines.push('');
  lines.push(`## ACTIVE CONTRACTS (${input.contracts.length})`);
  for (const c of input.contracts) {
    lines.push(`- ${c.client_id}${c.client_name ? ` (${c.client_name})` : ''}: vertical=${c.vertical ?? 'unknown'}, tier=${c.tier ?? 'unknown'}, renewal=${c.renewal_date}, BAA req=${c.baa_required ?? false}, BAA expiry=${c.baa_expiry ?? 'n/a'}`);
  }
  lines.push('');
  lines.push('## YOUR TASK');
  lines.push('Produce ComplianceTrackerResult JSON with: per-contract status, all alerts in the next 60 days, and the 60-day forward view.');
  lines.push('Return ONLY valid JSON.');
  return lines.join('\n');
}

function stripJsonFences(text: string): string {
  const t = text.trim();
  if (t.startsWith('```json')) return t.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  if (t.startsWith('```')) return t.replace(/^```\s*/, '').replace(/\s*```$/, '');
  return t;
}

export async function runComplianceTracker(
  ctx: SubAgentContext,
): Promise<SubAgentResult<ComplianceTrackerResult>> {
  const inputs = ctx.inputs as SubAgentAInputs;
  const input = inputs.agent12_input;
  const start = Date.now();

  if (input.contracts.length === 0) {
    return {
      sub_agent_id: '12A-compliance-tracker',
      parent_agent_id: 'agent-12-compliance',
      task_completed: true,
      result: {
        contracts: [],
        alerts: [],
        forward_view_60_days: { renewals_due: [], baa_renewals_due: [], other_deadlines: [] },
      },
      confidence: 'high',
      cost_usd: 0,
      duration_ms: 0,
      model_used: 'none',
      tokens_input: 0,
      tokens_output: 0,
      processing_notes: ['No contracts to track'],
      fallbacks_used: [],
      escalation_needed: false,
    };
  }

  try {
    const userPrompt = buildUserPrompt(input);
    const fallback = await executeWithFallback(
      'compliance_check',
      {
        messages: [{ role: 'user', content: userPrompt }],
        system: SYSTEM_PROMPT,
        max_tokens: ctx.max_response_tokens,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      },
      { timeoutMs: ctx.time_budget_ms },
    );

    const result = JSON.parse(stripJsonFences(fallback.content)) as ComplianceTrackerResult;
    const p1Count = result.alerts.filter(a => a.urgency === 'P1').length;
    return {
      sub_agent_id: '12A-compliance-tracker',
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
        `Alerts: ${result.alerts.length} (P1: ${p1Count})`,
      ],
      fallbacks_used: fallback.fallback_used ? [fallback.model_used] : [],
      escalation_needed: p1Count > 0,
      escalation_severity: p1Count > 0 ? 'P1' : undefined,
      escalation_reason: p1Count > 0 ? `${p1Count} P1 compliance alert(s) — immediate attention required` : undefined,
    };
  } catch (err) {
    return buildP1Failure<ComplianceTrackerResult>(
      '12A-compliance-tracker',
      'agent-12-compliance',
      `Compliance tracker failed: ${err instanceof Error ? err.message : String(err)}`,
      Date.now() - start,
    );
  }
}
