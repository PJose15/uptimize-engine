/**
 * Nurture Queue Entry Builder
 *
 * Resolves the gap recorded in Agent 2's sub-agent orchestrator: NurtureEntry
 * carries only (lead_id, reason, next_touch_day_offset, nurture_message,
 * shadow_ops_guess, likely_exceptions_guess), while onAgent2NurtureQueue needs
 * company, contactName, vertical, category, originalPain and whatWasTried to
 * create a NurtureRecord.
 *
 * The missing fields are not absent from the system, only from that one type —
 * they live in Agent 1's target pack and in Agent 2's own message library. This
 * joins the three by lead_id at the layer that holds all of them, rather than
 * widening NurtureEntry and forcing the sub-agent to restate what it was given.
 */

export interface NurtureQueueEntry {
    lead_id: string;
    reason: string;
    next_touch_day_offset: number;
    shadow_ops_guess?: string;
    likely_exceptions_guess?: string[];
}

export interface TargetPackLead {
    lead_id: string;
    name?: string;
    company?: string;
    pain_categories?: string[];
    shadow_ops_rationale?: string;
}

export interface MessageLibraryEntryLike {
    lead_id: string;
    channel?: string;
}

export type NurtureCategory = 'hot' | 'warm' | 'cold' | 'lost_deal';

export interface NurtureDispatchEntry {
    leadId: string;
    company: string;
    contactName?: string;
    vertical: string;
    category: NurtureCategory;
    reason: string;
    originalPain: string;
    whatWasTried: string[];
}

/**
 * Invert the dispatcher's category → delay mapping (hot 7 / warm 14 / cold 30 /
 * lost_deal 60) so the agent's own scheduling intent survives the round trip.
 * onAgent2NurtureQueue recomputes nextTouch from the category, so a category
 * derived any other way would silently reschedule the touch.
 */
export function categoryForOffset(dayOffset: number): NurtureCategory {
    if (dayOffset <= 7) return 'hot';
    if (dayOffset <= 14) return 'warm';
    if (dayOffset <= 30) return 'cold';
    return 'lost_deal';
}

function collectLeads(targetPack: unknown): Map<string, TargetPackLead> {
    const byId = new Map<string, TargetPackLead>();
    if (!targetPack || typeof targetPack !== 'object') return byId;

    const pack = targetPack as Record<string, unknown>;
    for (const key of ['target_pack_primary', 'target_pack_secondary']) {
        const leads = pack[key];
        if (!Array.isArray(leads)) continue;

        for (const lead of leads as TargetPackLead[]) {
            if (lead?.lead_id) byId.set(lead.lead_id, lead);
        }
    }

    return byId;
}

/**
 * Build the dispatch payload for onAgent2NurtureQueue.
 *
 * A queue entry whose lead is missing from the target pack is still emitted —
 * losing a nurture record entirely is worse than one with a placeholder
 * company — but it is marked so the gap is visible downstream rather than
 * looking like real data.
 */
export function buildNurtureEntries(params: {
    targetPack: unknown;
    nurtureQueue: NurtureQueueEntry[];
    messageLibrary?: MessageLibraryEntryLike[];
    vertical?: string;
}): NurtureDispatchEntry[] {
    const { targetPack, nurtureQueue, messageLibrary = [], vertical } = params;
    if (!Array.isArray(nurtureQueue) || nurtureQueue.length === 0) return [];

    const leadsById = collectLeads(targetPack);

    // Channels actually attempted per lead, for whatWasTried.
    const channelsByLead = new Map<string, Set<string>>();
    for (const entry of messageLibrary) {
        if (!entry?.lead_id || !entry.channel) continue;
        const set = channelsByLead.get(entry.lead_id) ?? new Set<string>();
        set.add(entry.channel);
        channelsByLead.set(entry.lead_id, set);
    }

    return nurtureQueue
        .filter(entry => entry?.lead_id)
        .map(entry => {
            const lead = leadsById.get(entry.lead_id);
            const channels = [...(channelsByLead.get(entry.lead_id) ?? [])];

            const originalPain =
                entry.shadow_ops_guess
                || lead?.shadow_ops_rationale
                || lead?.pain_categories?.join(', ')
                || '';

            return {
                leadId: entry.lead_id,
                company: lead?.company ?? `unknown (${entry.lead_id})`,
                contactName: lead?.name,
                vertical: vertical ?? 'unknown',
                category: categoryForOffset(entry.next_touch_day_offset),
                reason: entry.reason ?? '',
                originalPain,
                whatWasTried: channels.length > 0 ? channels : ['outbound_sequence'],
            };
        });
}
