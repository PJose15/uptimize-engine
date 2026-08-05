/**
 * Individual Agent Run API
 * POST /api/agents/run/[agentId]
 *
 * Runs a single agent independently (not the full pipeline).
 * Supports agents 1-5 with proper auth, rate limiting, validation, and audit logging.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/api-auth';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { validateAgentOutput } from '@/lib/agent-schemas';
import { logActivityEvent, logAuditEntry } from '@/lib/portal-events';
import { withRetry } from '@/lib/retry';
import { withTimeoutAndAbort } from '@/lib/timeout';
import { getClientIdFromRequest } from '@/lib/portal';

// Agent runners — legacy single-call path or v2 sub-agent path, per USE_SUBAGENTS
import { resolvePipelineAgents } from '../uptimize/subagent-adapters';

const AGENT_TIMEOUTS: Record<string, number> = {
    '1': 120000,
    '2': 120000,
    '3': 180000,
    '4': 180000,
    '5': 180000,
};

const AGENT_NAMES: Record<string, string> = {
    '1': 'Market Intelligence',
    '2': 'Outbound & Appointment',
    '3': 'Sales Engineer',
    '4': 'Systems Delivery',
    '5': 'Client Success',
};

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ agentId: string }> }
) {
    const { agentId } = await params;

    // Validate agent ID
    if (!['1', '2', '3', '4', '5'].includes(agentId)) {
        return NextResponse.json({ error: 'Invalid agent ID. Must be 1-5.' }, { status: 400 });
    }

    // Auth check
    const session = await getSessionFromRequest(request);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = checkRateLimit(`agent-run:${session.username}`, RATE_LIMITS.api);
    if (!rateLimitResult.allowed) {
        return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
    }

    // Resolve client ID for audit logging
    let clientId: string;
    try {
        clientId = await getClientIdFromRequest(request);
    } catch {
        clientId = 'unknown';
    }

    // Parse request body
    let body: {
        task: string;
        context?: Record<string, unknown>;
        mode?: 'fast' | 'balanced' | 'quality';
    };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { task, context, mode = 'balanced' } = body;

    if (!task || typeof task !== 'string') {
        return NextResponse.json({ error: 'Missing required field: task (string)' }, { status: 400 });
    }

    const timeout = AGENT_TIMEOUTS[agentId];
    const controller = new AbortController();

    // Resolve the agent implementations once for this request
    const agents = resolvePipelineAgents();
    const runOptions = { clientId };

    try {
        const startTime = Date.now();
        let result: unknown;

        switch (agentId) {
            case '1': {
                const enableResearch = context?.enableResearch === true;
                const prospectList = context?.prospectList as Array<{
                    name: string;
                    company: string;
                    domain?: string;
                    linkedin_url?: string;
                }> | undefined;

                if (enableResearch && prospectList) {
                    const { runAgent1WithResearch } = await import(
                        '../uptimize/agent-1-market-intelligence/agent'
                    );
                    result = await withRetry(
                        () => withTimeoutAndAbort(
                            () => runAgent1WithResearch(task, prospectList, context ?? {}, mode),
                            timeout,
                            controller.signal,
                            'Agent 1 timed out'
                        ),
                        { maxAttempts: 2 }
                    );
                } else {
                    result = await withRetry(
                        () => withTimeoutAndAbort(
                            () => agents.runAgent1(task, context ?? {}, mode, runOptions),
                            timeout,
                            controller.signal,
                            'Agent 1 timed out'
                        ),
                        { maxAttempts: 2 }
                    );
                }
                break;
            }
            case '2':
                result = await withRetry(
                    () => withTimeoutAndAbort(
                        () => agents.runAgent2(task, context ?? {}, mode, runOptions),
                        timeout,
                        controller.signal,
                        'Agent 2 timed out'
                    ),
                    { maxAttempts: 2 }
                );
                break;
            case '3':
                result = await withRetry(
                    () => withTimeoutAndAbort(
                        () => agents.runAgent3(task, context ?? {}, mode, runOptions),
                        timeout,
                        controller.signal,
                        'Agent 3 timed out'
                    ),
                    { maxAttempts: 2 }
                );
                break;
            case '4':
                result = await withRetry(
                    () => withTimeoutAndAbort(
                        () => agents.runAgent4(task, context ?? {}, mode, runOptions),
                        timeout,
                        controller.signal,
                        'Agent 4 timed out'
                    ),
                    { maxAttempts: 2 }
                );
                break;
            case '5':
                result = await withRetry(
                    () => withTimeoutAndAbort(
                        () => agents.runAgent5(
                            {
                                apiKey: process.env.ANTHROPIC_API_KEY!,
                                model: 'claude-sonnet-4-20250514',
                                maxTokens: 8000,
                            },
                            context as unknown as Parameters<typeof agents.runAgent5>[1],
                            runOptions
                        ),
                        timeout,
                        controller.signal,
                        'Agent 5 timed out'
                    ),
                    { maxAttempts: 2 }
                );
                break;
        }

        const duration = Date.now() - startTime;
        const validation = validateAgentOutput(Number(agentId), result);

        // Log to portal activity + audit
        await logActivityEvent({
            clientId,
            action: `Agent ${agentId} (${AGENT_NAMES[agentId]}) run completed`,
            description: `Individual agent run — ${mode} mode — ${duration}ms`,
            status: validation.valid ? 'completed' : 'warning',
            pillar: 'shadow_ops',
            toolUsed: `agent_${agentId}`,
            durationMs: duration,
        });

        await logAuditEntry({
            clientId,
            action: `agent_${agentId}_individual_run`,
            tool: `Agent ${agentId}: ${AGENT_NAMES[agentId]}`,
            status: 'success',
            details: `Individual run completed in ${duration}ms — validation: ${validation.valid ? 'passed' : 'warnings'}`,
        });

        return NextResponse.json({
            success: true,
            agentId: Number(agentId),
            agentName: AGENT_NAMES[agentId],
            duration,
            result,
            validation: {
                valid: validation.valid,
                errors: validation.errors,
            },
        });

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';

        await logAuditEntry({
            clientId,
            action: `agent_${agentId}_individual_run`,
            tool: `Agent ${agentId}: ${AGENT_NAMES[agentId]}`,
            status: 'error',
            details: message,
        });

        return NextResponse.json(
            { success: false, agentId: Number(agentId), error: message },
            { status: 500 }
        );
    }
}
