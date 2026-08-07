// @vitest-environment node
/**
 * Agent output → collector input.
 *
 * The collectors were written against sub-agent result shapes while the
 * pipeline dispatches final agent outputs, and `as Parameters<typeof …>[0]`
 * casts at the dispatch site hid the mismatch. The learning pipeline ran,
 * logged, and collected nothing. These tests pin the real field names, so the
 * same silent no-op cannot come back.
 */
import { describe, it, expect } from 'vitest';
import {
    extractAgent3Learning,
    extractAgent4Learning,
    extractAgent5Learning,
    extractAgent5Portfolio,
} from '@/lib/learning/extract';

const agent3Output = {
    shadow_ops_map: {
        top_invisible_tasks_ranked: [
            { task: 'WhatsApp booking triage', estimated_weekly_hours: 6, frequency: 'daily', impact: 'high', why_it_exists: '' },
            { task: 'Manual reschedules', estimated_weekly_hours: 2, frequency: 'weekly', impact: 'medium', why_it_exists: '' },
        ],
        off_system_channels: [], context_loss_points: [], audit_gaps: [],
    },
    exception_library: {
        top_exceptions_ranked: [
            { exception_name: 'Double booking', frequency: 'weekly', impact: 'high', current_handling: 'manual', desired_handling: 'auto-detect' },
        ],
        exception_metrics_assumptions: [], exceptions_to_productize: [],
    },
    value_calc: { monthly_value_estimate: 8000, dollar_value_summary: '', assumptions: [], time_saved_per_week_hours: 8, cost_per_hour_assumption: 25, notes: '' },
} as unknown as Parameters<typeof extractAgent3Learning>[0];

describe('extractAgent3Learning', () => {
    it('reads shadow ops tasks and the exception library, not fields that do not exist', () => {
        const result = extractAgent3Learning(agent3Output, 'fitness');

        expect(result.vertical).toBe('fitness');
        expect(result.pillar_findings).toHaveLength(2);
        expect(result.new_exceptions).toEqual([
            { type: 'Double booking', severity: 'high', resolution: 'auto-detect' },
        ]);
    });

    it('apportions the single monthly estimate by share of weekly hours', () => {
        const result = extractAgent3Learning(agent3Output, 'fitness');

        // 6h and 2h of 8h total, against $8000/mo.
        expect(result.pillar_findings[0].estimated_usd).toBe(6000);
        expect(result.pillar_findings[1].estimated_usd).toBe(2000);
    });

    it('does not divide by zero when no hours are recorded', () => {
        const result = extractAgent3Learning({
            ...agent3Output,
            shadow_ops_map: {
                ...agent3Output.shadow_ops_map,
                top_invisible_tasks_ranked: [
                    { task: 'Unquantified', estimated_weekly_hours: 0, frequency: 'ad_hoc', impact: 'low', why_it_exists: '' },
                ],
            },
        } as never, 'fitness');

        expect(result.pillar_findings[0].estimated_usd).toBe(0);
    });

    it('survives an output missing whole sections', () => {
        const result = extractAgent3Learning({} as never, 'fitness');
        expect(result).toEqual({ vertical: 'fitness', pillar_findings: [], new_exceptions: [] });
    });
});

describe('extractAgent4Learning', () => {
    const output = {
        fallback_modes: [
            { workflow_name: 'intake', failure_mode: 'CRM timeout', fallback_behavior: '', human_action_required: '', logging: '' },
            { workflow_name: 'intake', failure_mode: 'duplicate contact', fallback_behavior: '', human_action_required: '', logging: '' },
            { workflow_name: 'billing', failure_mode: 'webhook retry storm', fallback_behavior: '', human_action_required: '', logging: '' },
        ],
        qa_plan_and_results: { qa_checklist: [], test_cases: [], results_summary: '', open_issues: ['Sandbox credentials expire weekly'] },
    } as unknown as Parameters<typeof extractAgent4Learning>[0];

    it('groups failure modes by workflow', () => {
        const result = extractAgent4Learning(output, 'fitness');
        const intake = result.integrations_used.find(i => i.name === 'intake');

        expect(intake?.issues).toEqual(['CRM timeout', 'duplicate contact']);
    });

    it('keeps QA open issues rather than dropping them', () => {
        const result = extractAgent4Learning(output, 'fitness');
        const qa = result.integrations_used.find(i => i.name === 'qa_open_issues');

        expect(qa?.issues).toEqual(['Sandbox credentials expire weekly']);
    });

    it('reports unmeasured hours as zero rather than guessing', () => {
        const result = extractAgent4Learning(output, 'fitness');
        expect(result.integrations_used.every(i => i.added_hours === 0)).toBe(true);
    });

    it('returns nothing collectable from an empty package', () => {
        expect(extractAgent4Learning({} as never, 'fitness').integrations_used).toEqual([]);
    });
});

describe('extractAgent5Learning', () => {
    const output = {
        client_health_score: {
            score_0_100: 78,
            risk_level: 'low',
            drivers: ['Adoption rising', 'Exceptions falling'],
            interventions: [],
            quick_win_this_week: 'Automate the Monday recap',
            proof_ready: true,
        },
        expansion_map: { phase_2_recommendations: ['Add billing agent'], phase_3_optional: [], upsell_triggers: [] },
    } as unknown as Parameters<typeof extractAgent5Learning>[0];

    it('reads the quick win from the health score object', () => {
        const result = extractAgent5Learning(output, 'fitness');

        expect(result.quick_win_used).toBe('Automate the Monday recap');
        expect(result.dimension_improved).toBe('Adoption rising');
    });

    it('does not claim an unproven quick win worked', () => {
        // The win has been proposed, not observed — marking it worked would
        // record unvalidated advice as effective.
        expect(extractAgent5Learning(output, 'fitness').quick_win_worked).toBe(false);
    });
});

describe('extractAgent5Portfolio', () => {
    it('takes the numeric score out of the health object', () => {
        const result = extractAgent5Portfolio({
            client_health_score: { score_0_100: 78, risk_level: 'low', drivers: [], interventions: [], quick_win_this_week: '', proof_ready: false },
            expansion_map: { phase_2_recommendations: [], phase_3_optional: [], upsell_triggers: [] },
        } as never);

        // Previously the whole object was cast to a number and written to an
        // Int column; Prisma rejected it and fire-and-forget hid the failure.
        expect(result.healthScore).toBe(78);
        expect(typeof result.healthScore).toBe('number');
    });

    it('derives expansion readiness, which the package does not state', () => {
        const ready = extractAgent5Portfolio({
            client_health_score: { score_0_100: 80 },
            expansion_map: { phase_2_recommendations: ['Add billing agent'], phase_3_optional: [], upsell_triggers: [] },
        } as never);
        expect(ready.expansionReady).toBe(true);

        const notReady = extractAgent5Portfolio({
            client_health_score: { score_0_100: 80 },
            expansion_map: { phase_2_recommendations: [], phase_3_optional: [], upsell_triggers: [] },
        } as never);
        expect(notReady.expansionReady).toBe(false);
    });

    it('falls back to zero rather than NaN on a malformed package', () => {
        expect(extractAgent5Portfolio({} as never)).toEqual({ healthScore: 0, expansionReady: false });
    });
});
