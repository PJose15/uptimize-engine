/**
 * Orchestrator using fallback system with cost tracking
 */

import { AgentResult, ErrorType, AgentMode } from "./types";
import { logger } from "./logger";
import { executeWithFallback } from "./fallback";
import { CONFIG } from "./config";
import { calculateCost } from "./cost";
import { runZenthiaGrowthOperator } from "./zenthia-growth-operator";

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
        const zenthiaResult = await runZenthiaGrowthOperator(task, context || {});

        // Transform FallbackResult to AgentResult
        if (zenthiaResult.success) {
            return {
                success: true,
                message: zenthiaResult.message,
                data: {
                    provider: zenthiaResult.metadata?.provider || "zenthia",
                    model: zenthiaResult.metadata?.model || "unknown",
                    timestamp: new Date().toISOString(),
                    latencyMs: Date.now() - startTime,
                    tokensUsed: zenthiaResult.metadata?.tokensUsed,
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
