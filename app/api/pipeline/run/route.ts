import { NextRequest } from 'next/server';
import { withRetry } from '@/lib/retry';
import { withTimeoutAndAbort, getAgentTimeout } from '@/lib/timeout';
import { validateInput, LeadInputSchema, validationErrorResponse } from '@/lib/validation';
import { validateAgentOutput } from '@/lib/agent-schemas';
import { estimateCost, aggregateCosts } from '@/lib/costs';
import { saveRun, generateRunId } from '@/lib/history';
import { startRun, updateRunAgent, completeRun, isRunCancelled } from '@/lib/pipeline-state';
import { checkRateLimit, getClientId, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';

// Import agent functions
import { runAgent1MarketIntelligence } from '../../agents/run/uptimize/agent-1-market-intelligence/agent';
import { runAgent2OutboundAppointment } from '../../agents/run/uptimize/agent-2-outbound-appointment/agent';
import { runAgent3SalesEngineer } from '../../agents/run/uptimize/agent-3-sales-engineer/agent';
import { runAgent4SystemsDelivery } from '../../agents/run/uptimize/agent-4-systems-delivery/agent';
import { runAgent5 } from '../../agents/run/uptimize/agent-5-client-success/agent';

export const maxDuration = 300; // 5 minutes max

interface AgentResult {
    success: boolean;
    data?: unknown;
    message?: string;
    metadata?: {
        provider?: string;
        model?: string;
        tokensUsed?: number;
        timestamp?: string;
        latencyMs?: number;
    };
    error?: {
        type?: string;
        details?: string;
    };
}

interface AgentRunResult extends AgentResult {
    duration: number;
    cost: number;
    validated: boolean;
}

function safeGet<T>(obj: unknown, ...keys: string[]): T | undefined {
    let current: unknown = obj;
    for (const key of keys) {
        if (current === null || current === undefined || typeof current !== 'object') {
            return undefined;
        }
        current = (current as Record<string, unknown>)[key];
    }
    return current as T | undefined;
}

export async function POST(request: NextRequest) {
    const encoder = new TextEncoder();

    // Rate limiting
    const clientId = getClientId(request);
    const rateLimitResult = checkRateLimit(`pipeline_${clientId}`, RATE_LIMITS.pipeline);

    if (!rateLimitResult.allowed) {
        return rateLimitResponse(rateLimitResult);
    }

    const stream = new ReadableStream({
        async start(controller) {
            const send = (data: object) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            };

            try {
                const body = await request.json();
                const runId = body.runId || generateRunId();

                // Validate input
                const validation = validateInput(LeadInputSchema, body);
                if (!validation.success) {
                    send({ type: 'validation_error', errors: validation.errors });
                    controller.close();
                    return;
                }

                const { leads } = validation.data;

                // Start run tracking (for cancellation)
                const abortController = startRun(runId);
                const signal = abortController.signal;

                send({ type: 'run_started', runId });

                const pipelineStartTime = Date.now();
                const results: Record<string, AgentRunResult> = {};
                let totalCost = 0;

                // Helper to check cancellation
                const checkCancelled = () => {
                    if (isRunCancelled(runId)) {
                        throw new Error('Pipeline cancelled by user');
                    }
                };

                // Agent 1: Market Intelligence
                updateRunAgent(runId, 1);
                send({ type: 'agent_start', agentNumber: 1 });
                checkCancelled();

                const agent1Start = Date.now();
                const agent1Result = await withRetry(
                    () => withTimeoutAndAbort(
                        (sig) => runAgent1MarketIntelligence(leads, {}, 'fast') as Promise<AgentResult>,
                        getAgentTimeout(1),
                        signal,
                        'Agent 1 timed out'
                    ),
                    { maxAttempts: 2 }
                ) as AgentResult;

                const agent1Duration = Date.now() - agent1Start;
                const agent1Cost = estimateCost('gemini', 'gemini-2.0-flash-exp', agent1Result.metadata?.tokensUsed || 2000, 500);
                const agent1Validation = validateAgentOutput(1, agent1Result.data);

                totalCost += agent1Cost;
                results.agent1 = {
                    ...agent1Result,
                    duration: agent1Duration,
                    cost: agent1Cost,
                    validated: agent1Validation.valid
                };

                send({
                    type: 'agent_complete',
                    agentNumber: 1,
                    success: agent1Result.success,
                    duration: agent1Duration,
                    cost: agent1Cost,
                    totalCost,
                    result: { success: agent1Result.success, data: agent1Result.data }
                });

                if (!agent1Result.success) {
                    send({ type: 'error', message: 'Agent 1 failed', details: agent1Result.error });
                    completeRun(runId, 'failed');
                    controller.close();
                    return;
                }

                // Agent 2: Outbound
                updateRunAgent(runId, 2);
                send({ type: 'agent_start', agentNumber: 2 });
                checkCancelled();

                const agent2Start = Date.now();
                const agent2Result = await withRetry(
                    () => withTimeoutAndAbort(
                        (sig) => runAgent2OutboundAppointment(
                            'Create outreach campaigns for leads',
                            {
                                targetPack: agent1Result.data,
                                calendarAvailability: ['Tuesday 2-4pm', 'Wednesday 10am-12pm'],
                                offerPositioning: 'AI-powered operations automation',
                                channels: ['linkedin', 'email']
                            },
                            'fast'
                        ) as Promise<AgentResult>,
                        getAgentTimeout(2),
                        signal,
                        'Agent 2 timed out'
                    ),
                    { maxAttempts: 2 }
                ) as AgentResult;

                const agent2Duration = Date.now() - agent2Start;
                const agent2Cost = estimateCost('anthropic', 'claude-sonnet-4-20250514', agent2Result.metadata?.tokensUsed || 3000, 800);
                const agent2Validation = validateAgentOutput(2, agent2Result.data);

                totalCost += agent2Cost;
                results.agent2 = {
                    ...agent2Result,
                    duration: agent2Duration,
                    cost: agent2Cost,
                    validated: agent2Validation.valid
                };

                send({
                    type: 'agent_complete',
                    agentNumber: 2,
                    success: agent2Result.success,
                    duration: agent2Duration,
                    cost: agent2Cost,
                    totalCost,
                    result: { success: agent2Result.success, data: agent2Result.data }
                });

                if (!agent2Result.success) {
                    send({ type: 'error', message: 'Agent 2 failed', details: agent2Result.error });
                    completeRun(runId, 'failed');
                    controller.close();
                    return;
                }

                // Agent 3: Sales Engineer
                updateRunAgent(runId, 3);
                send({ type: 'agent_start', agentNumber: 3 });
                checkCancelled();

                const agent3Start = Date.now();
                const bookingsArr = safeGet<unknown[]>(agent2Result, 'data', 'bookings') ?? [];
                const qualifiedLead = bookingsArr.length > 0
                    ? safeGet<unknown>(bookingsArr[0], 'qualified_lead_summary') ?? {}
                    : { problem: 'Manual lead routing', impact: 'Lost deals', urgency: 'High' };

                const agent3Result = await withRetry(
                    () => withTimeoutAndAbort(
                        (sig) => runAgent3SalesEngineer(
                            'Run discovery and create proposal',
                            {
                                qualified_lead_brief: qualifiedLead,
                                call_context: { call_notes: 'Discovery call', call_duration_minutes: 45 },
                                mode: 'proposal_generation'
                            },
                            'fast'
                        ) as Promise<AgentResult>,
                        getAgentTimeout(3),
                        signal,
                        'Agent 3 timed out'
                    ),
                    { maxAttempts: 2 }
                ) as AgentResult;

                const agent3Duration = Date.now() - agent3Start;
                const agent3Cost = estimateCost('openai', 'gpt-4o', agent3Result.metadata?.tokensUsed || 4000, 1200);
                const agent3Validation = validateAgentOutput(3, agent3Result.data);

                totalCost += agent3Cost;
                results.agent3 = {
                    ...agent3Result,
                    duration: agent3Duration,
                    cost: agent3Cost,
                    validated: agent3Validation.valid
                };

                send({
                    type: 'agent_complete',
                    agentNumber: 3,
                    success: agent3Result.success,
                    duration: agent3Duration,
                    cost: agent3Cost,
                    totalCost,
                    result: { success: agent3Result.success, data: agent3Result.data }
                });

                if (!agent3Result.success) {
                    send({ type: 'error', message: 'Agent 3 failed', details: agent3Result.error });
                    completeRun(runId, 'failed');
                    controller.close();
                    return;
                }

                // Agent 4: Systems Builder
                updateRunAgent(runId, 4);
                send({ type: 'agent_start', agentNumber: 4 });
                checkCancelled();

                const agent4Start = Date.now();
                const agent3Handoff = safeGet<{
                    build_modules?: string[];
                    integrations?: string[];
                    risks?: string[];
                }>(agent3Result, 'data', 'handoff_to_agent4_spec');

                const handoffSpec = {
                    buildModules: agent3Handoff?.build_modules ?? ['Lead Automation'],
                    integrations: agent3Handoff?.integrations ?? ['Slack', 'Sheets'],
                    risks: agent3Handoff?.risks ?? ['Integration delays', 'Data migration complexity'],
                    definitionOfDone: ['System deployed'],
                    topExceptionsToHandle: ['VIP lead missed'],
                    auditTrailFieldsRequired: ['lead_source']
                };

                const agent4Result = await withRetry(
                    () => withTimeoutAndAbort(
                        (sig) => runAgent4SystemsDelivery(
                            'Create delivery package',
                            {
                                handoffSpec,
                                clientTools: { available: ['Slack', 'Zapier'], restricted: [] },
                                targetTimelineDays: 14
                            },
                            'fast'
                        ) as Promise<AgentResult>,
                        getAgentTimeout(4),
                        signal,
                        'Agent 4 timed out'
                    ),
                    { maxAttempts: 2 }
                ) as AgentResult;

                const agent4Duration = Date.now() - agent4Start;
                const agent4Cost = estimateCost('gemini', 'gemini-2.0-flash-exp', agent4Result.metadata?.tokensUsed || 3500, 900);
                const agent4Validation = validateAgentOutput(4, agent4Result.data);

                totalCost += agent4Cost;
                results.agent4 = {
                    ...agent4Result,
                    duration: agent4Duration,
                    cost: agent4Cost,
                    validated: agent4Validation.valid
                };

                send({
                    type: 'agent_complete',
                    agentNumber: 4,
                    success: agent4Result.success,
                    duration: agent4Duration,
                    cost: agent4Cost,
                    totalCost,
                    result: { success: agent4Result.success, data: agent4Result.data }
                });

                if (!agent4Result.success) {
                    send({ type: 'error', message: 'Agent 4 failed', details: agent4Result.error });
                    completeRun(runId, 'failed');
                    controller.close();
                    return;
                }

                // Agent 5: Client Success
                updateRunAgent(runId, 5);
                send({ type: 'agent_start', agentNumber: 5 });
                checkCancelled();

                const agent5Start = Date.now();
                const anthropicKey = process.env.ANTHROPIC_API_KEY;

                let agent5Result: AgentResult;
                if (anthropicKey) {
                    try {
                        const kit = safeGet<{
                            quickstart_5min?: string[];
                            daily_sop?: string[];
                        }>(agent4Result, 'data', 'client_handoff_kit');

                        const agent4Handoff = {
                            project_id: 'proj_001',
                            account_id: 'acc_001',
                            client_name: 'Client',
                            quickstart_5min: kit?.quickstart_5min ?? [],
                            daily_sop: kit?.daily_sop ?? [],
                            weekly_sop: [],
                            exception_sop: [],
                            training_plan: [],
                            admin_notes: [],
                            baseline_kpis: [{ kpi_name: 'Response Time', baseline_value: '4h', target_value: '15m', measurement_method: 'CRM' }],
                            workflows_delivered: [],
                            shadow_ops_baseline: ['Manual routing'],
                            exception_library: []
                        };

                        const agent5Data = await withRetry(
                            () => withTimeoutAndAbort(
                                (sig) => runAgent5(
                                    { apiKey: anthropicKey },
                                    {
                                        handoff_kit: agent4Handoff,
                                        current_week_of: new Date().toISOString().split('T')[0]
                                    }
                                ),
                                getAgentTimeout(5),
                                signal,
                                'Agent 5 timed out'
                            ),
                            { maxAttempts: 2 }
                        );

                        agent5Result = { success: true, data: agent5Data };
                    } catch (error) {
                        agent5Result = {
                            success: false,
                            error: {
                                type: 'execution_error',
                                details: error instanceof Error ? error.message : 'Unknown'
                            }
                        };
                    }
                } else {
                    agent5Result = {
                        success: false,
                        error: {
                            type: 'config_error',
                            details: 'ANTHROPIC_API_KEY not set'
                        }
                    };
                }

                const agent5Duration = Date.now() - agent5Start;
                const agent5Cost = estimateCost('anthropic', 'claude-sonnet-4-20250514', agent5Result.metadata?.tokensUsed || 2500, 700);
                const agent5Validation = validateAgentOutput(5, agent5Result.data);

                totalCost += agent5Cost;
                results.agent5 = {
                    ...agent5Result,
                    duration: agent5Duration,
                    cost: agent5Cost,
                    validated: agent5Validation.valid
                };

                send({
                    type: 'agent_complete',
                    agentNumber: 5,
                    success: agent5Result.success,
                    duration: agent5Duration,
                    cost: agent5Cost,
                    totalCost,
                    result: results.agent5
                });

                // Complete
                const totalDuration = Date.now() - pipelineStartTime;

                // Save to history
                await saveRun({
                    id: runId,
                    timestamp: new Date().toISOString(),
                    leads,
                    duration: totalDuration,
                    cost: totalCost,
                    status: 'completed',
                    results: Object.fromEntries(
                        Object.entries(results).map(([key, val]) => [
                            key,
                            { success: val.success, data: val.data, duration: val.duration, cost: val.cost }
                        ])
                    )
                });

                send({
                    type: 'pipeline_complete',
                    runId,
                    totalDuration,
                    totalCost,
                    results
                });

                completeRun(runId, 'completed');
                controller.close();

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Pipeline failed';
                const isCancelled = errorMessage.includes('cancelled');

                send({
                    type: 'error',
                    message: errorMessage,
                    cancelled: isCancelled
                });

                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
