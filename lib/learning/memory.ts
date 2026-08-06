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
import { memoryKeysForParentAgent } from '@/lib/subagent/context-builder';
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

/**
 * Per-agent overrides, for routes where the default key is not one the
 * receiving agent's sub-agents can read.
 *
 * SUBAGENT_MEMORY_KEYS is deliberately narrow — Agent 6 does not read the money
 * leak map, Agent 7 does not read Agent 2's hook library. Without an override
 * those learnings resolve to a key the agent cannot see, and the filter drops
 * them. Each target below is the nearest key the receiving agent actually reads.
 */
export const LEARNING_MEMORY_KEYS_BY_AGENT: Record<string, Record<string, string>> = {
    'agent-3-sales-engineer': {
        // Exceptions inform what the audit looks for.
        'exception:new_pattern': 'shared:audit_framework',
    },
    'agent-4-systems-builder': {
        // Resolutions are vertical-specific build knowledge.
        'exception:resolution': 'agent4:vertical',
    },
    'agent-6-closer': {
        // Value estimates are what the close defends on price.
        'money_leak:value_estimate': 'agent6:proposal',
    },
    'agent-7-nurture': {
        'outreach_hook:effective': 'shared:touch_templates',
        'outreach_hook:ineffective': 'shared:touch_templates',
    },
    'agent-9-revenue-intelligence': {
        'health_score_driver:risk_factor': 'shared:health_thresholds',
    },
};

/**
 * Resolve the memory key a learning should be delivered under for a given
 * agent, or null if it cannot be delivered.
 *
 * Returns null when the resolved key is not readable by that agent's
 * sub-agents. That check is the safety net: without it a mapping mistake
 * consumes the notice and then discards it, losing the learning permanently
 * with nothing logged. Withholding is always recoverable.
 */
export function memoryKeyFor(
    learningType: string,
    key: string,
    agentId?: string,
): string | null {
    const route = `${learningType}:${key}`;
    const target = (agentId && LEARNING_MEMORY_KEYS_BY_AGENT[agentId]?.[route])
        ?? LEARNING_MEMORY_KEYS[route]
        ?? null;

    if (!target) return null;
    if (!agentId) return target;

    return memoryKeysForParentAgent(agentId).includes(target) ? target : null;
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
        const memoryKey = memoryKeyFor(notice.learningType, notice.key, agentId);
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
