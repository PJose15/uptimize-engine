/**
 * Learning → Agent Memory
 *
 * The last stage of the learning pipeline: turning distributed learnings into
 * memory an agent actually reads.
 *
 * Two mismatches had to be resolved to make this work at all:
 *
 * 1. **Namespaces.** Learnings are keyed by `learningType:key` — `money_leak:
 *    pillar_finding`, `outreach_hook:effective`. Sub-agent memory is filtered
 *    against SUBAGENT_MEMORY_KEYS, a different vocabulary of namespaced keys
 *    like `shared:money_leak_map`. Delivering a learning under its own key
 *    means the filter drops it silently.
 *
 * 2. **Consumption timing.** Notices used to be marked delivered as they were
 *    read, so a failed run destroyed the learning. Reading and acknowledging
 *    are now separate — see peekPendingNotices / markNoticesDelivered.
 */

import { peekPendingNotices, markNoticesDelivered, type PendingNotice } from './distribution';
import type { AgentId } from '@/lib/subagent/types';
import { prisma } from '@/lib/prisma';

/**
 * `learningType:key` → the memory key sub-agents are permitted to read.
 *
 * Targets are drawn from SUBAGENT_MEMORY_KEYS in lib/subagent/context-builder.ts.
 * A learning with no mapping here is not delivered — better withheld than
 * consumed and dropped by the filter.
 */
export const LEARNING_MEMORY_KEYS: Record<string, string> = {
    'money_leak:pillar_finding':       'shared:money_leak_map',
    'money_leak:value_estimate':       'shared:money_leak_map',
    'exception:new_pattern':           'shared:vertical_intelligence',
    'exception:resolution':            'shared:vertical_intelligence',
    'integration_quirk:issue':         'agent4:integrations',
    'integration_quirk:workaround':    'agent4:integrations',
    'health_score_driver:quick_win':   'shared:vertical_intelligence',
    'health_score_driver:risk_factor': 'shared:vertical_intelligence',
    'outreach_hook:effective':         'agent2:successful_hooks',
    'outreach_hook:ineffective':       'agent2:successful_hooks',
};

export function memoryKeyFor(learningType: string, key: string): string | null {
    return LEARNING_MEMORY_KEYS[`${learningType}:${key}`] ?? null;
}

export interface LoadedMemory {
    /** Ready to pass as `memoryEntries` on a sub-agent run */
    entries: Record<string, string>;
    /** Notice ids to acknowledge once the run succeeds */
    noticeIds: string[];
    /** Memory keys actually delivered, for the audit log */
    keysRead: string[];
}

/**
 * Render one learning as a line an agent can act on.
 *
 * Confidence and label are included because an agent should weigh a single
 * observation differently from a validated pattern — handing over a bare value
 * would present both as equally settled.
 */
function formatNotice(notice: PendingNotice): string {
    const confidence = `${Math.round(notice.confidence * 100)}%`;
    const vertical = notice.vertical && notice.vertical !== 'unknown' ? ` · ${notice.vertical}` : '';
    return `- ${notice.value} (${notice.label}, confidence ${confidence}${vertical})`;
}

/**
 * Collect the memory waiting for an agent.
 *
 * Nothing is consumed here. Call `commitAgentMemory` after the run succeeds.
 */
export async function loadAgentMemory(agentId: AgentId | string): Promise<LoadedMemory> {
    const notices = await peekPendingNotices(agentId);
    if (notices.length === 0) {
        return { entries: {}, noticeIds: [], keysRead: [] };
    }

    // Group by destination memory key — several learnings can inform one key.
    const grouped = new Map<string, string[]>();
    const usedNoticeIds: string[] = [];

    for (const notice of notices) {
        const memoryKey = memoryKeyFor(notice.learningType, notice.key);
        if (!memoryKey) continue;

        const lines = grouped.get(memoryKey) ?? [];
        lines.push(formatNotice(notice));
        grouped.set(memoryKey, lines);
        usedNoticeIds.push(notice.id);
    }

    const entries: Record<string, string> = {};
    for (const [key, lines] of grouped) {
        entries[key] = lines.join('\n');
    }

    return {
        entries,
        noticeIds: usedNoticeIds,
        keysRead: [...grouped.keys()],
    };
}

/**
 * Acknowledge memory after a successful run, and record what was read.
 *
 * Best-effort: a bookkeeping failure must not fail a run that already produced
 * good output. The cost of a failure here is redelivery, not loss.
 */
export async function commitAgentMemory(
    memory: LoadedMemory,
    context: { clientId: string; agentId: string; pipelineRunId?: string },
): Promise<void> {
    if (memory.noticeIds.length === 0) return;

    try {
        await markNoticesDelivered(memory.noticeIds);

        await prisma.agentMemoryLog.create({
            data: {
                clientId: context.clientId,
                agentId: context.agentId,
                pipelineRunId: context.pipelineRunId,
                memoriesRead: JSON.stringify(memory.keysRead),
            },
        });
    } catch (err) {
        console.error('[learning-memory] failed to commit delivered memory:', err);
    }
}
