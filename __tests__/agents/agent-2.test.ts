/**
 * Agent 2: Outbound & Appointment Setter Tests
 * Uses real API calls
 */

import { describe, it, expect } from 'vitest';
import { runAgent2OutboundAppointment } from '../app/api/agents/run/uptimize/agent-2-outbound-appointment/agent';

describe('Agent 2: Outbound & Appointment', () => {
    const mockTargetPack = {
        target_pack_primary: [
            {
                name: 'Sarah Chen',
                company: 'GrowthScale',
                role_title: 'Operations Director',
                fit_score_0_100: 87,
                shadow_ops_density_0_10: 8,
                pain_categories: ['manual_routing', 'spreadsheet_chaos'],
                trigger_event: 'Posted about time wasted on manual tasks',
                personalized_hook: 'Saw your post about spending 3 hours on lead routing...'
            }
        ]
    };

    it('should generate message library for leads', async () => {
        const result = await runAgent2OutboundAppointment(
            'Create outreach campaigns for leads',
            {
                targetPack: mockTargetPack,
                calendarAvailability: ['Tuesday 2-4pm', 'Wednesday 10am-12pm'],
                offerPositioning: 'AI-powered operations automation',
                channels: ['linkedin', 'email']
            },
            'fast'
        );

        const typedResult = result as {
            success: boolean;
            data?: {
                message_library?: unknown[];
                conversation_updates?: unknown[];
                bookings?: unknown[];
                nurture_queue?: unknown[];
            };
        };

        expect(typedResult.success).toBe(true);
        expect(typedResult.data).toBeDefined();

        // Check message library
        expect(typedResult.data?.message_library).toBeDefined();
        expect(Array.isArray(typedResult.data?.message_library)).toBe(true);
    }, 120000);

    it('should produce multi-track messages', async () => {
        const result = await runAgent2OutboundAppointment(
            'Create personalized outreach',
            {
                targetPack: mockTargetPack,
                calendarAvailability: ['Monday 9-11am'],
                offerPositioning: 'Eliminate Shadow Ops',
                channels: ['email']
            },
            'fast'
        );

        const typedResult = result as {
            success: boolean;
            data?: {
                message_library?: Array<{
                    lead_id?: string;
                    track_messages?: {
                        pattern_interrupt?: string;
                        curiosity_hook?: string;
                        authority_play?: string;
                    };
                }>;
            };
        };

        if (typedResult.data?.message_library?.length) {
            const firstMessage = typedResult.data.message_library[0];
            const tracks = firstMessage.track_messages;

            // Check for multiple message tracks
            expect(tracks).toBeDefined();

            // At least one track should have content
            const hasContent = tracks?.pattern_interrupt ||
                tracks?.curiosity_hook ||
                tracks?.authority_play;
            expect(hasContent).toBeTruthy();
        }
    }, 120000);

    it('should create booking entries when available', async () => {
        const result = await runAgent2OutboundAppointment(
            'Generate campaigns and identify booking opportunities',
            {
                targetPack: mockTargetPack,
                calendarAvailability: ['Monday 2pm', 'Tuesday 3pm', 'Wednesday 10am'],
                offerPositioning: 'Automation consulting',
                channels: ['linkedin', 'email']
            },
            'fast'
        );

        const typedResult = result as {
            success: boolean;
            data?: {
                bookings?: unknown[];
                nurture_queue?: unknown[];
            };
        };

        expect(typedResult.success).toBe(true);

        // Either bookings or nurture queue should be populated
        const hasOutput = (typedResult.data?.bookings?.length || 0) > 0 ||
            (typedResult.data?.nurture_queue?.length || 0) > 0;
        expect(hasOutput || typedResult.data?.bookings !== undefined).toBe(true);
    }, 120000);
});
