/**
 * Orchestrator using fallback system with cost tracking
 */

import { AgentResult, ErrorType, AgentMode } from "./types";
import { logger } from "./logger";
import { executeWithFallback } from "./fallback";
import { CONFIG } from "./config";
import { calculateCost } from "./cost";
import { runZenthiaGrowthOperator } from "./zenthia-growth-operator";
import { runDailyBrief } from "./zenthia-daily-brief";

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

    // 3. Default: Execute with fallback (current orchestrator behavior)
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
