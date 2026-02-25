/**
 * Provider Router — Requirement-Based Model Selection
 *
 * Routes tasks to the best-fit model based on task requirements,
 * not hard-coded mappings. The best model for a task changes as
 * providers update — this system adapts based on specs.
 */

import {
    type ProviderName,
    type ModelSpec,
    type ModelStrength,
    MODEL_REGISTRY,
} from "./adapter";

// ============================================================================
// TASK REQUIREMENTS
// ============================================================================

export interface TaskRequirements {
    /** Does this task need live web search results? */
    needs_web_search: boolean;
    /** Does the output need to be valid JSON? */
    needs_structured_json: boolean;
    /** How deep does the reasoning need to be? */
    reasoning_depth: "shallow" | "medium" | "deep";
    /** Maximum acceptable latency */
    max_latency_ms: number;
    /** Maximum acceptable cost per call */
    max_cost_usd: number;
    /** Does the task need tool/function calling? */
    needs_tool_use: boolean;
    /** Preferred strengths (optional) */
    preferred_strengths?: ModelStrength[];
}

export interface RoutingResult {
    /** Ordered list of models to try (primary → fallbacks) */
    candidates: RoutingCandidate[];
    /** Why this order was chosen */
    reasoning: string;
}

export interface RoutingCandidate {
    provider: ProviderName;
    model: string;
    score: number;
    reasons: string[];
}

// ============================================================================
// AGENT DEFAULT REQUIREMENTS
// ============================================================================

/** Default task requirements per agent — can be overridden per call */
export const AGENT_DEFAULTS: Record<string, TaskRequirements> = {
    agent1: {
        // Market Intelligence — needs web search for research
        needs_web_search: true,
        needs_structured_json: true,
        reasoning_depth: "medium",
        max_latency_ms: 30_000,
        max_cost_usd: 0.50,
        needs_tool_use: false,
        preferred_strengths: ["web_search", "analysis"],
    },
    agent2: {
        // Discovery & Diagnosis — deep analysis, structured output
        needs_web_search: false,
        needs_structured_json: true,
        reasoning_depth: "deep",
        max_latency_ms: 60_000,
        max_cost_usd: 0.50,
        needs_tool_use: false,
        preferred_strengths: ["reasoning", "analysis", "json_compliance"],
    },
    agent3: {
        // Sales Engineer — proposals, SOWs, creative + structured
        needs_web_search: false,
        needs_structured_json: true,
        reasoning_depth: "deep",
        max_latency_ms: 60_000,
        max_cost_usd: 1.00,
        needs_tool_use: false,
        preferred_strengths: ["reasoning", "creative_writing", "json_compliance"],
    },
    agent4: {
        // Systems Delivery — technical, tool-use oriented
        needs_web_search: false,
        needs_structured_json: true,
        reasoning_depth: "medium",
        max_latency_ms: 45_000,
        max_cost_usd: 0.50,
        needs_tool_use: true,
        preferred_strengths: ["code_generation", "tool_use", "json_compliance"],
    },
    agent5: {
        // Client Success — analysis, summarization
        needs_web_search: false,
        needs_structured_json: true,
        reasoning_depth: "medium",
        max_latency_ms: 30_000,
        max_cost_usd: 0.30,
        needs_tool_use: false,
        preferred_strengths: ["analysis", "summarization", "json_compliance"],
    },
};

// ============================================================================
// ROUTER
// ============================================================================

/**
 * Route a task to the best model(s) based on requirements
 */
export function routeTask(
    requirements: TaskRequirements,
    availableProviders?: ProviderName[]
): RoutingResult {
    const providers = availableProviders || (Object.keys(MODEL_REGISTRY) as ProviderName[]);
    const candidates: RoutingCandidate[] = [];

    for (const provider of providers) {
        const models = MODEL_REGISTRY[provider];
        if (!models) continue;

        for (const model of models) {
            const { score, reasons } = scoreModel(model, provider, requirements);
            if (score > 0) {
                candidates.push({ provider, model: model.id, score, reasons });
            }
        }
    }

    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);

    const reasoning = candidates.length > 0
        ? `Best: ${candidates[0].provider}/${candidates[0].model} (score: ${candidates[0].score}) — ${candidates[0].reasons.join(", ")}`
        : "No suitable models found for requirements";

    return { candidates, reasoning };
}

/**
 * Route for a specific agent using its defaults
 */
export function routeForAgent(
    agentId: string,
    overrides?: Partial<TaskRequirements>,
    availableProviders?: ProviderName[]
): RoutingResult {
    const defaults = AGENT_DEFAULTS[agentId];
    if (!defaults) {
        return routeTask({
            needs_web_search: false,
            needs_structured_json: true,
            reasoning_depth: "medium",
            max_latency_ms: 30_000,
            max_cost_usd: 0.50,
            needs_tool_use: false,
        }, availableProviders);
    }

    const requirements: TaskRequirements = { ...defaults, ...overrides };
    return routeTask(requirements, availableProviders);
}

// ============================================================================
// SCORING
// ============================================================================

function scoreModel(
    model: ModelSpec,
    provider: ProviderName,
    requirements: TaskRequirements
): { score: number; reasons: string[] } {
    let score = 50; // Base score
    const reasons: string[] = [];

    // Hard requirements — if not met, score = 0
    if (requirements.needs_web_search && !model.supports_web_search) {
        return { score: 0, reasons: ["No web search support"] };
    }

    if (requirements.needs_tool_use && !model.supports_tools) {
        return { score: 0, reasons: ["No tool use support"] };
    }

    // Web search bonus
    if (requirements.needs_web_search && model.supports_web_search) {
        score += 30;
        reasons.push("Has web search");
    }

    // JSON reliability
    if (requirements.needs_structured_json) {
        if (model.json_reliability >= 0.95) {
            score += 20;
            reasons.push("High JSON reliability");
        } else if (model.json_reliability >= 0.85) {
            score += 10;
            reasons.push("Good JSON reliability");
        } else if (model.json_reliability < 0.75) {
            score -= 15;
            reasons.push("Low JSON reliability");
        }
    }

    // Reasoning depth
    if (requirements.reasoning_depth === "deep") {
        if (model.strengths.includes("reasoning")) {
            score += 20;
            reasons.push("Strong reasoning");
        }
    } else if (requirements.reasoning_depth === "shallow") {
        if (model.strengths.includes("speed")) {
            score += 15;
            reasons.push("Fast for shallow tasks");
        }
    }

    // Latency
    if (model.avg_latency_ms <= requirements.max_latency_ms) {
        // Bonus for being well within the limit
        const headroom = 1 - (model.avg_latency_ms / requirements.max_latency_ms);
        score += Math.round(headroom * 10);
        if (headroom > 0.5) reasons.push("Low latency");
    } else {
        score -= 20;
        reasons.push("May exceed latency limit");
    }

    // Cost efficiency
    const estimatedCost = (model.cost_per_1m_input * 2000 + model.cost_per_1m_output * 1000) / 1_000_000;
    if (estimatedCost <= requirements.max_cost_usd) {
        if (model.strengths.includes("cost_efficient")) {
            score += 10;
            reasons.push("Cost efficient");
        }
    } else {
        score -= 15;
        reasons.push("May exceed cost limit");
    }

    // Preferred strengths match
    if (requirements.preferred_strengths) {
        const matchCount = requirements.preferred_strengths.filter(s =>
            model.strengths.includes(s)
        ).length;
        score += matchCount * 5;
        if (matchCount > 0) {
            reasons.push(`${matchCount} strength match${matchCount > 1 ? "es" : ""}`);
        }
    }

    // Tool use bonus when needed
    if (requirements.needs_tool_use && model.supports_tools) {
        score += 10;
        reasons.push("Supports tool use");
    }

    return { score, reasons };
}
