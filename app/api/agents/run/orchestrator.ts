/**
 * Orchestrator using fallback system with cost tracking
 */

import { AgentResult, ErrorType, AgentMode } from "./types";
import { logger } from "./logger";
import { executeWithFallback } from "./fallback";
import { CONFIG } from "./config";
import { calculateCost } from "./cost";
import { runAgent1MarketIntelligence } from "./uptimize/agent-1-market-intelligence";
import { runAgent2OutboundAppointment } from "./uptimize/agent-2-outbound-appointment";
import { runAgent3SalesEngineer } from "./uptimize/agent-3-sales-engineer";
import { runAgent4SystemsDelivery } from "./uptimize/agent-4-systems-delivery";
import { runAgent5Orchestrated } from "./uptimize/agent-5-client-success";
import { runSmartGymLeadCapture } from "./internal/smartgym/lead-capture-agent";
import { runSmartGymMemberRetention } from "./internal/smartgym/member-retention-agent";
import { runSmartGymOperations } from "./internal/smartgym/operations-agent";
import { runPVisionFieldOps } from "./internal/pvision/field-ops-agent";
import { runPVisionLeadRouting } from "./internal/pvision/lead-routing-agent";
import { runPVisionBilling } from "./internal/pvision/billing-agent";

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

    // UptimizeAI Agent 1: Market Intelligence & Targeting
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
                    result: agent1Result.data,
                    audit: {
                        invoked_at: new Date().toISOString(),
                        agent_id: 'uptimize_agent_1',
                        mode,
                        task_preview: task.slice(0, 100),
                        context_keys: Object.keys(context || {})
                    }
                }
            };
        }

        return {
            success: false,
            message: agent1Result.message || "Agent 1 failed",
            error: {
                type: (agent1Result.error?.type || ErrorType.MODEL_ERROR) as ErrorType,
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
                    result: agent2Result.data,
                    audit: {
                        invoked_at: new Date().toISOString(),
                        agent_id: 'uptimize_agent_2',
                        mode,
                        task_preview: task.slice(0, 100),
                        context_keys: Object.keys(context || {})
                    }
                }
            };
        }

        return {
            success: false,
            message: agent2Result.message || "Agent 2 failed",
            error: {
                type: (agent2Result.error?.type || ErrorType.MODEL_ERROR) as ErrorType,
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

    // 3.7. UptimizeAI Agent 3: Sales Engineer & Offer Architect
    if (agent === "uptimize_agent_3" || agent === "sales_engineer") {
        logger.info("Routing to UptimizeAI Agent 3: Sales Engineer & Offer Architect", { taskSummary });
        const agent3Result = await runAgent3SalesEngineer(task, context || {}, mode);

        if (agent3Result.success && agent3Result.data) {
            return {
                success: true,
                message: "Proposal and SOW generated successfully",
                data: {
                    agent: 'uptimize_agent_3',
                    provider: agent3Result.metadata?.provider || 'unknown',
                    model: agent3Result.metadata?.model || 'unknown',
                    timestamp: new Date().toISOString(),
                    latencyMs: Date.now() - startTime,
                    tokensUsed: agent3Result.metadata?.tokensUsed,
                    result: agent3Result.data,
                    audit: {
                        invoked_at: new Date().toISOString(),
                        agent_id: 'uptimize_agent_3',
                        mode,
                        task_preview: task.slice(0, 100),
                        context_keys: Object.keys(context || {})
                    }
                }
            };
        }

        return {
            success: false,
            message: agent3Result.message || "Agent 3 failed",
            error: {
                type: (agent3Result.error?.type || ErrorType.MODEL_ERROR) as ErrorType,
                details: agent3Result.error?.details || "Unknown error",
                timestamp: new Date().toISOString(),
            },
            data: {
                provider: agent3Result.metadata?.provider || 'unknown',
                model: agent3Result.metadata?.model || 'unknown',
                timestamp: new Date().toISOString(),
                latencyMs: Date.now() - startTime,
            }
        };
    }

    // 3.8. UptimizeAI Agent 4: Systems Builder & Delivery Orchestrator
    if (agent === "uptimize_agent_4" || agent === "systems_delivery") {
        logger.info("Routing to UptimizeAI Agent 4: Systems Builder & Delivery Orchestrator", { taskSummary });
        const agent4Result = await runAgent4SystemsDelivery(task, context || {}, mode);

        if (agent4Result.success && agent4Result.data) {
            return {
                success: true,
                message: "Delivery package generated successfully",
                data: {
                    agent: 'uptimize_agent_4',
                    provider: agent4Result.metadata?.provider || 'unknown',
                    model: agent4Result.metadata?.model || 'unknown',
                    timestamp: new Date().toISOString(),
                    latencyMs: Date.now() - startTime,
                    tokensUsed: agent4Result.metadata?.tokensUsed,
                    result: agent4Result.data,
                    audit: {
                        invoked_at: new Date().toISOString(),
                        agent_id: 'uptimize_agent_4',
                        mode,
                        task_preview: task.slice(0, 100),
                        context_keys: Object.keys(context || {})
                    }
                }
            };
        }

        return {
            success: false,
            message: agent4Result.message || "Agent 4 failed",
            error: {
                type: (agent4Result.error?.type || ErrorType.MODEL_ERROR) as ErrorType,
                details: agent4Result.error?.details || "Unknown error",
                timestamp: new Date().toISOString(),
            },
            data: {
                provider: agent4Result.metadata?.provider || 'unknown',
                model: agent4Result.metadata?.model || 'unknown',
                timestamp: new Date().toISOString(),
                latencyMs: Date.now() - startTime,
            }
        };
    }

    // 3.9. UptimizeAI Agent 5: Client Success, Retention & Expansion
    if (agent === "uptimize_agent_5" || agent === "client_success") {
        logger.info("Routing to UptimizeAI Agent 5: Client Success", { taskSummary });
        const agent5Result = await runAgent5Orchestrated(task, context || {}, mode);

        if (agent5Result.success && agent5Result.data) {
            return {
                success: true,
                message: "Client success package generated successfully",
                data: {
                    agent: 'uptimize_agent_5',
                    provider: agent5Result.metadata?.provider || 'unknown',
                    model: agent5Result.metadata?.model || 'unknown',
                    timestamp: new Date().toISOString(),
                    latencyMs: Date.now() - startTime,
                    tokensUsed: agent5Result.metadata?.tokensUsed,
                    result: agent5Result.data,
                    audit: {
                        invoked_at: new Date().toISOString(),
                        agent_id: 'uptimize_agent_5',
                        mode,
                        task_preview: task.slice(0, 100),
                        context_keys: Object.keys(context || {})
                    }
                }
            };
        }

        return {
            success: false,
            message: agent5Result.message || "Agent 5 failed",
            error: {
                type: (agent5Result.error?.type || ErrorType.MODEL_ERROR) as ErrorType,
                details: agent5Result.error?.details || "Unknown error",
                timestamp: new Date().toISOString(),
            },
            data: {
                provider: agent5Result.metadata?.provider || 'unknown',
                model: agent5Result.metadata?.model || 'unknown',
                timestamp: new Date().toISOString(),
                latencyMs: Date.now() - startTime,
            }
        };
    }

    // 3.10. Internal Venture Agents — SmartGym
    if (agent === "internal_smartgym_lead_capture") {
        logger.info("Routing to SmartGym Lead Capture Agent", { taskSummary });
        const agentResult = await runSmartGymLeadCapture(task, context || {}, mode);

        if (agentResult.success && agentResult.data) {
            return {
                success: true,
                message: "Lead captured and qualified successfully",
                data: {
                    agent: 'internal_smartgym_lead_capture',
                    provider: agentResult.metadata?.provider || 'unknown',
                    model: agentResult.metadata?.model || 'unknown',
                    timestamp: new Date().toISOString(),
                    latencyMs: Date.now() - startTime,
                    tokensUsed: agentResult.metadata?.tokensUsed,
                    result: agentResult.data
                }
            };
        }

        return {
            success: false,
            message: agentResult.message || "SmartGym Lead Capture failed",
            error: {
                type: (agentResult.error?.type || ErrorType.MODEL_ERROR) as ErrorType,
                details: agentResult.error?.details || "Unknown error",
                timestamp: new Date().toISOString(),
            },
            data: {
                provider: agentResult.metadata?.provider || 'unknown',
                model: agentResult.metadata?.model || 'unknown',
                timestamp: new Date().toISOString(),
                latencyMs: Date.now() - startTime,
            }
        };
    }

    if (agent === "internal_smartgym_member_retention") {
        logger.info("Routing to SmartGym Member Retention Agent", { taskSummary });
        const agentResult = await runSmartGymMemberRetention(task, context || {}, mode);

        if (agentResult.success && agentResult.data) {
            return {
                success: true,
                message: "Member retention analysis generated successfully",
                data: {
                    agent: 'internal_smartgym_member_retention',
                    provider: agentResult.metadata?.provider || 'unknown',
                    model: agentResult.metadata?.model || 'unknown',
                    timestamp: new Date().toISOString(),
                    latencyMs: Date.now() - startTime,
                    tokensUsed: agentResult.metadata?.tokensUsed,
                    result: agentResult.data
                }
            };
        }

        return {
            success: false,
            message: agentResult.message || "SmartGym Member Retention failed",
            error: {
                type: (agentResult.error?.type || ErrorType.MODEL_ERROR) as ErrorType,
                details: agentResult.error?.details || "Unknown error",
                timestamp: new Date().toISOString(),
            },
            data: {
                provider: agentResult.metadata?.provider || 'unknown',
                model: agentResult.metadata?.model || 'unknown',
                timestamp: new Date().toISOString(),
                latencyMs: Date.now() - startTime,
            }
        };
    }

    if (agent === "internal_smartgym_operations") {
        logger.info("Routing to SmartGym Operations Agent", { taskSummary });
        const agentResult = await runSmartGymOperations(task, context || {}, mode);

        if (agentResult.success && agentResult.data) {
            return {
                success: true,
                message: "Operations dashboard generated successfully",
                data: {
                    agent: 'internal_smartgym_operations',
                    provider: agentResult.metadata?.provider || 'unknown',
                    model: agentResult.metadata?.model || 'unknown',
                    timestamp: new Date().toISOString(),
                    latencyMs: Date.now() - startTime,
                    tokensUsed: agentResult.metadata?.tokensUsed,
                    result: agentResult.data
                }
            };
        }

        return {
            success: false,
            message: agentResult.message || "SmartGym Operations failed",
            error: {
                type: (agentResult.error?.type || ErrorType.MODEL_ERROR) as ErrorType,
                details: agentResult.error?.details || "Unknown error",
                timestamp: new Date().toISOString(),
            },
            data: {
                provider: agentResult.metadata?.provider || 'unknown',
                model: agentResult.metadata?.model || 'unknown',
                timestamp: new Date().toISOString(),
                latencyMs: Date.now() - startTime,
            }
        };
    }

    // 3.11. Internal Venture Agents — PVision
    if (agent === "internal_pvision_field_ops") {
        logger.info("Routing to PVision Field Ops Agent", { taskSummary });
        const agentResult = await runPVisionFieldOps(task, context || {}, mode);

        if (agentResult.success && agentResult.data) {
            return {
                success: true,
                message: "Field ops dispatch schedule generated successfully",
                data: {
                    agent: 'internal_pvision_field_ops',
                    provider: agentResult.metadata?.provider || 'unknown',
                    model: agentResult.metadata?.model || 'unknown',
                    timestamp: new Date().toISOString(),
                    latencyMs: Date.now() - startTime,
                    tokensUsed: agentResult.metadata?.tokensUsed,
                    result: agentResult.data
                }
            };
        }

        return {
            success: false,
            message: agentResult.message || "PVision Field Ops failed",
            error: {
                type: (agentResult.error?.type || ErrorType.MODEL_ERROR) as ErrorType,
                details: agentResult.error?.details || "Unknown error",
                timestamp: new Date().toISOString(),
            },
            data: {
                provider: agentResult.metadata?.provider || 'unknown',
                model: agentResult.metadata?.model || 'unknown',
                timestamp: new Date().toISOString(),
                latencyMs: Date.now() - startTime,
            }
        };
    }

    if (agent === "internal_pvision_lead_routing") {
        logger.info("Routing to PVision Lead Routing Agent", { taskSummary });
        const agentResult = await runPVisionLeadRouting(task, context || {}, mode);

        if (agentResult.success && agentResult.data) {
            return {
                success: true,
                message: "Lead qualified and routed successfully",
                data: {
                    agent: 'internal_pvision_lead_routing',
                    provider: agentResult.metadata?.provider || 'unknown',
                    model: agentResult.metadata?.model || 'unknown',
                    timestamp: new Date().toISOString(),
                    latencyMs: Date.now() - startTime,
                    tokensUsed: agentResult.metadata?.tokensUsed,
                    result: agentResult.data
                }
            };
        }

        return {
            success: false,
            message: agentResult.message || "PVision Lead Routing failed",
            error: {
                type: (agentResult.error?.type || ErrorType.MODEL_ERROR) as ErrorType,
                details: agentResult.error?.details || "Unknown error",
                timestamp: new Date().toISOString(),
            },
            data: {
                provider: agentResult.metadata?.provider || 'unknown',
                model: agentResult.metadata?.model || 'unknown',
                timestamp: new Date().toISOString(),
                latencyMs: Date.now() - startTime,
            }
        };
    }

    if (agent === "internal_pvision_billing") {
        logger.info("Routing to PVision Billing Agent", { taskSummary });
        const agentResult = await runPVisionBilling(task, context || {}, mode);

        if (agentResult.success && agentResult.data) {
            return {
                success: true,
                message: "Invoice and billing sequence generated successfully",
                data: {
                    agent: 'internal_pvision_billing',
                    provider: agentResult.metadata?.provider || 'unknown',
                    model: agentResult.metadata?.model || 'unknown',
                    timestamp: new Date().toISOString(),
                    latencyMs: Date.now() - startTime,
                    tokensUsed: agentResult.metadata?.tokensUsed,
                    result: agentResult.data
                }
            };
        }

        return {
            success: false,
            message: agentResult.message || "PVision Billing failed",
            error: {
                type: (agentResult.error?.type || ErrorType.MODEL_ERROR) as ErrorType,
                details: agentResult.error?.details || "Unknown error",
                timestamp: new Date().toISOString(),
            },
            data: {
                provider: agentResult.metadata?.provider || 'unknown',
                model: agentResult.metadata?.model || 'unknown',
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
