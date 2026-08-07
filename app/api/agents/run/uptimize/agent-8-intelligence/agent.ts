/**
 * UptimizeAI Agent 8 — Vertical Intelligence Keeper (Sequential: 8A → 8B)
 *
 * Position: Perpetual event-driven background — fires after Agent 3, Agent 5,
 *           Agent 4, and Agent 6, plus Sunday weekly brief.
 *
 * Source: UPTIMIZE_AGENT_PROMPTS_PIPELINE_V2.md (Agent 8)
 * Source: UPTIMIZE_CLAUDE_CODE_MASTER_V2.md (Sprint 11.2 + 11.3)
 */

import { runSequential, buildSubAgentContext } from '@/lib/subagent';
import { loadAgentMemory, commitAgentMemory } from '@/lib/learning/memory';
import type { AgentSynthesisResult, SubAgentResult } from '@/lib/subagent';
import { runPatternCollector } from './subagents/8a-pattern-collector';
import { runPlaybookUpdater } from './subagents/8b-playbook-updater';
import type {
  Agent8Input,
  IntelligenceKeeperOutput,
  PatternCollectorResult,
  PlaybookUpdaterResult,
} from './types';

export const AGENT_8_SYSTEM_PROMPT = `You are the Vertical Intelligence Keeper for Uptimize AI.

THE THREE-TIER CONFIRMATION RULE:
Single data point → flag and watch. Update nothing.
Two matching data points in the same vertical → tentative update. Label as "emerging."
Three or more matching data points → confirmed update. Apply to the knowledge base.

WHAT YOU NEVER DO:
- Never update the knowledge base based on a single data point.
- Never apply a learning that conflicts with existing confirmed data without flagging it.
- Never cross-contaminate client-specific data into the anonymous learning layer.
- Never remove an existing playbook entry based on a single contradicting data point.
- Never update a multiplier by more than 15% in a single cycle.
- Never distribute a learning to an agent before the update has been confirmed (3+ points).`;

const TOTAL_TIMEOUT_MS = 180_000;
const TIME_SPLIT_A = 0.5;
const TIME_SPLIT_B = 0.5;

export interface Agent8Config {
  mode?: 'fast' | 'balanced' | 'quality';
  pipelineRunId?: string;
  memoryEntries?: Record<string, string>;
}

export async function runAgent8IntelligenceKeeper(
  input: Agent8Input,
  config: Agent8Config = {},
): Promise<AgentSynthesisResult<IntelligenceKeeperOutput>> {
  const mode = config.mode ?? 'balanced';

  // Learnings distributed to this agent, delivered into sub-agent memory.
  // Never fatal: a learning-store failure must degrade to no memory
  // rather than fail a run the agent could otherwise complete.
  const memory = await loadAgentMemory('agent-8-intelligence').catch(err => {
    console.error('[agent-8-intelligence] could not load memory:', err);
    return { entries: {}, noticeIds: [], keysRead: [] };
  });

  const baseCtx = buildSubAgentContext({
    parentAgentId: 'agent-8-intelligence',
    subAgentId: '8A-pattern-collector',
    clientId: 'system',
    pipelineRunId: config.pipelineRunId,
    task: input.triggered_by === 'weekly_brief'
      ? 'Generate weekly intelligence brief from learning events'
      : 'Process learning events through three-tier confirmation rule',
    taskProfile: 'pattern_collection',
    mode,
    timeBudgetMs: TOTAL_TIMEOUT_MS,
    inputs: { agent8_input: input },
    memoryEntries: config.memoryEntries ?? memory.entries,
    maxResponseTokens: 6000,
    confidenceRequired: 'high',
  });

  const { output, resultA, resultB } = await runSequential<
    PatternCollectorResult,
    PlaybookUpdaterResult,
    IntelligenceKeeperOutput
  >(baseCtx, {
    pattern: 'sequential',
    totalTimeoutMs: TOTAL_TIMEOUT_MS,
    timeSplitA: TIME_SPLIT_A,
    timeSplitB: TIME_SPLIT_B,
    runA: (ctx) => runPatternCollector({ ...ctx, sub_agent_id: '8A-pattern-collector', task_profile: 'pattern_collection' }),
    runB: (ctx, aResult) =>
      runPlaybookUpdater(
        { ...ctx, sub_agent_id: '8B-playbook-updater', task_profile: 'playbook_updating' },
        aResult,
      ),
    synthesize: (a, b) => synthesize(input, a, b),
  });

  const subAgentResults: SubAgentResult<unknown>[] = [resultA, resultB];

  // A failed run leaves its notices pending rather than burning them.
  if (subAgentResults.some(r => r.task_completed)) {
    await commitAgentMemory(memory, { clientId: 'system', agentId: 'agent-8-intelligence' });
  }
  const totalCost = subAgentResults.reduce((s, r) => s + r.cost_usd, 0);
  const totalDuration = subAgentResults.reduce((s, r) => s + r.duration_ms, 0);
  const requiresHumanAttention = output.pedro_review_required.length > 0
    || subAgentResults.some(r => r.escalation_needed);

  return {
    agent_id: 'agent-8-intelligence',
    final_output: output,
    sub_agent_results: subAgentResults,
    total_cost_usd: totalCost,
    total_duration_ms: totalDuration,
    synthesis_notes: [
      `Triggered by: ${input.triggered_by}`,
      `Events processed: ${input.events.length}`,
      `Updates applied: ${output.playbook_updater.updates_applied.length}`,
      `Pedro review required: ${output.pedro_review_required.length}`,
      ...(output.weekly_brief ? [`Weekly brief generated for week of ${output.weekly_brief.week_of}`] : []),
    ],
    overall_confidence: lowestConfidence(subAgentResults),
    requires_human_attention: requiresHumanAttention,
    human_attention_reason: requiresHumanAttention
      ? output.pedro_review_required.map(p => `[${p.category}] ${p.description}`).join('; ')
      : undefined,
  };
}

function synthesize(
  input: Agent8Input,
  a: SubAgentResult<PatternCollectorResult>,
  b: SubAgentResult<PlaybookUpdaterResult>,
): IntelligenceKeeperOutput {
  const patternCollector = a.result ?? { evaluations: [], events_processed: 0, contradictions_detected: 0 };
  const playbookUpdater = b.result ?? { updates_applied: [], distribution_notices: [], deferred_to_pedro: [] };

  // Mark events as applied if their pattern was either applied OR explicitly deferred-to-pedro.
  // Watch/flag-only events stay unapplied so they can be re-evaluated when more data arrives.
  const appliedEvaluationIndices = new Set(playbookUpdater.updates_applied.map(u => u.evaluation_index));
  const eventsToMarkApplied: string[] = [];

  for (let i = 0; i < patternCollector.evaluations.length; i++) {
    const evaluation = patternCollector.evaluations[i];
    if (appliedEvaluationIndices.has(i) || evaluation.significance === 'validated') {
      eventsToMarkApplied.push(...evaluation.learning_event_ids);
    }
  }

  return {
    pattern_collector: patternCollector,
    playbook_updater: playbookUpdater,
    events_to_mark_applied: eventsToMarkApplied,
    pedro_review_required: playbookUpdater.deferred_to_pedro,
    total_cost_usd: a.cost_usd + b.cost_usd,
    weekly_brief: playbookUpdater.weekly_brief,
  };
}

function lowestConfidence(results: Array<{ confidence: 'high' | 'medium' | 'low' }>): 'high' | 'medium' | 'low' {
  if (results.some(r => r.confidence === 'low')) return 'low';
  if (results.some(r => r.confidence === 'medium')) return 'medium';
  return 'high';
}
