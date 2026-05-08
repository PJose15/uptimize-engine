/**
 * Sub-agent 4B — QA Engineer
 *
 * Function: QA test plan + results, client handoff kit, post-launch monitoring.
 *           Includes the explicit go/no-go decision.
 * NOT responsible for: spec design (4A's domain).
 *
 * Source: Sprint 12.4. Skills: qa-six-test-types, go-no-go-decision.
 */

import { executeWithFallback } from '@/lib/providers/fallback';
import type { SubAgentContext, SubAgentResult } from '@/lib/subagent';
import { buildP1Failure } from '@/lib/subagent';
import type {
  QAPlanAndResults,
  ClientHandoffKit,
  PostLaunchMonitoring,
} from '../types';
import type { SpecDesignerResult, SpecDesignerInput } from './4a-spec-designer';

const SYSTEM_PROMPT = `You are the QA Engineer sub-agent for Uptimize Systems Delivery.

YOUR SINGLE FUNCTION:
Take the spec produced by Sub-agent 4A and produce: QA test plan with the six
test types, QA results summary with go/no-go decision, the client handoff kit
(SOPs + training), and the post-launch monitoring config.

YOU ARE NOT RESPONSIBLE FOR:
- Designing workflows or agent specs (4A already did)
- Modifying the data model or build plan (4A's domain)

THE SIX TEST TYPES (every workflow must have at least one of each):
1. happy_path: standard input flows through to expected output
2. missing_input: workflow handles incomplete data without crashing
3. wrong_input: workflow rejects malformed/invalid data with proper error
4. tool_failure: workflow degrades gracefully when an integration is down
5. safety: workflow refuses dangerous actions (mass-delete, mis-targeted send)
6. boundary: edge cases at the limits of expected ranges

GO/NO-GO DECISION:
GO requires:
  - Every workflow has all 6 test types defined
  - All happy_path and safety tests pass
  - Critical missing_input/wrong_input tests pass
  - At least one tool_failure test passes per integration
NO-GO if any of the above is unmet — list the specific blockers in open_issues.

CLIENT HANDOFF KIT:
quickstart_5min: 3-5 things the client can do in their first 5 minutes
daily_sop: the daily routine
weekly_sop: weekly metrics review process
exception_sop: how to handle each top exception
training_plan: 2-4 sessions with names and focus
admin_notes: anything Pedro should personally do that the client shouldn't see

POST-LAUNCH MONITORING:
kpis: 3-5 KPIs to watch
alerts: alert conditions with channels
support_process: how Agent 5 hands tickets back to delivery
weekly_review_format: agenda template

OUTPUT FORMAT:
Return valid JSON matching QaEngineerResult. No markdown fences.`;

export interface QaEngineerResult {
  qa_plan_and_results: QAPlanAndResults;
  client_handoff_kit: ClientHandoffKit;
  post_launch_monitoring: PostLaunchMonitoring;
  go_no_go: 'GO' | 'NO_GO';
  blockers: string[];
}

interface SubAgentBInputs extends Record<string, unknown> {
  spec_designer_input: SpecDesignerInput;
  sub_agent_a_result?: SpecDesignerResult;
}

function buildUserPrompt(input: SpecDesignerInput, spec: SpecDesignerResult): string {
  const lines: string[] = [];
  lines.push('## SPEC FROM 4A');
  lines.push(`Workflows: ${spec.workflow_specs.length}`);
  for (const w of spec.workflow_specs) {
    lines.push(`  - ${w.workflow_name}: goal="${w.goal}"`);
    lines.push(`    Exception paths: ${w.exception_paths.map(e => e.exception_name).join(', ')}`);
    lines.push(`    Audit events: ${w.audit_events_emitted?.join(', ') ?? '(none)'}`);
  }
  lines.push(`Agent specs: ${spec.agent_spec_sheets.length}`);
  lines.push(`Fallback modes: ${spec.fallback_modes.length}`);
  lines.push(`Audit retention: ${spec.audit_trail_spec.retention_policy}`);
  lines.push('');
  lines.push('## CLIENT TOOLS');
  lines.push(`Available: ${input.client_tools.available?.join(', ')}`);
  lines.push(`Restricted: ${input.client_tools.restricted?.join(', ')}`);
  lines.push('');
  lines.push('## TOP EXCEPTIONS (from handoff)');
  for (const e of input.handoff_spec.topExceptionsToHandle ?? []) {
    lines.push(`- ${e}`);
  }
  lines.push('');
  lines.push('## YOUR TASK');
  lines.push('Produce QaEngineerResult. Cover the six test types per workflow. Make a clear GO or NO_GO decision. List specific blockers.');
  lines.push('Return ONLY valid JSON. No markdown fences.');
  return lines.join('\n');
}

function stripJsonFences(text: string): string {
  const t = text.trim();
  if (t.startsWith('```json')) return t.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  if (t.startsWith('```')) return t.replace(/^```\s*/, '').replace(/\s*```$/, '');
  return t;
}

export async function runQaEngineer(
  ctx: SubAgentContext,
  spec: SpecDesignerResult,
): Promise<SubAgentResult<QaEngineerResult>> {
  const inputs = ctx.inputs as SubAgentBInputs;
  const input = inputs.spec_designer_input;
  const start = Date.now();

  try {
    const userPrompt = buildUserPrompt(input, spec);
    const fallback = await executeWithFallback(
      'discovery_audit',
      {
        messages: [{ role: 'user', content: userPrompt }],
        system: SYSTEM_PROMPT,
        max_tokens: ctx.max_response_tokens,
        temperature: 0.2,
        response_format: { type: 'json_object' },
      },
      { timeoutMs: ctx.time_budget_ms },
    );

    const result = JSON.parse(stripJsonFences(fallback.content)) as QaEngineerResult;

    return {
      sub_agent_id: '4B-qa-engineer',
      parent_agent_id: 'agent-4-systems-builder',
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
        `Decision: ${result.go_no_go}`,
        ...(result.blockers.length > 0 ? [`${result.blockers.length} blockers`] : []),
      ],
      fallbacks_used: fallback.fallback_used ? [fallback.model_used] : [],
      escalation_needed: result.go_no_go === 'NO_GO',
      escalation_severity: result.go_no_go === 'NO_GO' ? 'P2' : undefined,
      escalation_reason: result.go_no_go === 'NO_GO' ? `NO_GO: ${result.blockers.join('; ')}` : undefined,
    };
  } catch (err) {
    return buildP1Failure<QaEngineerResult>(
      '4B-qa-engineer',
      'agent-4-systems-builder',
      `QA engineer failed: ${err instanceof Error ? err.message : String(err)}`,
      Date.now() - start,
    );
  }
}
