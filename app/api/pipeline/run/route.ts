import { NextRequest } from 'next/server';

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

    const stream = new ReadableStream({
        async start(controller) {
            const send = (data: object) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            };

            try {
                const { leads } = await request.json();
                const pipelineStartTime = Date.now();
                const results: Record<string, unknown> = {};

                // Agent 1: Market Intelligence
                send({ type: 'agent_start', agentNumber: 1 });
                const agent1Start = Date.now();
                const agent1Result = await runAgent1MarketIntelligence(leads, {}, 'fast') as AgentResult;
                const agent1Duration = Date.now() - agent1Start;
                results.agent1 = agent1Result;
                send({
                    type: 'agent_complete',
                    agentNumber: 1,
                    success: agent1Result.success,
                    duration: agent1Duration,
                    result: { success: agent1Result.success, data: agent1Result.data }
                });

                if (!agent1Result.success) {
                    send({ type: 'error', message: 'Agent 1 failed' });
                    controller.close();
                    return;
                }

                // Agent 2: Outbound
                send({ type: 'agent_start', agentNumber: 2 });
                const agent2Start = Date.now();
                const agent2Result = await runAgent2OutboundAppointment(
                    'Create outreach campaigns for leads',
                    {
                        targetPack: agent1Result.data,
                        calendarAvailability: ['Tuesday 2-4pm', 'Wednesday 10am-12pm'],
                        offerPositioning: 'AI-powered operations automation',
                        channels: ['linkedin', 'email']
                    },
                    'fast'
                ) as AgentResult;
                const agent2Duration = Date.now() - agent2Start;
                results.agent2 = agent2Result;
                send({
                    type: 'agent_complete',
                    agentNumber: 2,
                    success: agent2Result.success,
                    duration: agent2Duration,
                    result: { success: agent2Result.success, data: agent2Result.data }
                });

                if (!agent2Result.success) {
                    send({ type: 'error', message: 'Agent 2 failed' });
                    controller.close();
                    return;
                }

                // Agent 3: Sales Engineer
                send({ type: 'agent_start', agentNumber: 3 });
                const agent3Start = Date.now();
                const bookingsArr = safeGet<unknown[]>(agent2Result, 'data', 'bookings') ?? [];
                const qualifiedLead = bookingsArr.length > 0
                    ? safeGet<unknown>(bookingsArr[0], 'qualified_lead_summary') ?? {}
                    : { problem: 'Manual lead routing', impact: 'Lost deals', urgency: 'High' };

                const agent3Result = await runAgent3SalesEngineer(
                    'Run discovery and create proposal',
                    {
                        qualified_lead_brief: qualifiedLead,
                        call_context: { call_notes: 'Discovery call', call_duration_minutes: 45 },
                        mode: 'proposal_generation'
                    },
                    'fast'
                ) as AgentResult;
                const agent3Duration = Date.now() - agent3Start;
                results.agent3 = agent3Result;
                send({
                    type: 'agent_complete',
                    agentNumber: 3,
                    success: agent3Result.success,
                    duration: agent3Duration,
                    result: { success: agent3Result.success, data: agent3Result.data }
                });

                if (!agent3Result.success) {
                    send({ type: 'error', message: 'Agent 3 failed' });
                    controller.close();
                    return;
                }

                // Agent 4: Systems Builder
                send({ type: 'agent_start', agentNumber: 4 });
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

                const agent4Result = await runAgent4SystemsDelivery(
                    'Create delivery package',
                    {
                        handoffSpec,
                        clientTools: { available: ['Slack', 'Zapier'], restricted: [] },
                        targetTimelineDays: 14
                    },
                    'fast'
                ) as AgentResult;
                const agent4Duration = Date.now() - agent4Start;
                results.agent4 = agent4Result;
                send({
                    type: 'agent_complete',
                    agentNumber: 4,
                    success: agent4Result.success,
                    duration: agent4Duration,
                    result: { success: agent4Result.success, data: agent4Result.data }
                });

                if (!agent4Result.success) {
                    send({ type: 'error', message: 'Agent 4 failed' });
                    controller.close();
                    return;
                }

                // Agent 5: Client Success
                send({ type: 'agent_start', agentNumber: 5 });
                const agent5Start = Date.now();
                const anthropicKey = process.env.ANTHROPIC_API_KEY;

                let agent5Success = false;
                let agent5Duration = 0;

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

                        const agent5Result = await runAgent5(
                            { apiKey: anthropicKey },
                            {
                                handoff_kit: agent4Handoff,
                                current_week_of: new Date().toISOString().split('T')[0]
                            }
                        );
                        agent5Duration = Date.now() - agent5Start;
                        agent5Success = true;
                        results.agent5 = { success: true, data: agent5Result };
                    } catch (error) {
                        agent5Duration = Date.now() - agent5Start;
                        results.agent5 = { success: false, error: error instanceof Error ? error.message : 'Unknown' };
                    }
                } else {
                    agent5Duration = 0;
                    results.agent5 = { success: false, error: 'ANTHROPIC_API_KEY not set' };
                }

                send({
                    type: 'agent_complete',
                    agentNumber: 5,
                    success: agent5Success,
                    duration: agent5Duration,
                    result: results.agent5
                });

                // Complete
                const totalDuration = Date.now() - pipelineStartTime;
                send({
                    type: 'pipeline_complete',
                    totalDuration,
                    results
                });

                controller.close();
            } catch (error) {
                send({
                    type: 'error',
                    message: error instanceof Error ? error.message : 'Pipeline failed'
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
