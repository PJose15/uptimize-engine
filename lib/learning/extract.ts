/**
 * Agent Output → Collector Input
 *
 * The learning collectors were written against the *sub-agent* result shapes —
 * 3A returns `pillar_findings`, and Agent 3's orchestrator hands that straight
 * over. The pipeline route dispatches the *final* agent output instead, which
 * has an entirely different shape, and the dispatcher's
 * `as Parameters<typeof collectFromAgentN>[0]` casts hid the mismatch from the
 * type system.
 *
 * The result was a learning pipeline that ran, logged, and collected nothing on
 * the default path. These functions do the real extraction, reading fields the
 * outputs actually have.
 */

import type { Agent3Output } from '@/app/api/agents/run/uptimize/agent-3-sales-engineer/types';
import type { DeliveryPackageOutput } from '@/app/api/agents/run/uptimize/agent-4-systems-delivery/types';
import type { Agent5ClientSuccessPackage } from '@/app/api/agents/run/uptimize/agent-5-client-success/types';

/**
 * The six pillars, matched against a shadow-ops task description.
 *
 * Agent 3 ranks tasks in prose rather than tagging them, so this is keyword
 * matching. Anything unmatched is 'shadow_ops' — the default pillar for
 * off-system work — rather than the raw sentence.
 */
const PILLAR_KEYWORDS: Array<[string, RegExp]> = [
    ['exceptions', /exception|edge case|escalat|fire.?fight/i],
    ['audit_trail', /audit|proof|evidence|dispute|record of/i],
    ['knowledge', /sop|documented|tribal|approval|decision/i],
    ['handoffs', /handoff|hand-off|sla|stuck|context loss/i],
    ['channels', /whatsapp|email|dm|channel|inbox|spreadsheet/i],
];

export function pillarForTask(task: string): string {
    for (const [pillar, pattern] of PILLAR_KEYWORDS) {
        if (pattern.test(task)) return pillar;
    }
    return 'shadow_ops';
}

const IMPACT_TO_SEVERITY: Record<string, string> = {
    high: 'high',
    medium: 'medium',
    low: 'low',
};

/**
 * Money leaks and exceptions from Agent 3's audit.
 *
 * Per-pillar dollar figures are not broken out — `value_calc` carries one
 * monthly estimate for the engagement — so shadow-ops tasks are apportioned by
 * their share of estimated weekly hours. That is an approximation, and it is
 * the honest one available: inventing a per-pillar figure would be worse than
 * distributing the number the agent actually produced.
 */
export function extractAgent3Learning(output: Agent3Output, vertical: string) {
    const tasks = output.shadow_ops_map?.top_invisible_tasks_ranked ?? [];
    const monthlyValue = output.value_calc?.monthly_value_estimate ?? 0;
    const totalHours = tasks.reduce((sum, t) => sum + (t.estimated_weekly_hours ?? 0), 0);

    // `pillar` is a bucketing key downstream (learnings group by it), so it must
    // be a pillar name, not the model's free-text task description — one bucket
    // per unique sentence would make grouping meaningless. The task text is kept
    // in the value instead.
    const pillar_findings = tasks.map(task => ({
        pillar: pillarForTask(task.task),
        task: task.task,
        estimated_usd: totalHours > 0
            ? Math.round(monthlyValue * ((task.estimated_weekly_hours ?? 0) / totalHours))
            : 0,
    }));

    const new_exceptions = (output.exception_library?.top_exceptions_ranked ?? []).map(ex => ({
        type: ex.exception_name,
        severity: IMPACT_TO_SEVERITY[ex.impact] ?? 'medium',
        resolution: ex.desired_handling,
    }));

    return { vertical, pillar_findings, new_exceptions };
}

/**
 * Integration quirks from Agent 4's delivery package.
 *
 * The output carries no integration-outcome data — `integrations` appears only
 * on Agent 3's inbound handoff spec. Fallback modes are the nearest real
 * equivalent: they record what was found to break during the build and how it
 * is handled, which is exactly the kind of quirk worth carrying forward.
 *
 * `added_hours` is not measured anywhere, so it is reported as 0 rather than
 * estimated.
 */
export function extractAgent4Learning(output: DeliveryPackageOutput, vertical: string) {
    const fallbacks = output.fallback_modes ?? [];
    const openIssues = output.qa_plan_and_results?.open_issues ?? [];

    const byWorkflow = new Map<string, string[]>();
    for (const fallback of fallbacks) {
        if (!fallback.failure_mode) continue;
        const issues = byWorkflow.get(fallback.workflow_name) ?? [];
        issues.push(fallback.failure_mode);
        byWorkflow.set(fallback.workflow_name, issues);
    }

    const integrations_used = [...byWorkflow.entries()].map(([name, issues]) => ({
        name,
        issues,
        added_hours: 0,
    }));

    // QA issues are not workflow-scoped; recorded under a single entry so they
    // are not silently dropped.
    if (openIssues.length > 0) {
        integrations_used.push({ name: 'qa_open_issues', issues: openIssues, added_hours: 0 });
    }

    return { vertical, integrations_used };
}

/**
 * Health-score drivers from Agent 5's package.
 *
 * `quick_win_worked` cannot be known at the moment the package is produced —
 * the win has been proposed, not yet observed — so it is reported false and
 * classified as a risk_factor rather than a validated quick_win. Claiming
 * otherwise would mark unproven advice as effective.
 */
export function extractAgent5Learning(output: Agent5ClientSuccessPackage, vertical: string) {
    const health = output.client_health_score;

    return {
        vertical,
        quick_win_used: health?.quick_win_this_week ?? '',
        quick_win_worked: false,
        // collectFromAgent5 declares dimension_improved as a number; the driver
        // text belongs in the value, not this field. The dispatcher's cast hid
        // the mismatch.
        dimension_improved: 0,
        driver: health?.drivers?.[0] ?? '',
        score_improvement: 0,
    };
}

/**
 * Portfolio fields from Agent 5's package.
 *
 * client_health_score is an object; the dispatcher previously cast it to a
 * number and wrote it into an Int column, which Prisma rejected — swallowed by
 * fire-and-forget, so portfolio health silently never updated. `expansion_ready`
 * does not exist on the package at all; it is derived from the expansion map.
 */
export function extractAgent5Portfolio(output: Agent5ClientSuccessPackage): {
    healthScore: number;
    expansionReady: boolean;
} {
    const score = output.client_health_score?.score_0_100;
    const expansion = output.expansion_map;

    return {
        healthScore: typeof score === 'number' ? Math.round(score) : 0,
        expansionReady:
            (expansion?.phase_2_recommendations?.length ?? 0) > 0 ||
            (expansion?.upsell_triggers?.length ?? 0) > 0,
    };
}
