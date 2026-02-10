/**
 * Agent 3: Sales Engineer & Offer Architect Tests
 * Uses real API calls
 */

import { describe, it, expect } from 'vitest';
import { runAgent3SalesEngineer } from '../app/api/agents/run/uptimize/agent-3-sales-engineer/agent';

describe('Agent 3: Sales Engineer', () => {
    const mockQualifiedLead = {
        problem: 'Manual lead routing taking 3+ hours daily',
        impact: '$50K+ in lost deals from missed follow-ups',
        urgency: 'Lost major client last month',
        stack: ['Google Sheets', 'WhatsApp', 'Gmail'],
        shadow_ops_off_system_examples: ['Tracks leads in memory', 'WhatsApp handoffs']
    };

    it('should generate shadow ops map', async () => {
        const result = await runAgent3SalesEngineer(
            'Run discovery and create proposal',
            {
                qualified_lead_brief: mockQualifiedLead,
                call_context: {
                    call_notes: 'Prospect mentioned spending 3 hours on manual routing',
                    call_duration_minutes: 45
                },
                mode: 'discovery'
            },
            'fast'
        );

        const typedResult = result as {
            success: boolean;
            data?: {
                shadow_ops_map?: {
                    top_invisible_tasks_ranked?: unknown[];
                };
                exception_library?: unknown;
                value_calc?: unknown;
            };
        };

        expect(typedResult.success).toBe(true);
        expect(typedResult.data).toBeDefined();
        expect(typedResult.data?.shadow_ops_map).toBeDefined();

        if (typedResult.data?.shadow_ops_map?.top_invisible_tasks_ranked) {
            expect(Array.isArray(typedResult.data.shadow_ops_map.top_invisible_tasks_ranked)).toBe(true);
        }
    }, 120000);

    it('should create exception library', async () => {
        const result = await runAgent3SalesEngineer(
            'Map exceptions and edge cases',
            {
                qualified_lead_brief: mockQualifiedLead,
                call_context: {
                    call_notes: 'Many VIP leads slip through cracks',
                    call_duration_minutes: 30
                },
                mode: 'discovery'
            },
            'fast'
        );

        const typedResult = result as {
            success: boolean;
            data?: {
                exception_library?: {
                    top_exceptions_ranked?: Array<{
                        exception_name?: string;
                        frequency?: string;
                    }>;
                };
            };
        };

        expect(typedResult.success).toBe(true);

        if (typedResult.data?.exception_library?.top_exceptions_ranked) {
            expect(Array.isArray(typedResult.data.exception_library.top_exceptions_ranked)).toBe(true);
        }
    }, 120000);

    it('should calculate value/ROI', async () => {
        const result = await runAgent3SalesEngineer(
            'Create proposal with value calculation',
            {
                qualified_lead_brief: mockQualifiedLead,
                call_context: {
                    call_notes: 'High urgency, budget approved',
                    call_duration_minutes: 60
                },
                mode: 'proposal_generation'
            },
            'fast'
        );

        const typedResult = result as {
            success: boolean;
            data?: {
                value_calc?: {
                    time_saved_per_week_hours?: number;
                    monthly_value_estimate?: number;
                };
            };
        };

        expect(typedResult.success).toBe(true);

        if (typedResult.data?.value_calc) {
            const { time_saved_per_week_hours, monthly_value_estimate } = typedResult.data.value_calc;

            // Value calculation should have numeric values
            if (time_saved_per_week_hours !== undefined) {
                expect(typeof time_saved_per_week_hours).toBe('number');
            }
            if (monthly_value_estimate !== undefined) {
                expect(typeof monthly_value_estimate).toBe('number');
            }
        }
    }, 120000);

    it('should produce handoff spec for Agent 4', async () => {
        const result = await runAgent3SalesEngineer(
            'Generate full proposal with handoff',
            {
                qualified_lead_brief: mockQualifiedLead,
                call_context: {
                    call_notes: 'Ready to proceed',
                    call_duration_minutes: 45
                },
                mode: 'proposal_generation'
            },
            'fast'
        );

        const typedResult = result as {
            success: boolean;
            data?: {
                handoff_to_agent4_spec?: {
                    build_modules?: string[];
                    integrations?: string[];
                };
            };
        };

        expect(typedResult.success).toBe(true);

        if (typedResult.data?.handoff_to_agent4_spec) {
            const { build_modules, integrations } = typedResult.data.handoff_to_agent4_spec;

            if (build_modules) {
                expect(Array.isArray(build_modules)).toBe(true);
            }
            if (integrations) {
                expect(Array.isArray(integrations)).toBe(true);
            }
        }
    }, 120000);
});
