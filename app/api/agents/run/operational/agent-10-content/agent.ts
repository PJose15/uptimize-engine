/**
 * Agent 10 — Content & Thought Leadership (Sequential: 10A → 10B)
 * Source: UPTIMIZE_OPERATIONAL_AGENTS_COMPLETE.md (Agent 10)
 */

import { runSequential, buildSubAgentContext } from '@/lib/subagent';
import { loadAgentMemory, commitAgentMemory } from '@/lib/learning/memory';
import type { AgentSynthesisResult, SubAgentResult } from '@/lib/subagent';
import { runResearchFinder } from './subagents/10a-research-finder';
import { runDrafterPublisher } from './subagents/10b-drafter-publisher';
import type {
  Agent10Input,
  ContentIntelligenceOutput,
  ResearchFinderResult,
  DrafterPublisherResult,
} from './types';

export const AGENT_10_SYSTEM_PROMPT = `You are the Content & Thought Leadership Agent for Uptimize AI.

WHAT YOU NEVER DO:
- Never produce generic AI content.
- Never reference client data without explicit permission and anonymization.
- Never exaggerate results — exact numbers only.
- Never publish without Pedro's review and approval.
- Never use corporate jargon Pedro would not say.
- Never claim capabilities not yet proven.`;

const TOTAL_TIMEOUT_MS = 120_000;

export async function runAgent10Content(
  input: Agent10Input,
  config: { mode?: 'fast' | 'balanced' | 'quality' } = {},
): Promise<AgentSynthesisResult<ContentIntelligenceOutput>> {
  // Learnings distributed to this agent, delivered into sub-agent memory.
  // Never fatal: a learning-store failure must degrade to no memory
  // rather than fail a run the agent could otherwise complete.
  const memory = await loadAgentMemory('agent-10-content').catch(err => {
    console.error('[agent-10-content] could not load memory:', err);
    return { entries: {}, noticeIds: [], keysRead: [] };
  });

  const baseCtx = buildSubAgentContext({
    parentAgentId: 'agent-10-content',
    subAgentId: '10A-research-finder',
    clientId: 'system',
    task: 'Find content angles → draft in Pedro voice → queue for review',
    taskProfile: 'content_drafting',
    mode: config.mode ?? 'quality',
    timeBudgetMs: TOTAL_TIMEOUT_MS,
    inputs: { agent10_input: input },
    memoryEntries: memory.entries,
    maxResponseTokens: 6000,
    confidenceRequired: 'high',
  });

  const { output, resultA, resultB } = await runSequential<
    ResearchFinderResult,
    DrafterPublisherResult,
    ContentIntelligenceOutput
  >(baseCtx, {
    pattern: 'sequential',
    totalTimeoutMs: TOTAL_TIMEOUT_MS,
    timeSplitA: 0.40,
    timeSplitB: 0.55,
    runA: (ctx) => runResearchFinder({ ...ctx, sub_agent_id: '10A-research-finder', task_profile: 'content_drafting' }),
    runB: (ctx, aResult) => runDrafterPublisher({ ...ctx, sub_agent_id: '10B-drafter-publisher', task_profile: 'content_drafting' }, aResult),
    synthesize: (a, b) => synthesize(a, b),
  });

  const subAgentResults: SubAgentResult<unknown>[] = [resultA, resultB];

  // A failed run leaves its notices pending rather than burning them.
  if (subAgentResults.some(r => r.task_completed)) {
    await commitAgentMemory(memory, { clientId: 'system', agentId: 'agent-10-content' });
  }
  const totalCost = subAgentResults.reduce((s, r) => s + r.cost_usd, 0);
  const totalDuration = subAgentResults.reduce((s, r) => s + r.duration_ms, 0);
  const requiresHumanAttention = output.pedro_review_queue.length > 0
    || subAgentResults.some(r => r.escalation_needed);

  return {
    agent_id: 'agent-10-content',
    final_output: output,
    sub_agent_results: subAgentResults,
    total_cost_usd: totalCost,
    total_duration_ms: totalDuration,
    synthesis_notes: [
      `Angles found: ${output.research.angles.length}`,
      `Drafts produced: ${output.drafter.drafts.length}`,
      `In Pedro queue: ${output.pedro_review_queue.length}`,
    ],
    overall_confidence: subAgentResults.some(r => r.confidence === 'low')
      ? 'low' : subAgentResults.some(r => r.confidence === 'medium') ? 'medium' : 'high',
    requires_human_attention: requiresHumanAttention,
    human_attention_reason: requiresHumanAttention
      ? `${output.pedro_review_queue.length} draft(s) waiting for Pedro's review`
      : undefined,
  };
}

function synthesize(
  a: SubAgentResult<ResearchFinderResult>,
  b: SubAgentResult<DrafterPublisherResult>,
): ContentIntelligenceOutput {
  const research = a.result ?? { angles: [], research_notes: '' };
  const drafter = b.result ?? {
    drafts: [],
    calendar_status: { scheduled_count: 0, pending_review_count: 0, published_this_week: 0, weeks_of_queue_remaining: 0, queue_low_warning: true },
  };

  return {
    research,
    drafter,
    pedro_review_queue: drafter.drafts,  // Every draft requires Pedro review
    generated_at: new Date().toISOString(),
  };
}
