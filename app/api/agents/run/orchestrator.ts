/**
 * Orchestrator using fallback system with cost tracking
 */

import { AgentResult, ErrorType, AgentMode } from "./types";
import { logger } from "./logger";
import { executeWithFallback } from "./fallback";
import { CONFIG } from "./config";
import { calculateCost } from "./cost";
import { runZenthiaGrowthOperator } from "./zenthia/zenthia-growth-operator";
import { runDailyBrief } from "./zenthia/zenthia-daily-brief";
import { runZenthiaContentFactory } from "./zenthia/zenthia-content-factory";
import { runAgent1MarketIntelligence } from "./uptimize/agent-1-market-intelligence";
import { runAgent2OutboundAppointment } from "./uptimize/agent-2-outbound-appointment";
import { saveContentPlan, saveDailyBrief, saveAllHooks } from "./memory/google-sheets";

/**
 * Validate input task
 */
function validateTask(task: string): { valid: boolean; error?: string } {
    if (!task || typeof task !== "string") {
        return { valid: false, error: "Task must be a non-empty string" };
    }

    if (task.length < CONFIG.MIN_TASK_LENGTH) {
        return { valid: false, error: "Task is too short" };
    }

    if (task.length > CONFIG.MAX_TASK_LENGTH) {
        return {
            valid: false,
            error: `Task exceeds maximum length of ${CONFIG.MAX_TASK_LENGTH} characters`,
        };
    }

    return { valid: true };
}

/**
 * Main orchestrator function using fallback system
 */
export async function runOrchestrator(
    task: string,
    mode: AgentMode = "balanced",
    agent: string = "orchestrator",
    context?: any
): Promise<AgentResult> {
    const startTime = Date.now();
    const taskSummary = logger.summarizeTask(task);

    logger.info("Orchestrator received task", { taskSummary }, { mode, agent });

    // 1. Validate input
    const validation = validateTask(task);
    if (!validation.valid) {
        logger.warn("Task validation failed", { taskSummary }, { reason: validation.error });
        return {
            success: false,
            message: validation.error!,
            error: {
                type: ErrorType.VALIDATION_ERROR,
                details: validation.error!,
                timestamp: new Date().toISOString(),
            },
        };
    }

    // 2. Route to appropriate agent
    if (agent === "zenthia_growth_operator") {
        logger.info("Routing to Zenthia Growth Operator", { taskSummary });
        const zenthiaResult = await runZenthiaGrowthOperator(task, context || {}, mode);

        // Transform FallbackResult to AgentResult with structured data
        if (zenthiaResult.success) {
            // Parse the JSON message and put it in data.result
            let parsedResult;
            try {
                parsedResult = JSON.parse(zenthiaResult.message);
            } catch (e) {
                // If parsing fails, log warning but don't fail the request
                logger.warn("Failed to parse ZGO JSON response", {}, { error: e instanceof Error ? e.message : String(e) });
                parsedResult = null;
            }

            // Save to memory (async, don't await to avoid slowing response)
            if (parsedResult) {
                saveContentPlan(parsedResult).catch(err =>
                    logger.warn("Failed to save content plan to memory", {}, { error: String(err) })
                );
            }

            return {
                success: true,
                message: "Growth plan generated successfully",
                data: {
                    provider: zenthiaResult.metadata?.provider || "zenthia",
                    model: zenthiaResult.metadata?.model || "unknown",
                    timestamp: new Date().toISOString(),
                    latencyMs: Date.now() - startTime,
                    tokensUsed: zenthiaResult.metadata?.tokensUsed,
                    result: parsedResult  // Structured JSON here
                },
            };
        } else {
            return {
                success: false,
                message: zenthiaResult.message,
                error: {
                    type: zenthiaResult.error?.type || ErrorType.UNKNOWN_ERROR,
                    details: zenthiaResult.error?.details || "Unknown error",
                    timestamp: new Date().toISOString(),
                },
                data: {
                    provider: "zenthia",
                    model: "none",
                    timestamp: new Date().toISOString(),
                    latencyMs: Date.now() - startTime,
                },
            };
        }
    }

    // 2.5. Check for daily_brief special task
    if (agent === "zenthia_growth_operator" && (task.toLowerCase() === "daily_brief" || task.toLowerCase().includes("daily brief"))) {
        logger.info("Routing to Daily Growth Brief", { taskSummary });
        const briefResult = await runDailyBrief(context || {}, mode);

        // Transform result similar to ZGO
        if (briefResult.success) {
            let parsedResult;
            try {
                parsedResult = JSON.parse(briefResult.message);
            } catch (e) {
                logger.warn("Failed to parse daily brief JSON response", {}, { error: e instanceof Error ? e.message : String(e) });
                parsedResult = null;
            }

            // Save brief to memory
            if (parsedResult) {
                saveDailyBrief(parsedResult).catch(err =>
                    logger.warn("Failed to save daily brief to memory", {}, { error: String(err) })
                );
            }

            return {
                success: true,
                message: "Daily brief generated successfully",
                data: {
                    provider: briefResult.metadata?.provider || "zenthia",
                    model: briefResult.metadata?.model || "unknown",
                    timestamp: new Date().toISOString(),
                    latencyMs: Date.now() - startTime,
                    tokensUsed: briefResult.metadata?.tokensUsed,
                    result: parsedResult
                },
            };
        } else {
            return {
                success: false,
                message: briefResult.message,
                error: {
                    type: briefResult.error?.type || ErrorType.UNKNOWN_ERROR,
                    details: briefResult.error?.details || "Unknown error",
                    timestamp: new Date().toISOString(),
                },
                data: {
                    provider: "zenthia",
                    model: "none",
                    timestamp: new Date().toISOString(),
                    latencyMs: Date.now() - startTime,
                },
            };
        }
    }

    // 3. Zenthia Content Factory
    if (agent === "zenthia_content_factory") {
        logger.info("Routing to Zenthia Content Factory");
        const factoryResult = await runZenthiaContentFactory(task, context || {}, mode);

        if (factoryResult.success) {
            // Parse JSON from message (same pattern as ZGO)
            let parsedResult;
            try {
                parsedResult = JSON.parse(factoryResult.message);
            } catch (e) {
                logger.warn("Failed to parse Content Factory JSON", {}, { error: e instanceof Error ? e.message : String(e) });
                parsedResult = null;
            }

            // Save hooks if parsing succeeded
            if (parsedResult?.hooks && Array.isArray(parsedResult.hooks)) {
                const platform = parsedResult.meta?.platform || context?.platform || 'TikTok';
                saveAllHooks(parsedResult.hooks, platform).catch(err =>
                    logger.warn("Failed to save hooks", {}, { error: String(err) })
                );
            }

            return {
                success: true,
                message: "Content batch generated",
                data: {
                    agent: 'zenthia_content_factory',
                    provider: factoryResult.metadata?.provider || 'unknown',
                    model: factoryResult.metadata?.model || 'unknown',
                    timestamp: new Date().toISOString(),
                    latencyMs: Date.now() - startTime,
                    tokensUsed: factoryResult.metadata?.tokensUsed,
                    result: parsedResult
                }
            };
        }

        return {
            success: false,
            message: factoryResult.message || "Content Factory failed",
            error: {
                type: ErrorType.MODEL_ERROR,
                details: factoryResult.message,
                timestamp: new Date().toISOString(),
            },
        };
    }

    // 3.5. UptimizeAI Agent 1: Market Intelligence & Targeting
    if (agent === "uptimize_agent_1" || agent === "market_intelligence") {
        logger.info("Routing to UptimizeAI Agent 1: Market Intelligence & Targeting", { taskSummary });
        const agent1Result = await runAgent1MarketIntelligence(task, context || {}, mode);

        if (agent1Result.success && agent1Result.data) {
            return {
                success: true,
                message: "Target pack generated successfully",
                data: {
                    agent: 'uptimize_agent_1',
                    provider: agent1Result.metadata?.provider || 'unknown',
                    model: agent1Result.metadata?.model || 'unknown',
                    timestamp: new Date().toISOString(),
                    latencyMs: Date.now() - startTime,
                    tokensUsed: agent1Result.metadata?.tokensUsed,
                    result: agent1Result.data
                }
            };
        }

        return {
            success: false,
            message: agent1Result.message || "Agent 1 failed",
            error: {
                type: agent1Result.error?.type || ErrorType.MODEL_ERROR,
                details: agent1Result.error?.details || "Unknown error",
                timestamp: new Date().toISOString(),
            },
            data: {
                provider: agent1Result.metadata?.provider || 'unknown',
                model: agent1Result.metadata?.model || 'unknown',
                timestamp: new Date().toISOString(),
                latencyMs: Date.now() - startTime,
            }
        };
    }

    // 3.6. UptimizeAI Agent 2: Outbound & Appointment Setter
    if (agent === "uptimize_agent_2" || agent === "outbound_appointment") {
        logger.info("Routing to UptimizeAI Agent 2: Outbound & Appointment Setter", { taskSummary });
        const agent2Result = await runAgent2OutboundAppointment(task, context || {}, mode);

        if (agent2Result.success && agent2Result.data) {
            return {
                success: true,
                message: "Outbound campaign and bookings generated successfully",
                data: {
                    agent: 'uptimize_agent_2',
                    provider: agent2Result.metadata?.provider || 'unknown',
                    model: agent2Result.metadata?.model || 'unknown',
                    timestamp: new Date().toISOString(),
                    latencyMs: Date.now() - startTime,
                    tokensUsed: agent2Result.metadata?.tokensUsed,
                    result: agent2Result.data
                }
            };
        }

        return {
            success: false,
            message: agent2Result.message || "Agent 2 failed",
            error: {
                type: agent2Result.error?.type || ErrorType.MODEL_ERROR,
                details: agent2Result.error?.details || "Unknown error",
                timestamp: new Date().toISOString(),
            },
            data: {
                provider: agent2Result.metadata?.provider || 'unknown',
                model: agent2Result.metadata?.model || 'unknown',
                timestamp: new Date().toISOString(),
                latencyMs: Date.now() - startTime,
            }
        };
    }

    // 4. Default: Execute with fallback (current orchestrator behavior)
    const result = await executeWithFallback(task, mode, CONFIG.DEFAULT_TIMEOUT_MS);

    // 4. Calculate cost tracking if successful
    let usage;
    if (result.success && result.metadata) {
        const totalTokens = result.metadata.tokensUsed || 0;
        const cost = calculateCost(
            result.metadata.provider as any,
            totalTokens
        );

        usage = {
            totalTokens,
            estimatedCostUSD: cost,
            providerCosts: [{
                provider: result.metadata.provider,
                tokens: totalTokens,
                costUSD: cost,
            }],
        };
    }

    // 5. Build response
    if (result.success) {
        logger.info("Orchestrator completed successfully", { taskSummary }, {
            provider: result.metadata?.provider,
            latencyMs: Date.now() - startTime,
            mode,
        });

        return {
            success: true,
            message: result.message,
            data: {
                provider: result.metadata?.provider || "unknown",
                model: result.metadata?.model || "unknown",
                timestamp: new Date().toISOString(),
                latencyMs: Date.now() - startTime,
                tokensUsed: result.metadata?.tokensUsed,
            },
            usage,
        };
    } else {
        logger.error("Orchestrator failed", { taskSummary }, {
            attempts: result.attempts.length,
            latencyMs: Date.now() - startTime,
            mode,
        });

        return {
            success: false,
            message: result.message,
            error: {
                type: result.error?.type || ErrorType.UNKNOWN_ERROR,
                details: result.error?.details || "Unknown error",
                timestamp: new Date().toISOString(),
            },
            data: {
                provider: "none",
                model: "none",
                timestamp: new Date().toISOString(),
                latencyMs: Date.now() - startTime,
            },
        };
    }
}
