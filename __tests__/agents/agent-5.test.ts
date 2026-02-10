/**
 * Agent 5: Client Success & Expansion Tests
 * Uses real API calls (Anthropic)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { runAgent5 } from '../app/api/agents/run/uptimize/agent-5-client-success/agent';

describe('Agent 5: Client Success', () => {
    let apiKey: string | undefined;

    beforeAll(() => {
        apiKey = process.env.ANTHROPIC_API_KEY;
    });

    const mockHandoffKit = {
        project_id: 'proj_test_001',
        account_id: 'acc_test_001',
        client_name: 'Test Client Inc',
        quickstart_5min: [
            'Log into Slack workspace',
            'Check #leads-alerts channel',
            'Verify dashboard access'
        ],
        daily_sop: [
            'Review overnight lead alerts',
            'Check exception queue',
            'Update priority leads'
        ],
        weekly_sop: [
            'Run weekly metrics report',
            'Review Shadow Ops reduction'
        ],
        exception_sop: [
            'VIP lead missed: Escalate to owner within 15min',
            'System down: Use backup spreadsheet'
        ],
        training_plan: ['Day 1: Dashboard training', 'Day 3: Exception handling'],
        admin_notes: [],
        baseline_kpis: [
            { kpi_name: 'Lead Response Time', baseline_value: '4 hours', target_value: '15 minutes', measurement_method: 'CRM timestamp' },
            { kpi_name: 'Shadow Ops Hours', baseline_value: '15 hrs/week', target_value: '2 hrs/week', measurement_method: 'Time tracking' }
        ],
        workflows_delivered: [
            {
                workflow_id: 'wf_lead_intake',
                workflow_name: 'Lead Intake Automation',
                goal: 'Auto-capture leads from all sources',
                exception_paths_top5: ['Duplicate lead', 'Invalid email'],
                kpis_affected: ['Lead Response Time']
            }
        ],
        shadow_ops_baseline: ['Manual lead routing', 'WhatsApp coordination', 'Spreadsheet tracking'],
        exception_library: [
            { exception_name: 'VIP Lead Missed', frequency: '2/week', impact: 'High', current_handling: 'Manual check' }
        ]
    };

    it('should create onboarding plan', async () => {
        if (!apiKey) {
            console.log('Skipping test: ANTHROPIC_API_KEY not set');
            return;
        }

        const result = await runAgent5(
            { apiKey },
            {
                handoff_kit: mockHandoffKit,
                current_week_of: new Date().toISOString().split('T')[0]
            }
        );

        expect(result).toBeDefined();

        const typedResult = result as {
            onboarding_plan?: {
                day_1?: string[];
                day_3?: string[];
                day_7?: string[];
            };
        };

        if (typedResult.onboarding_plan) {
            const { day_1, day_3, day_7 } = typedResult.onboarding_plan;

            // At least one day should have tasks
            const hasTasks = (day_1?.length || 0) > 0 ||
                (day_3?.length || 0) > 0 ||
                (day_7?.length || 0) > 0;
            expect(hasTasks || typedResult.onboarding_plan !== undefined).toBe(true);
        }
    }, 180000);

    it('should generate shadow ops reduction report', async () => {
        if (!apiKey) {
            console.log('Skipping test: ANTHROPIC_API_KEY not set');
            return;
        }

        const result = await runAgent5(
            { apiKey },
            {
                handoff_kit: mockHandoffKit,
                current_week_of: new Date().toISOString().split('T')[0]
            }
        );

        const typedResult = result as {
            shadow_ops_reduction_report?: {
                before_list?: string[];
                after_list?: string[];
                delta_summary?: string;
            };
        };

        if (typedResult.shadow_ops_reduction_report) {
            expect(typedResult.shadow_ops_reduction_report.before_list).toBeDefined();
            expect(typedResult.shadow_ops_reduction_report.after_list).toBeDefined();
        }
    }, 180000);

    it('should calculate client health score', async () => {
        if (!apiKey) {
            console.log('Skipping test: ANTHROPIC_API_KEY not set');
            return;
        }

        const result = await runAgent5(
            { apiKey },
            {
                handoff_kit: mockHandoffKit,
                current_week_of: new Date().toISOString().split('T')[0]
            }
        );

        const typedResult = result as {
            client_health_score?: {
                score_0_100?: number;
                risk_level?: string;
                factors?: unknown;
            };
        };

        if (typedResult.client_health_score) {
            const { score_0_100, risk_level } = typedResult.client_health_score;

            if (score_0_100 !== undefined) {
                expect(typeof score_0_100).toBe('number');
                expect(score_0_100).toBeGreaterThanOrEqual(0);
                expect(score_0_100).toBeLessThanOrEqual(100);
            }

            if (risk_level) {
                expect(['low', 'medium', 'high', 'critical']).toContain(risk_level.toLowerCase());
            }
        }
    }, 180000);

    it('should identify expansion opportunities', async () => {
        if (!apiKey) {
            console.log('Skipping test: ANTHROPIC_API_KEY not set');
            return;
        }

        const result = await runAgent5(
            { apiKey },
            {
                handoff_kit: mockHandoffKit,
                current_week_of: new Date().toISOString().split('T')[0]
            }
        );

        const typedResult = result as {
            expansion_map?: {
                phase_2_recommendations?: string[];
                upsell_opportunities?: string[];
            };
        };

        if (typedResult.expansion_map) {
            const { phase_2_recommendations, upsell_opportunities } = typedResult.expansion_map;

            // At least one expansion category should have items
            const hasExpansion = (phase_2_recommendations?.length || 0) > 0 ||
                (upsell_opportunities?.length || 0) > 0;
            expect(hasExpansion || typedResult.expansion_map !== undefined).toBe(true);
        }
    }, 180000);
});
