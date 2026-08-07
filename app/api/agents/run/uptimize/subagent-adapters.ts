/**
 * Sub-Agent Adapters
 *
 * The v2 sub-agent orchestrators (Sprints 12.2–12.6) take structured input and
 * return AgentSynthesisResult<T>. Every caller in the app — the SSE pipeline
 * route and the single-agent route — speaks the legacy `(task, context, mode)
 * → AgentNResult` contract instead, which is why those orchestrators shipped
 * tested but unreachable.
 *
 * This module is the seam. Each adapter presents the legacy signature, maps
 * (task, context) onto the orchestrator's input type, and maps the synthesis
 * result back onto the legacy envelope. Callers switch paths by swapping one
 * function reference; nothing else about a call site changes.
 *
 * Behaviour is gated on USE_SUBAGENTS so both paths stay runnable and can be
 * compared on cost and output quality against the same input.
 */

import type { AgentMode } from '../types';
import type { AgentSynthesisResult } from '@/lib/subagent';
import { persistSubAgentRuns } from '@/lib/subagent/persistence';
import { loadAgentMemory, commitAgentMemory, type LoadedMemory } from '@/lib/learning/memory';
import type { AgentId } from '@/lib/subagent';
import { getProviderForModel } from '@/lib/config/models';

// Agent 1
import { runAgent1SubAgent } from './agent-1-market-intelligence/subagent-orchestrator';
import { runAgent1MarketIntelligence, type Agent1ResearchContext } from './agent-1-market-intelligence/agent';
import type { Agent1Input, Agent1Result, TargetPackOutput } from './agent-1-market-intelligence/types';

// Agent 2
import { runAgent2SubAgent } from './agent-2-outbound-appointment/subagent-orchestrator';
import { runAgent2OutboundAppointment } from './agent-2-outbound-appointment/agent';
import type { Agent2Context, Agent2Result, OutboundAndBookingOutput } from './agent-2-outbound-appointment/types';
import type { MessageArchitectInput } from './agent-2-outbound-appointment/subagents/2a-message-architect';

// Agent 3
import { runAgent3SubAgent } from './agent-3-sales-engineer/subagent-orchestrator';
import { runAgent3SalesEngineer } from './agent-3-sales-engineer/agent';
import type { Agent3Context, Agent3Result, Agent3Output } from './agent-3-sales-engineer/types';
import type { DiscoveryConductorInput } from './agent-3-sales-engineer/subagents/3a-discovery-conductor';

// Agent 4
import { runAgent4SubAgent } from './agent-4-systems-delivery/subagent-orchestrator';
import { runAgent4SystemsDelivery } from './agent-4-systems-delivery/agent';
import type { Agent4Context, Agent4Result, DeliveryPackageOutput } from './agent-4-systems-delivery/types';
import type { SpecDesignerInput } from './agent-4-systems-delivery/subagents/4a-spec-designer';

// Agent 5
import { runAgent5SubAgent, runAgent5, type Agent5Config, type Agent5Input } from './agent-5-client-success';
import type { Agent5ClientSuccessPackage } from './agent-5-client-success/types';

// ============================================================================
// FEATURE FLAG
// ============================================================================

/**
 * Whether to route pipeline agents through the sub-agent orchestrators.
 * Defaults to false so existing deployments keep the legacy behaviour until
 * the flag is set deliberately.
 */
export function subAgentsEnabled(): boolean {
    return process.env.USE_SUBAGENTS === 'true';
}

// ============================================================================
// SHARED TYPES
// ============================================================================

export interface SubAgentRunOptions {
    clientId?: string;
    pipelineRunId?: string;
    pipelineSessionId?: string;
    /** Memory entries injected into each sub-agent's context */
    memoryEntries?: Record<string, string>;
}

/**
 * Telemetry the legacy envelope has no field for. Attached alongside it so
 * callers can use real measured cost instead of re-estimating from a
 * hardcoded model name, and can see when a run wants human attention.
 */
export interface SubAgentTelemetry {
    used_sub_agents: true;
    total_cost_usd: number;
    overall_confidence: 'high' | 'medium' | 'low';
    requires_human_attention: boolean;
    human_attention_reason?: string;
    synthesis_notes: string[];
    sub_agents: Array<{
        sub_agent_id: string;
        task_completed: boolean;
        model_used: string;
        cost_usd: number;
        duration_ms: number;
        escalation_needed: boolean;
    }>;
}

export type WithTelemetry<T> = T & { sub_agent_telemetry?: SubAgentTelemetry };

// ============================================================================
// SYNTHESIS → LEGACY ENVELOPE
// ============================================================================

function buildTelemetry(synthesis: AgentSynthesisResult<unknown>): SubAgentTelemetry {
    return {
        used_sub_agents: true,
        total_cost_usd: synthesis.total_cost_usd,
        overall_confidence: synthesis.overall_confidence,
        requires_human_attention: synthesis.requires_human_attention,
        human_attention_reason: synthesis.human_attention_reason,
        synthesis_notes: synthesis.synthesis_notes,
        sub_agents: synthesis.sub_agent_results.map(r => ({
            sub_agent_id: r.sub_agent_id,
            task_completed: r.task_completed,
            model_used: r.model_used,
            cost_usd: r.cost_usd,
            duration_ms: r.duration_ms,
            escalation_needed: r.escalation_needed,
        })),
    };
}

/**
 * Map an AgentSynthesisResult onto the legacy `{ success, message, data,
 * metadata, error }` envelope shared by Agents 1–4.
 *
 * A run counts as successful when at least one sub-agent completed — the
 * orchestrators synthesize partial output on purpose (a failed 1B still leaves
 * 1A's research usable), so requiring every sub-agent to succeed would discard
 * work the pattern is designed to preserve.
 */
function toLegacyResult<TOutput, TResult extends {
    success: boolean;
    message: string;
    data?: TOutput;
    metadata?: { provider: string; model: string; tokensUsed?: number; timestamp: string; latencyMs: number };
    error?: { type: string; details: string; timestamp: string };
}>(
    synthesis: AgentSynthesisResult<TOutput>,
    successMessage: string,
    startTime: number,
): WithTelemetry<TResult> {
    const results = synthesis.sub_agent_results;
    const anyCompleted = results.some(r => r.task_completed);

    const models = [...new Set(results.map(r => r.model_used).filter(m => m && m !== 'none'))];
    const providers = [...new Set(models.map(m => getProviderForModel(m) ?? 'unknown'))];
    const tokensUsed = results.reduce((sum, r) => sum + r.tokens_input + r.tokens_output, 0);

    const metadata = {
        provider: providers.join('+') || 'none',
        model: models.join('+') || 'none',
        tokensUsed,
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startTime,
    };

    const telemetry = buildTelemetry(synthesis);

    if (!anyCompleted) {
        const reasons = results
            .map(r => r.escalation_reason ?? r.processing_notes.join('; '))
            .filter(Boolean)
            .join(' | ');

        return {
            success: false,
            message: 'All sub-agents failed',
            metadata,
            error: {
                type: 'SUBAGENT_ERROR',
                details: reasons || 'No sub-agent completed its task',
                timestamp: new Date().toISOString(),
            },
            sub_agent_telemetry: telemetry,
        } as WithTelemetry<TResult>;
    }

    return {
        success: true,
        message: successMessage,
        data: synthesis.final_output,
        metadata,
        sub_agent_telemetry: telemetry,
    } as WithTelemetry<TResult>;
}

/** Record the run, then hand back the synthesis unchanged. */
async function record(
    synthesis: AgentSynthesisResult<unknown>,
    options: SubAgentRunOptions,
): Promise<void> {
    await persistSubAgentRuns(synthesis, {
        clientId: options.clientId ?? 'unknown',
        pipelineRunId: options.pipelineRunId,
        pipelineSessionId: options.pipelineSessionId,
    });
}

/**
 * Learned context waiting for this agent.
 *
 * An explicit `memoryEntries` from the caller wins — a caller supplying its own
 * memory is being deliberate, and silently merging distributed learnings into
 * it would make the result unpredictable. Never throws: an agent must still run
 * when the learning store is unavailable.
 */
async function loadMemory(
    agentId: AgentId,
    options: SubAgentRunOptions,
): Promise<{ entries: Record<string, string>; loaded: LoadedMemory | null }> {
    if (options.memoryEntries) {
        return { entries: options.memoryEntries, loaded: null };
    }

    try {
        const loaded = await loadAgentMemory(agentId);
        return { entries: loaded.entries, loaded };
    } catch (err) {
        console.error(`[subagent-adapter] could not load memory for ${agentId}:`, err);
        return { entries: {}, loaded: null };
    }
}

/**
 * Acknowledge memory only when the run actually produced something.
 *
 * Marking notices delivered on a failed run would destroy that learning — it is
 * never redelivered — so a failure leaves them pending for the next attempt.
 */
async function commitMemory(
    loaded: LoadedMemory | null,
    agentId: AgentId,
    options: SubAgentRunOptions,
    synthesis: AgentSynthesisResult<unknown>,
): Promise<void> {
    if (!loaded) return;

    // Acknowledge only when every sub-agent completed. Memory is filtered per
    // sub-agent, so a key belonging to one that failed (shared:money_leak_map
    // reaches 1B only) was never actually read — marking it delivered would
    // consume it for a run that could not use it, and it is never redelivered.
    if (!synthesis.sub_agent_results.every(r => r.task_completed)) return;

    await commitAgentMemory(loaded, {
        clientId: options.clientId ?? 'unknown',
        agentId,
        pipelineRunId: options.pipelineRunId,
    });
}

// ============================================================================
// AGENT 1 — Market Intelligence
// ============================================================================

export async function runAgent1ViaSubAgents(
    task: string,
    context: Agent1ResearchContext = {},
    mode: AgentMode = 'balanced',
    options: SubAgentRunOptions = {},
): Promise<WithTelemetry<Agent1Result>> {
    const startTime = Date.now();

    const input: Agent1Input = {
        query: task,
        prospect_list: context.prospect_list,
        context: {
            enable_research: context.enable_research,
            research_depth: context.research_depth,
        },
        mode,
    };

    const memory = await loadMemory('agent-1-market-intelligence', options);

    const synthesis = await runAgent1SubAgent(input, {
        mode,
        clientId: options.clientId,
        pipelineRunId: options.pipelineRunId,
        memoryEntries: memory.entries,
    });

    await record(synthesis, options);
    await commitMemory(memory.loaded, 'agent-1-market-intelligence', options, synthesis);

    return toLegacyResult<TargetPackOutput, Agent1Result>(
        synthesis,
        'Target pack generated successfully',
        startTime,
    );
}

// ============================================================================
// AGENT 2 — Outbound & Appointment
// ============================================================================

export async function runAgent2ViaSubAgents(
    task: string,
    context: Agent2Context & { vertical?: string } = {},
    mode: AgentMode = 'balanced',
    options: SubAgentRunOptions = {},
): Promise<WithTelemetry<Agent2Result>> {
    const startTime = Date.now();

    // 2A cannot build a message library without leads to write to.
    if (!context.targetPack) {
        console.warn('[subagent-adapter] Agent 2: no targetPack in context — using legacy path');
        return runAgent2OutboundAppointment(task, context, mode);
    }

    const input: MessageArchitectInput = {
        target_pack: context.targetPack,
        channels: context.channels ?? ['email', 'linkedin'],
        offer_positioning: context.offerPositioning,
    };

    const memory = await loadMemory('agent-2-outbound-appointment', options);

    const synthesis = await runAgent2SubAgent(input, {
        mode,
        clientId: options.clientId,
        pipelineRunId: options.pipelineRunId,
        memoryEntries: memory.entries,
        vertical: context.vertical,
    });

    await record(synthesis, options);
    await commitMemory(memory.loaded, 'agent-2-outbound-appointment', options, synthesis);

    return toLegacyResult<OutboundAndBookingOutput, Agent2Result>(
        synthesis,
        'Outbound campaign and bookings generated successfully',
        startTime,
    );
}

// ============================================================================
// AGENT 3 — Sales Engineer
// ============================================================================

/**
 * Agent3Context carries four modes; 3A only distinguishes prep from execution.
 * Anything that is not explicit pre-call prep is an execution run.
 */
function toDiscoveryMode(mode?: Agent3Context['mode']): DiscoveryConductorInput['mode'] {
    return mode === 'pre_call_prep' ? 'pre_call_prep' : 'discovery_execution';
}

export async function runAgent3ViaSubAgents(
    task: string,
    context: Agent3Context & { vertical?: string } = {},
    mode: AgentMode = 'balanced',
    options: SubAgentRunOptions = {},
): Promise<WithTelemetry<Agent3Result>> {
    const startTime = Date.now();

    // 3A audits a specific lead; without a brief there is nothing to audit.
    if (!context.qualified_lead_brief) {
        console.warn('[subagent-adapter] Agent 3: no qualified_lead_brief in context — using legacy path');
        return runAgent3SalesEngineer(task, context, mode);
    }

    const input: DiscoveryConductorInput = {
        qualified_lead_brief: context.qualified_lead_brief,
        call_context: context.call_context ?? {},
        vertical: context.vertical ?? 'general',
        mode: toDiscoveryMode(context.mode),
    };

    const memory = await loadMemory('agent-3-sales-engineer', options);

    const synthesis = await runAgent3SubAgent(input, {
        mode,
        clientId: options.clientId,
        pipelineRunId: options.pipelineRunId,
        memoryEntries: memory.entries,
    });

    await record(synthesis, options);
    await commitMemory(memory.loaded, 'agent-3-sales-engineer', options, synthesis);

    return toLegacyResult<Agent3Output, Agent3Result>(
        synthesis,
        'Proposal and SOW generated successfully',
        startTime,
    );
}

// ============================================================================
// AGENT 4 — Systems Delivery
// ============================================================================

export async function runAgent4ViaSubAgents(
    task: string,
    context: Agent4Context = {},
    mode: AgentMode = 'balanced',
    options: SubAgentRunOptions = {},
): Promise<WithTelemetry<Agent4Result>> {
    const startTime = Date.now();

    // 4A designs against Agent 3's handoff spec — it is a required input, not
    // a prompt hint the way the legacy path treats it.
    if (!context.handoffSpec) {
        console.warn('[subagent-adapter] Agent 4: no handoffSpec in context — using legacy path');
        return runAgent4SystemsDelivery(task, context, mode);
    }

    const input: SpecDesignerInput = {
        handoff_spec: context.handoffSpec,
        client_tools: context.clientTools ?? { available: [], restricted: [] },
        target_timeline_days: context.targetTimelineDays,
    };

    const memory = await loadMemory('agent-4-systems-builder', options);

    const synthesis = await runAgent4SubAgent(input, {
        mode,
        clientId: options.clientId,
        pipelineRunId: options.pipelineRunId,
        memoryEntries: memory.entries,
    });

    await record(synthesis, options);
    await commitMemory(memory.loaded, 'agent-4-systems-builder', options, synthesis);

    return toLegacyResult<DeliveryPackageOutput, Agent4Result>(
        synthesis,
        'Delivery package generated successfully',
        startTime,
    );
}

// ============================================================================
// AGENT 5 — Client Success
// ============================================================================

/**
 * Agent 5's legacy entry point is `runAgent5(config, input)` returning the
 * package directly rather than an envelope, so this adapter matches that
 * shape. The provider config is ignored: sub-agents resolve their own models
 * through the task-profile tiers in lib/config/models.ts.
 */
export async function runAgent5ViaSubAgents(
    config: Agent5Config,
    input: Agent5Input,
    options: SubAgentRunOptions = {},
): Promise<Agent5ClientSuccessPackage> {
    const memory = await loadMemory('agent-5-client-success', options);

    const synthesis = await runAgent5SubAgent(input, {
        clientId: options.clientId ?? input.handoff_kit?.account_id,
        pipelineRunId: options.pipelineRunId,
        memoryEntries: memory.entries,
    });

    await record(synthesis, options);
    await commitMemory(memory.loaded, 'agent-5-client-success', options, synthesis);

    if (!synthesis.sub_agent_results.some(r => r.task_completed)) {
        throw new Error(
            synthesis.human_attention_reason ?? 'Agent 5 sub-agents did not complete',
        );
    }

    return synthesis.final_output;
}

// ============================================================================
// DISPATCH HELPERS
// ============================================================================

/**
 * One stable signature per agent regardless of which path is active. The
 * legacy functions take three arguments and the adapters take four, so the
 * legacy ones are wrapped to absorb the options argument — otherwise every
 * call site would have to branch on the flag itself.
 */
export interface PipelineAgentRunners {
    useSubAgents: boolean;
    runAgent1(task: string, context?: Agent1ResearchContext, mode?: AgentMode, options?: SubAgentRunOptions): Promise<WithTelemetry<Agent1Result>>;
    runAgent2(task: string, context?: Agent2Context & { vertical?: string }, mode?: AgentMode, options?: SubAgentRunOptions): Promise<WithTelemetry<Agent2Result>>;
    runAgent3(task: string, context?: Agent3Context & { vertical?: string }, mode?: AgentMode, options?: SubAgentRunOptions): Promise<WithTelemetry<Agent3Result>>;
    runAgent4(task: string, context?: Agent4Context, mode?: AgentMode, options?: SubAgentRunOptions): Promise<WithTelemetry<Agent4Result>>;
    runAgent5(config: Agent5Config, input: Agent5Input, options?: SubAgentRunOptions): Promise<Agent5ClientSuccessPackage>;
}

/**
 * Pick the implementation for each agent based on the feature flag. Callers
 * resolve once and then invoke normally, so the flag costs one branch per run
 * rather than one per call site.
 */
export function resolvePipelineAgents(): PipelineAgentRunners {
    const useSubAgents = subAgentsEnabled();

    if (!useSubAgents) {
        return {
            useSubAgents,
            runAgent1: (task, context, mode) => runAgent1MarketIntelligence(task, context, mode),
            runAgent2: (task, context, mode) => runAgent2OutboundAppointment(task, context, mode),
            runAgent3: (task, context, mode) => runAgent3SalesEngineer(task, context, mode),
            runAgent4: (task, context, mode) => runAgent4SystemsDelivery(task, context, mode),
            runAgent5: (config, input) => runAgent5(config, input),
        };
    }

    return {
        useSubAgents,
        runAgent1: runAgent1ViaSubAgents,
        runAgent2: runAgent2ViaSubAgents,
        runAgent3: runAgent3ViaSubAgents,
        runAgent4: runAgent4ViaSubAgents,
        runAgent5: runAgent5ViaSubAgents,
    };
}

/**
 * Real measured cost when the sub-agent path ran, otherwise null so the caller
 * falls back to its token-based estimate. The estimate assumes a fixed model
 * per agent, which is wrong by construction once tier routing picks the model.
 */
export function actualCostOf(result: unknown): number | null {
    const telemetry = (result as WithTelemetry<object> | null)?.sub_agent_telemetry;
    return telemetry ? telemetry.total_cost_usd : null;
}
