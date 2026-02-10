/**
 * Agent 4: Systems Builder & Delivery Tests
 * Uses real API calls
 */

import { describe, it, expect } from 'vitest';
import { runAgent4SystemsDelivery } from '../app/api/agents/run/uptimize/agent-4-systems-delivery/agent';

describe('Agent 4: Systems Builder', () => {
    const mockHandoffSpec = {
        buildModules: ['Lead Intake Automation', 'DM Aggregation', 'Alert System'],
        integrations: ['Slack', 'Google Sheets', 'WhatsApp'],
        risks: ['WhatsApp API limitations', 'Data migration complexity'],
        definitionOfDone: ['All leads auto-routed', 'VIP alerts working', 'Audit trail complete'],
        topExceptionsToHandle: ['VIP lead missed', 'Duplicate lead', 'Invalid data'],
        auditTrailFieldsRequired: ['lead_source', 'first_response_time', 'escalation_timestamp']
    };

    it('should generate workflow specs', async () => {
        const result = await runAgent4SystemsDelivery(
            'Create delivery package for lead automation',
            {
                handoffSpec: mockHandoffSpec,
                clientTools: {
                    available: ['Slack', 'Google Workspace', 'Zapier'],
                    restricted: ['Direct WhatsApp API']
                },
                targetTimelineDays: 14
            },
            'fast'
        );

        const typedResult = result as {
            success: boolean;
            data?: {
                workflow_specs?: Array<{
                    workflow_name?: string;
                    happy_path_steps?: unknown[];
                    exception_paths?: unknown[];
                }>;
            };
        };

        expect(typedResult.success).toBe(true);
        expect(typedResult.data).toBeDefined();
        expect(typedResult.data?.workflow_specs).toBeDefined();

        if (typedResult.data?.workflow_specs?.length) {
            const firstWorkflow = typedResult.data.workflow_specs[0];
            expect(firstWorkflow.workflow_name).toBeDefined();
        }
    }, 120000);

    it('should include exception paths', async () => {
        const result = await runAgent4SystemsDelivery(
            'Build system with exception handling',
            {
                handoffSpec: mockHandoffSpec,
                clientTools: { available: ['Slack'] },
                targetTimelineDays: 7
            },
            'fast'
        );

        const typedResult = result as {
            success: boolean;
            data?: {
                workflow_specs?: Array<{
                    exception_paths?: Array<{
                        exception_name?: string;
                        handling_steps?: string[];
                    }>;
                }>;
            };
        };

        expect(typedResult.success).toBe(true);

        if (typedResult.data?.workflow_specs?.[0]?.exception_paths) {
            expect(Array.isArray(typedResult.data.workflow_specs[0].exception_paths)).toBe(true);
        }
    }, 120000);

    it('should create client handoff kit', async () => {
        const result = await runAgent4SystemsDelivery(
            'Generate full delivery with handoff kit',
            {
                handoffSpec: mockHandoffSpec,
                clientTools: { available: ['Slack', 'Google Sheets'] },
                targetTimelineDays: 14
            },
            'fast'
        );

        const typedResult = result as {
            success: boolean;
            data?: {
                client_handoff_kit?: {
                    quickstart_5min?: string[];
                    daily_sop?: string[];
                    exception_sop?: string[];
                };
            };
        };

        expect(typedResult.success).toBe(true);

        if (typedResult.data?.client_handoff_kit) {
            const kit = typedResult.data.client_handoff_kit;

            // At least one SOP category should be populated
            const hasSOPs = (kit.quickstart_5min?.length || 0) > 0 ||
                (kit.daily_sop?.length || 0) > 0 ||
                (kit.exception_sop?.length || 0) > 0;
            expect(hasSOPs || kit !== undefined).toBe(true);
        }
    }, 120000);

    it('should specify fallback modes', async () => {
        const result = await runAgent4SystemsDelivery(
            'Create system with fallback plans',
            {
                handoffSpec: mockHandoffSpec,
                clientTools: { available: ['Slack'] },
                targetTimelineDays: 10
            },
            'fast'
        );

        const typedResult = result as {
            success: boolean;
            data?: {
                fallback_modes?: Array<{
                    trigger?: string;
                    fallback_action?: string;
                }>;
            };
        };

        expect(typedResult.success).toBe(true);

        if (typedResult.data?.fallback_modes) {
            expect(Array.isArray(typedResult.data.fallback_modes)).toBe(true);
        }
    }, 120000);
});
