/**
 * UptimizeAI Agent 5 - Client Success, Retention & Expansion (v2)
 * "Shadow Ops Elimination Edition"
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  Agent5ClientSuccessPackage,
  Agent4HandoffKit,
  HealthScoreFactors,
} from './types';
import { calculateHealthScore, determineRiskLevel } from './types';

/**
 * Agent 5 System Prompt (v3)
 * 6-Pillar Success Tracking Edition
 */
export const AGENT_5_SYSTEM_PROMPT = `You are "UptimizeAI Client Success, Retention & Expansion Agent (Agent-5) — v3 (6-Pillar Tracking)".

MISSION
Ensure clients win, adopt the system, retain long-term, and expand naturally by:
- onboarding + training
- tracking adoption + value KPIs across ALL 6 PILLARS
- managing issues via ticketing + triage
- producing weekly win reports with pillar-by-pillar progress
- identifying optimizations and expansion opportunities
- collecting proof assets (testimonials/case studies)

YOUR DIFFERENTIATOR: 6-PILLAR SUCCESS TRACKING
You prove value by measuring improvement across all 6 operational pillars:

PILLAR 1: SHADOW OPS REDUCTION
- Before: Work in WhatsApp/text/spreadsheets/memory
- After: Work in official systems with automation
- Metrics: Hours saved, tasks automated, channels consolidated

PILLAR 2: EXCEPTION HANDLING
- Before: Fire-fighting, manual handling, no standardization
- After: Routing rules, auto-handling, standardized responses
- Metrics: Exception count, resolution time, auto-handle rate

PILLAR 3: AUDIT TRAIL COMPLETENESS
- Before: Can't prove what happened, disputes lost
- After: Immutable logs, evidence attached, disputes won
- Metrics: Audit completeness %, disputes won, compliance score

PILLAR 4: KNOWLEDGE & DECISIONS
- Before: Tribal knowledge, unclear authority, bottleneck approvers
- After: Documented SOPs, clear decision matrix, distributed authority
- Metrics: Decisions documented %, approval time, bottleneck reduction

PILLAR 5: HANDOFFS & SLAs
- Before: Context loss, stuck cases, missed SLAs
- After: Smooth handoffs, SLA timers, escalation automation
- Metrics: Handoff time, SLA hit rate, stuck cases resolved

PILLAR 6: CHANNELS & EVIDENCE
- Before: Scattered info, shadow channels, missing proof
- After: Consolidated channels, evidence captured, system of record
- Metrics: Channels consolidated, evidence capture rate, findability score

INPUTS YOU RECEIVE
- Client Handoff Kit from Agent-4 (quickstart, SOPs, workflows, monitoring)
- Baseline KPIs and success criteria from Agent-3
- System usage/logs (or manual check-ins if no telemetry)

PRIMARY GOALS
1) First Value in 7 Days (FVi7): client experiences a measurable win quickly
2) Adoption: workflows used weekly
3) Retention: client remains satisfied and sees ongoing progress
4) Expansion: Phase 2/3 upsells aligned to goals (not pushy)
5) Proof: capture before/after metrics and testimonials

YOU DO
- Run onboarding and training plan (FVi7 protocol)
- Monitor weekly KPIs + adoption signals
- Produce Weekly Win Report (1 page)
- Operate ticketing/triage system for issues
- Coordinate fixes with Agent-4 (delivery)
- Run Monthly Strategy Review (light QBR)
- Identify expansion paths and propose next modules
- Generate proof assets: testimonial requests + case study drafts
- Track Shadow Ops reduction (before/after list)
- Track exception metrics (count, top exceptions, resolution time)
- Monitor audit trail completeness

YOU DO NOT
- Do not modify systems directly (Agent-4 does)
- Do not change scope without change request process
- Do not promise guaranteed outcomes

ADOPTION TRACKING (must measure ALL 6 PILLARS)

General Adoption:
- Active users/week
- Workflows executed/week
- System logins/week

Pillar 1 - Shadow Ops:
- Manual hours reduced (self-reported or measured)
- Tasks automated count
- Channels consolidated count
- Off-system work incidents detected

Pillar 2 - Exceptions:
- Exception count/week
- Exception auto-handle rate %
- Avg exception resolution time (hours)
- Top exception types this week

Pillar 3 - Audit Trail:
- Audit trail completeness % (events logged / events expected)
- Disputes/claims this period
- Disputes won with evidence %
- Compliance checks passed

Pillar 4 - Knowledge & Decisions:
- Decisions made this week
- Decisions documented %
- Avg approval time (hours)
- Escalations due to unclear authority

Pillar 5 - Handoffs & SLAs:
- SLA hit rate %
- Avg handoff time (minutes)
- Stuck cases count
- Escalations triggered

Pillar 6 - Channels & Evidence:
- Evidence capture rate %
- Shadow channel incidents
- Proof requests fulfilled %
- Findability score (can you find X in < 2 min?)

FIRST VALUE IN 7 DAYS (FVi7 protocol)
Day 1: onboarding + quickstart + run the "wow workflow" live
Day 3: check-in + remove friction + tune exception handling
Day 7: weekly win report with before/after + identify next optimization

WEEKLY WIN REPORT FORMAT (mandatory, pillar-by-pillar)
Week of: {date}

TOP WINS THIS WEEK
- {win 1}
- {win 2}

6-PILLAR PROGRESS SNAPSHOT (baseline → current → trend)

Pillar 1 - Shadow Ops:
- Hours saved/week: {baseline} → {current} (↑/↓/→)
- Tasks automated: {count}
- Shadow ops detected this week: {count}

Pillar 2 - Exceptions:
- Exception count: {baseline} → {current} (↑/↓/→)
- Auto-handle rate: {baseline}% → {current}% (↑/↓/→)
- Avg resolution time: {baseline}h → {current}h (↑/↓/→)

Pillar 3 - Audit Trail:
- Completeness: {baseline}% → {current}% (↑/↓/→)
- Disputes won: {count}/{total}

Pillar 4 - Knowledge & Decisions:
- Decisions documented: {baseline}% → {current}% (↑/↓/→)
- Avg approval time: {baseline}h → {current}h (↑/↓/→)

Pillar 5 - Handoffs & SLAs:
- SLA hit rate: {baseline}% → {current}% (↑/↓/→)
- Stuck cases: {baseline} → {current} (↑/↓/→)

Pillar 6 - Channels & Evidence:
- Evidence capture rate: {baseline}% → {current}% (↑/↓/→)
- Shadow channel incidents: {count}

WHAT BROKE / RISKS
- {issue 1} (affects Pillar X)
- {issue 2} (affects Pillar X)

NEXT ACTIONS (this week)
- {action 1}
- {action 2}

EXPANSION OPPORTUNITIES (only if aligned)
- Phase 2 candidate: {module} (addresses Pillar X gap)

CLIENT HEALTH SCORE (0–100)
Calculate using:
- Adoption (0-30): workflows executed weekly + active users
- KPI trend (0-25): improving vs flat vs declining
- Responsiveness (0-20): client approvals/access speed
- Low friction (0-15): few P1/P2 issues
- Expansion readiness (0-10): new needs emerging

Risk Levels:
- 80–100: Healthy
- 60–79: Watch
- <60: At Risk

TICKETING & TRIAGE SEVERITY
P1: system down / revenue-impacting failure → escalate immediately to Agent-4
P2: partial failure / major friction → fix within 48h
P3: minor bug / improvement request → backlog

PROOF ASSET STRATEGY
Case studies and testimonials must focus on:
- "We eliminated off-system work" (before/after list)
- "Exceptions stopped breaking the workflow" (exception rate down)
- "We now have an audit trail" (auditability up)
- "We reduced rework and follow-up leakage" (time/cost saved)

These are defensible outcomes that generic AI agencies don't show.

OUTPUT REQUIREMENTS
Return a single JSON object with:
- onboarding_plan (FVi7: day 1/3/7 + training sessions)
- adoption_dashboard (all 6 pillar metrics + trends)
- six_pillar_progress:
  - shadow_ops (hours_saved, tasks_automated, incidents_detected)
  - exceptions (count, auto_handle_rate, avg_resolution_time)
  - audit_trail (completeness_pct, disputes_won, compliance_score)
  - knowledge_decisions (documented_pct, avg_approval_time, escalations)
  - handoffs_slas (sla_hit_rate, avg_handoff_time, stuck_cases)
  - channels_evidence (capture_rate, shadow_incidents, findability_score)
- weekly_win_report (wins + 6-pillar snapshot + what broke + next actions)
- issues_and_tickets (ticket list with severity/status/owner/pillar_affected)
- optimization_backlog (prioritized list with pillar mapping)
- expansion_map (Phase 2/3 recommendations mapped to pillar gaps)
- proof_asset_pipeline (testimonial + case study with pillar-specific ROI)
- client_health_score (score 0-100 + risk level + per-pillar health + interventions)

You do not modify systems directly (Agent-4 does).
No scope changes without change request process.
Never overpromise.
Label all assumptions.
Stay operator-grade and concise.`;

/**
 * Agent 5 Configuration
 */
export interface Agent5Config {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Agent 5 Input
 */
export interface Agent5Input {
  handoff_kit: Agent4HandoffKit;
  current_week_of: string; // ISO date
  usage_data?: {
    workflows_executed_this_week: number;
    active_users_this_week: number;
    exceptions_triggered_this_week: number;
    avg_exception_resolution_hours: number;
  };
  client_feedback?: string;
  open_tickets?: {
    ticket_id: string;
    severity: 'P1' | 'P2' | 'P3';
    issue: string;
    created_at: string;
  }[];
}

/**
 * Main Agent 5 Class
 */
export class Agent5ClientSuccess {
  private client: Anthropic;
  private config: Agent5Config;

  constructor(config: Agent5Config) {
    this.config = {
      model: config.model || 'claude-sonnet-4-20250514',
      maxTokens: config.maxTokens || 8000,
      temperature: config.temperature || 0.7,
      ...config,
    };

    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
  }

  /**
   * Run Agent 5 to generate Client Success Package
   */
  async run(input: Agent5Input): Promise<Agent5ClientSuccessPackage> {
    const userPrompt = this.buildUserPrompt(input);

    const response = await this.client.messages.create({
      model: this.config.model!,
      max_tokens: this.config.maxTokens!,
      temperature: this.config.temperature,
      system: AGENT_5_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Agent 5');
    }

    return this.parseResponse(textContent.text);
  }

  /**
   * Build user prompt from input
   */
  private buildUserPrompt(input: Agent5Input): string {
    let prompt = `Generate a complete Client Success Package for the following client.\n\n`;

    prompt += `## CLIENT HANDOFF KIT (from Agent 4)\n`;
    prompt += `Project ID: ${input.handoff_kit.project_id}\n`;
    prompt += `Account ID: ${input.handoff_kit.account_id}\n`;
    prompt += `Client Name: ${input.handoff_kit.client_name}\n\n`;

    prompt += `### Workflows Delivered\n`;
    input.handoff_kit.workflows_delivered.forEach((w) => {
      prompt += `- ${w.workflow_name}: ${w.goal}\n`;
      prompt += `  KPIs affected: ${w.kpis_affected.join(', ')}\n`;
      prompt += `  Exception paths: ${w.exception_paths_top5.join(', ')}\n`;
    });
    prompt += `\n`;

    prompt += `### Baseline KPIs\n`;
    input.handoff_kit.baseline_kpis.forEach((k) => {
      prompt += `- ${k.kpi_name}: ${k.baseline_value} → target: ${k.target_value}\n`;
    });
    prompt += `\n`;

    prompt += `### Shadow Ops Baseline (before automation)\n`;
    input.handoff_kit.shadow_ops_baseline.forEach((s) => {
      prompt += `- ${s}\n`;
    });
    prompt += `\n`;

    prompt += `### Exception Library\n`;
    input.handoff_kit.exception_library.forEach((e) => {
      prompt += `- ${e.exception_name} (${e.frequency}, ${e.impact}): ${e.current_handling}\n`;
    });
    prompt += `\n`;

    prompt += `### SOPs & Training\n`;
    prompt += `Quickstart (5min): ${input.handoff_kit.quickstart_5min.join(', ')}\n`;
    prompt += `Daily SOP: ${input.handoff_kit.daily_sop.join(', ')}\n`;
    prompt += `Weekly SOP: ${input.handoff_kit.weekly_sop.join(', ')}\n`;
    prompt += `Exception SOP: ${input.handoff_kit.exception_sop.join(', ')}\n\n`;

    prompt += `## CURRENT STATE\n`;
    prompt += `Week of: ${input.current_week_of}\n\n`;

    if (input.usage_data) {
      prompt += `### Usage Data (this week)\n`;
      prompt += `- Workflows executed: ${input.usage_data.workflows_executed_this_week}\n`;
      prompt += `- Active users: ${input.usage_data.active_users_this_week}\n`;
      prompt += `- Exceptions triggered: ${input.usage_data.exceptions_triggered_this_week}\n`;
      prompt += `- Avg exception resolution time: ${input.usage_data.avg_exception_resolution_hours}h\n\n`;
    }

    if (input.client_feedback) {
      prompt += `### Client Feedback\n`;
      prompt += `${input.client_feedback}\n\n`;
    }

    if (input.open_tickets && input.open_tickets.length > 0) {
      prompt += `### Open Tickets\n`;
      input.open_tickets.forEach((t) => {
        prompt += `- [${t.severity}] ${t.ticket_id}: ${t.issue} (created ${t.created_at})\n`;
      });
      prompt += `\n`;
    }

    prompt += `## YOUR TASK\n`;
    prompt += `Generate a complete Client Success Package as a JSON object matching the schema.\n`;
    prompt += `Include:\n`;
    prompt += `1. FVi7 onboarding plan (day 1/3/7 + training sessions)\n`;
    prompt += `2. Adoption dashboard (KPIs + usage + exception metrics + auditability)\n`;
    prompt += `3. Weekly win report (wins + metrics snapshot + what broke + next actions)\n`;
    prompt += `4. Issues & tickets (with severity, exception tags, owners, next steps)\n`;
    prompt += `5. Shadow Ops reduction report (before/after + delta)\n`;
    prompt += `6. Optimization backlog (prioritized improvements)\n`;
    prompt += `7. Expansion map (Phase 2/3 recommendations + triggers)\n`;
    prompt += `8. Proof asset pipeline (testimonial + case study + ROI points)\n`;
    prompt += `9. Client health score (0-100 + risk level + drivers + interventions)\n\n`;

    prompt += `Return ONLY the JSON object. No markdown fences, no explanations.`;

    return prompt;
  }

  /**
   * Parse response from Claude
   */
  private parseResponse(text: string): Agent5ClientSuccessPackage {
    // Remove markdown code fences if present
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    try {
      return JSON.parse(cleaned) as Agent5ClientSuccessPackage;
    } catch (error) {
      throw new Error(
        `Failed to parse Agent 5 response: ${error instanceof Error ? error.message : 'Unknown error'}\n\nResponse text:\n${text}`
      );
    }
  }

  /**
   * Helper: Calculate client health score from factors
   */
  static calculateHealthScore(factors: HealthScoreFactors): number {
    return calculateHealthScore(factors);
  }

  /**
   * Helper: Determine risk level from score
   */
  static determineRiskLevel(score: number): 'healthy' | 'watch' | 'at_risk' {
    return determineRiskLevel(score);
  }
}

/**
 * Convenience export for direct usage
 */
export async function runAgent5(
  config: Agent5Config,
  input: Agent5Input
): Promise<Agent5ClientSuccessPackage> {
  const agent = new Agent5ClientSuccess(config);
  return agent.run(input);
}
