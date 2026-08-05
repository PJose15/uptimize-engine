// @vitest-environment node
/**
 * Nurture entry join.
 *
 * This is the mapping Agent 2's orchestrator deferred: NurtureEntry lacks the
 * fields NurtureRecord needs, and they have to be recovered from Agent 1's
 * target pack and Agent 2's message library.
 */
import { describe, it, expect } from 'vitest';
import { buildNurtureEntries, categoryForOffset } from '@/lib/learning/nurture-entries';

const TARGET_PACK = {
    target_pack_primary: [
        {
            lead_id: 'lead-1',
            name: 'Jane Doe',
            company: 'Acme Fitness',
            pain_categories: ['booking_chaos'],
            shadow_ops_rationale: 'WhatsApp booking CTA',
        },
    ],
    target_pack_secondary: [
        { lead_id: 'lead-2', name: 'John Roe', company: 'Beta Gym' },
    ],
};

const MESSAGE_LIBRARY = [
    { lead_id: 'lead-1', channel: 'email' },
    { lead_id: 'lead-1', channel: 'linkedin' },
    { lead_id: 'lead-2', channel: 'email' },
];

describe('categoryForOffset', () => {
    // Inverts the dispatcher's hot 7 / warm 14 / cold 30 / lost_deal 60 map;
    // if these drift apart the touch silently reschedules.
    it('maps the day offset back onto the dispatcher\'s categories', () => {
        expect(categoryForOffset(3)).toBe('hot');
        expect(categoryForOffset(7)).toBe('hot');
        expect(categoryForOffset(14)).toBe('warm');
        expect(categoryForOffset(30)).toBe('cold');
        expect(categoryForOffset(60)).toBe('lost_deal');
        expect(categoryForOffset(365)).toBe('lost_deal');
    });
});

describe('buildNurtureEntries', () => {
    it('recovers company and contact from the target pack', () => {
        const entries = buildNurtureEntries({
            targetPack: TARGET_PACK,
            nurtureQueue: [
                { lead_id: 'lead-1', reason: 'No reply after 4 touches', next_touch_day_offset: 14 },
            ],
            messageLibrary: MESSAGE_LIBRARY,
            vertical: 'fitness',
        });

        expect(entries).toHaveLength(1);
        expect(entries[0]).toMatchObject({
            leadId: 'lead-1',
            company: 'Acme Fitness',
            contactName: 'Jane Doe',
            vertical: 'fitness',
            category: 'warm',
            reason: 'No reply after 4 touches',
        });
    });

    it('searches the secondary pack too', () => {
        const entries = buildNurtureEntries({
            targetPack: TARGET_PACK,
            nurtureQueue: [{ lead_id: 'lead-2', reason: 'Not now', next_touch_day_offset: 30 }],
        });

        expect(entries[0].company).toBe('Beta Gym');
        expect(entries[0].category).toBe('cold');
    });

    it('records the channels actually attempted', () => {
        const entries = buildNurtureEntries({
            targetPack: TARGET_PACK,
            nurtureQueue: [{ lead_id: 'lead-1', reason: 'x', next_touch_day_offset: 7 }],
            messageLibrary: MESSAGE_LIBRARY,
        });

        expect(entries[0].whatWasTried.sort()).toEqual(['email', 'linkedin']);
    });

    it('falls back rather than claiming nothing was tried', () => {
        const entries = buildNurtureEntries({
            targetPack: TARGET_PACK,
            nurtureQueue: [{ lead_id: 'lead-1', reason: 'x', next_touch_day_offset: 7 }],
        });

        expect(entries[0].whatWasTried).toEqual(['outbound_sequence']);
    });

    it('prefers the agent\'s shadow ops guess for original pain', () => {
        const entries = buildNurtureEntries({
            targetPack: TARGET_PACK,
            nurtureQueue: [{
                lead_id: 'lead-1',
                reason: 'x',
                next_touch_day_offset: 7,
                shadow_ops_guess: 'Manual reschedules over text',
            }],
        });

        expect(entries[0].originalPain).toBe('Manual reschedules over text');
    });

    it('falls back to the lead\'s own pain signals when the agent gave none', () => {
        const entries = buildNurtureEntries({
            targetPack: TARGET_PACK,
            nurtureQueue: [{ lead_id: 'lead-1', reason: 'x', next_touch_day_offset: 7 }],
        });

        expect(entries[0].originalPain).toBe('WhatsApp booking CTA');
    });

    it('keeps an entry whose lead is missing, but marks the gap', () => {
        const entries = buildNurtureEntries({
            targetPack: TARGET_PACK,
            nurtureQueue: [{ lead_id: 'ghost-9', reason: 'x', next_touch_day_offset: 7 }],
        });

        expect(entries).toHaveLength(1);
        expect(entries[0].company).toBe('unknown (ghost-9)');
        expect(entries[0].contactName).toBeUndefined();
    });

    it('defaults vertical to "unknown" rather than guessing', () => {
        const entries = buildNurtureEntries({
            targetPack: TARGET_PACK,
            nurtureQueue: [{ lead_id: 'lead-1', reason: 'x', next_touch_day_offset: 7 }],
        });

        expect(entries[0].vertical).toBe('unknown');
    });

    it('tolerates an empty queue and a malformed target pack', () => {
        expect(buildNurtureEntries({ targetPack: TARGET_PACK, nurtureQueue: [] })).toEqual([]);
        expect(buildNurtureEntries({ targetPack: null, nurtureQueue: [] })).toEqual([]);

        const entries = buildNurtureEntries({
            targetPack: 'not an object',
            nurtureQueue: [{ lead_id: 'lead-1', reason: 'x', next_touch_day_offset: 7 }],
        });
        expect(entries).toHaveLength(1);
        expect(entries[0].company).toContain('unknown');
    });
});
