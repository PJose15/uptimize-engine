/**
 * Sub-agent 6B — Contract Orchestrator
 *
 * Function: SOW + signature tracking + credential collection + portal setup + Agent 4 briefing.
 * NOT responsible for: negotiating scope/pricing, building anything.
 *
 * Source: UPTIMIZE_AGENT_PROMPTS_PIPELINE_V2.md (Sub-agent 6B)
 */

import { executeWithFallback } from '@/lib/providers/fallback';
import { withMemoryContext } from '@/lib/subagent/context-builder';
import type { SubAgentContext, SubAgentResult } from '@/lib/subagent';
import { buildP1Failure } from '@/lib/subagent';
import type {
  Agent6Input,
  ContractOrchestratorResult,
  PresentationCoachResult,
  PresentationOutcome,
} from '../types';

const SYSTEM_PROMPT = `You are the Contract Orchestrator sub-agent for the Uptimize Closer system.

YOUR SINGLE FUNCTION:
Execute all mechanics of onboarding after agreement is reached — generate the SOW,
track signature, collect and test credentials, set up the client portal, schedule
kickoff, and produce the complete briefing for Agent 4. You execute. You do not negotiate.
The terms were determined by 6A and Pedro. You document and confirm them.

YOU ARE NOT RESPONSIBLE FOR:
- Negotiating scope or pricing (that is Sub-agent 6A and Pedro's domain)
- Building anything — you hand off a complete, confirmed build brief to Agent 4
- Making judgment calls on scope — if anything is ambiguous, flag it immediately

SOW GENERATION RULES:
Include explicitly: every scope_inclusion from the agreed terms
Include explicitly: every scope_exclusion — what is NOT included is as legally
  important as what is included. Exclusions prevent scope creep and disputes.
Include: payment terms, start date, notice period, data handling statement
Language: Plain English. No legal jargon unless required by client's jurisdiction.

SIGNATURE TRACKING:
Follow-up at 24hr, 72hr, and 7-day intervals if unsigned. Escalate to Pedro at 7 days.
Never modify the SOW without Pedro's explicit instruction after the first version is sent.

CREDENTIAL COLLECTION:
Generate the credential checklist from Agent 4's required_integrations list.
For each integration: specify exactly what format is needed, where to enter it,
  what permissions must be granted, and how to verify it worked.
Test protocol: receive credential → store in secrets manager → run connection test →
  confirm result. Never mark as confirmed until the test passes.
Failure protocol: if a credential fails twice → flag to Pedro with specific error.

PORTAL SETUP:
Create ClientConfig in the database. Generate portal login. Send welcome email with
login instructions. Confirm receipt. Never mark portal_created = true until the
client has successfully logged in at least once.

OUTPUT FORMAT:
Return valid JSON matching the ContractOrchestratorResult type. The field
ready_for_build must be false unless: contract_status.signed_at is populated AND
credential_status.all_required_tested is true AND client_setup.portal_created is true.
If ready_for_build is false, list every blocker explicitly in credential_status.blockers.`;

interface SubAgentBInputs extends Record<string, unknown> {
  agent6_input: Agent6Input;
  sub_agent_a_result?: PresentationCoachResult;
}

function buildUserPrompt(input: Agent6Input, presentationResult: PresentationCoachResult | undefined): string {
  const lines: string[] = [];
  lines.push(`MODE: ${input.mode}`);
  lines.push(`Client ID: ${input.client_id}`);
  lines.push('');

  if (input.mode === 'pre_close') {
    lines.push('Pre-close mode: produce contract_status with sow_generated=false, credential_status with collected_count=0, client_setup with portal_created=false. ready_for_build MUST be false. agent_4_briefing MUST be null. List the required_integrations as upcoming credential blockers (anticipated, not actual failures).');
    lines.push('');
  } else {
    const outcome: PresentationOutcome | undefined = input.presentation_outcome;
    if (!outcome || outcome.status !== 'signed') {
      lines.push(`Post-close mode but outcome is "${outcome?.status ?? 'unknown'}" — produce contract_status reflecting current state, credential_status with collected_count=0, ready_for_build=false. Do NOT generate SOW or briefing yet.`);
    } else {
      lines.push('Post-close mode with signed outcome: generate the SOW, the credential checklist, the client setup steps, and the Agent 4 briefing.');
      lines.push('');
      lines.push('## AGREED TERMS (from Pedro-logged outcome)');
      lines.push(`Tier: ${outcome.agreed_tier}`);
      lines.push(`Build fee: $${outcome.agreed_build_fee_usd}`);
      lines.push(`Monthly retainer: $${outcome.agreed_monthly_retainer_usd}`);
      if (outcome.payment_terms) lines.push(`Payment terms: ${outcome.payment_terms}`);
      lines.push(`Scope inclusions: ${outcome.scope_inclusions?.join('; ') ?? '(none provided)'}`);
      lines.push(`Scope exclusions: ${outcome.scope_exclusions?.join('; ') ?? '(none provided)'}`);
      if (outcome.phase_2_preview?.length) lines.push(`Phase 2 preview: ${outcome.phase_2_preview.join('; ')}`);
      lines.push(`Relationship tone: ${outcome.relationship_tone}`);
      lines.push(`Specific concerns for build: ${outcome.specific_concerns_for_build.join('; ')}`);
      lines.push(`Client priorities stated: ${outcome.client_priorities_stated.join('; ')}`);
      if (outcome.objections_raised.length) {
        lines.push('Objections that came up:');
        for (const o of outcome.objections_raised) {
          lines.push(`  - ${o.objection} → ${o.resolution}${o.any_commitments_made ? ` (commitment: ${o.any_commitments_made})` : ''}`);
        }
      }
      lines.push('');
    }
  }

  lines.push('## REQUIRED INTEGRATIONS (from Agent 3 build readiness)');
  for (const integ of input.build_readiness.required_integrations) {
    lines.push(`- ${integ.system_name} (${integ.system_type}, ${integ.credential_type})${integ.instructions ? `: ${integ.instructions}` : ''}`);
  }
  lines.push('');
  lines.push(`Known constraints: ${input.build_readiness.known_constraints.join('; ')}`);
  lines.push(`Timeline expectations: ${input.build_readiness.timeline_expectations}`);
  lines.push('');

  if (presentationResult) {
    lines.push('## SUB-AGENT 6A OUTPUT (for context — do not duplicate)');
    lines.push(`Pre-presentation guide produced. Closing question: "${presentationResult.pre_presentation_guide.closing_question}"`);
    if (presentationResult.post_presentation_debrief) {
      lines.push(`Debrief captured: ${presentationResult.post_presentation_debrief.what_actually_happened}`);
    }
    lines.push('');
  }

  lines.push('## ORIGINAL AGENT 3 SPEC');
  lines.push('Pass the agent3_handoff_spec through to the agent_4_briefing.original_agent3_spec field exactly as received.');
  lines.push('');
  lines.push('## YOUR TASK');
  lines.push('Return valid JSON matching ContractOrchestratorResult. No markdown fences. No explanation.');
  lines.push('Critical rules:');
  lines.push('- ready_for_build must be FALSE unless contract is signed AND all credentials tested AND portal created.');
  lines.push('- agent_4_briefing must be NULL when ready_for_build is false.');
  lines.push('- credential_reference values must be secrets-manager keys, NEVER actual credentials.');
  lines.push('- Every scope modification (inclusion added or removed vs original proposal) must be listed in scope_modifications.');
  lines.push('- Every commitment from objection resolution must appear in build_directives with source="objection_resolution".');

  return lines.join('\n');
}

function stripJsonFences(text: string): string {
  const t = text.trim();
  if (t.startsWith('```json')) return t.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  if (t.startsWith('```')) return t.replace(/^```\s*/, '').replace(/\s*```$/, '');
  return t;
}

function parseResult(text: string, originalAgent3Spec: unknown): ContractOrchestratorResult {
  const cleaned = stripJsonFences(text);
  const parsed = JSON.parse(cleaned) as ContractOrchestratorResult;

  if (parsed.agent_4_briefing && !parsed.agent_4_briefing.original_agent3_spec) {
    parsed.agent_4_briefing.original_agent3_spec = originalAgent3Spec;
  }

  const cs = parsed.contract_status;
  const cr = parsed.credential_status;
  const st = parsed.client_setup;
  const enforced =
    Boolean(cs?.signed_at) &&
    Boolean(cr?.all_required_tested) &&
    Boolean(st?.portal_created);

  if (parsed.ready_for_build && !enforced) {
    parsed.ready_for_build = false;
    parsed.agent_4_briefing = null;
  }

  return parsed;
}

export async function runContractOrchestrator(
  ctx: SubAgentContext,
  presentationResult: PresentationCoachResult,
): Promise<SubAgentResult<ContractOrchestratorResult>> {
  const inputs = ctx.inputs as SubAgentBInputs;
  const agent6Input = inputs.agent6_input;
  const start = Date.now();

  try {
    // Learned context from previous runs, filtered to this sub-agent's
    // permitted memory keys by buildSubAgentContext.
    const userPrompt = withMemoryContext(buildUserPrompt(agent6Input, presentationResult), ctx.memory_context);
    const fallback = await executeWithFallback(
      'sow_generation',
      {
        messages: [{ role: 'user', content: userPrompt }],
        system: SYSTEM_PROMPT,
        max_tokens: ctx.max_response_tokens,
        temperature: 0.2,
        response_format: { type: 'json_object' },
      },
      { timeoutMs: ctx.time_budget_ms },
    );

    const result = parseResult(fallback.content, agent6Input.build_readiness.agent3_handoff_spec);

    const blockerCount = result.credential_status.blockers.length;
    const escalation_needed = blockerCount > 0 && result.credential_status.blockers.some(b => b.attempts >= 2);

    return {
      sub_agent_id: '6B-contract-orchestrator',
      parent_agent_id: 'agent-6-closer',
      task_completed: true,
      result,
      confidence: fallback.fallback_used ? 'medium' : 'high',
      cost_usd: fallback.cost_usd,
      duration_ms: Date.now() - start,
      model_used: fallback.model_used,
      tokens_input: fallback.usage.input_tokens,
      tokens_output: fallback.usage.output_tokens,
      processing_notes: [
        ...(fallback.fallback_used ? [`Fallback used: ${fallback.attempts} attempts`] : []),
        ...(blockerCount > 0 ? [`${blockerCount} credential blocker(s) reported`] : []),
        ...(result.ready_for_build ? ['Ready for build — Agent 4 briefing assembled'] : ['Not yet ready for build']),
      ],
      fallbacks_used: fallback.fallback_used ? [fallback.model_used] : [],
      escalation_needed,
      escalation_reason: escalation_needed
        ? `Credential failed twice: ${result.credential_status.blockers.filter(b => b.attempts >= 2).map(b => b.system_name).join(', ')}`
        : undefined,
      escalation_severity: escalation_needed ? 'P1' : undefined,
    };
  } catch (err) {
    return buildP1Failure<ContractOrchestratorResult>(
      '6B-contract-orchestrator',
      'agent-6-closer',
      `Contract orchestrator failed: ${err instanceof Error ? err.message : String(err)}`,
      Date.now() - start,
    );
  }
}
