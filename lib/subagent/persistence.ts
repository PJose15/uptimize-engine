/**
 * Sub-Agent Run Persistence
 *
 * Writes one SubAgentRun row per sub-agent execution. The table and its
 * indexes shipped with the v2 migration but nothing has ever populated it,
 * which is why `model_performance` learning has no data to work from —
 * the [taskProfile, modelUsed] index exists precisely for that query.
 *
 * Persistence is best-effort: a logging failure must never fail an agent run
 * that already produced good output.
 */

import { prisma } from '@/lib/prisma';
import { getProviderForModel } from '@/lib/config/models';
import type { AgentSynthesisResult, SubAgentId, SubAgentResult } from './types';

/**
 * Task profile per sub-agent, mirroring the `task_profile` each orchestrator
 * passes into its sub-agent context. Kept here so a row can record which
 * profile produced a given model choice without threading it back through
 * SubAgentResult (which does not carry it).
 *
 * Only the sub-agents reachable from the pipeline today are mapped. Others
 * record an empty profile rather than a wrong one.
 */
const SUB_AGENT_TASK_PROFILES: Partial<Record<SubAgentId, string>> = {
    '1A-research-specialist': 'shadow_ops_research',
    '1B-scoring-analyst': 'signal_scoring',
    '2A-message-architect': 'content_drafting',
    '2B-pipeline-manager': 'pipeline_stage_mgmt',
    '3A-discovery-conductor': 'discovery_audit',
    '3B-proposal-writer': 'proposal_writing',
    '4A-spec-designer': 'discovery_audit',
    '4B-qa-engineer': 'discovery_audit',
    '5A-health-analyst': 'health_analysis',
    '5B-win-reporter': 'win_report',
};

export interface PersistSubAgentRunsContext {
    clientId: string;
    pipelineRunId?: string;
    pipelineSessionId?: string;
}

function toRow(result: SubAgentResult<unknown>, context: PersistSubAgentRunsContext) {
    return {
        subAgentId: result.sub_agent_id,
        parentAgentId: result.parent_agent_id,
        pipelineRunId: context.pipelineRunId,
        pipelineSessionId: context.pipelineSessionId,
        clientId: context.clientId,

        taskProfile: SUB_AGENT_TASK_PROFILES[result.sub_agent_id] ?? '',
        modelUsed: result.model_used,
        providerUsed: getProviderForModel(result.model_used) ?? 'unknown',

        taskCompleted: result.task_completed,
        confidence: result.confidence,
        processingNotes: JSON.stringify(result.processing_notes ?? []),
        fallbacksUsed: JSON.stringify(result.fallbacks_used ?? []),

        escalationNeeded: result.escalation_needed,
        escalationSeverity: result.escalation_severity,
        escalationReason: result.escalation_reason,

        costUsd: result.cost_usd,
        durationMs: result.duration_ms,
        inputTokens: result.tokens_input,
        outputTokens: result.tokens_output,
    };
}

/**
 * Persist every sub-agent result from one parent-agent run.
 * Never throws — errors are logged and swallowed.
 */
export async function persistSubAgentRuns(
    synthesis: AgentSynthesisResult<unknown>,
    context: PersistSubAgentRunsContext,
): Promise<void> {
    const rows = synthesis.sub_agent_results.map(result => toRow(result, context));

    // Sequential creates rather than createMany, and the try is *inside* the
    // loop: at most two rows per run, so the round trips are negligible, and a
    // row that violates a constraint must not take its sibling down with it.
    // Previously the try wrapped the whole loop, so a failure on the first row
    // silently dropped the second — half the run's model-performance data.
    for (const row of rows) {
        try {
            await prisma.subAgentRun.create({ data: row });
        } catch (err) {
            console.error(
                `[subagent-persistence] failed to record ${row.subAgentId}:`, err,
            );
        }
    }
}
