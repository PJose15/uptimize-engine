/**
 * Provider Adapter — Standard Response Format
 *
 * Insulates routing logic from provider API changes.
 * Every provider call goes through the adapter and returns
 * a normalized response, regardless of which LLM was used.
 */

// ============================================================================
// STANDARD RESPONSE FORMAT
// ============================================================================

export interface StandardLLMResponse {
    /** Whether the call succeeded */
    success: boolean;
    /** Normalized text content */
    content: string;
    /** Parsed JSON if the response is structured */
    parsed_json: Record<string, unknown> | null;
    /** Which provider handled this */
    provider: ProviderName;
    /** Which model was used */
    model: string;
    /** Token usage */
    usage: TokenUsage;
    /** Timing */
    latency_ms: number;
    /** Estimated cost */
    cost_usd: number;
    /** Error details if failed */
    error: string | null;
    /** Raw response (for debugging) */
    raw?: unknown;
}

export interface TokenUsage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}

export type ProviderName = "gemini" | "openai" | "anthropic" | "perplexity";

// ============================================================================
// PROVIDER CONFIG
// ============================================================================

export interface ProviderConfig {
    name: ProviderName;
    api_key: string;
    base_url: string;
    default_model: string;
    models: ModelSpec[];
    enabled: boolean;
}

export interface ModelSpec {
    id: string;
    /** What this model excels at */
    strengths: ModelStrength[];
    /** Approximate cost per 1M input tokens */
    cost_per_1m_input: number;
    /** Approximate cost per 1M output tokens */
    cost_per_1m_output: number;
    /** Max context window */
    max_tokens: number;
    /** Average latency for typical request */
    avg_latency_ms: number;
    /** JSON mode reliability (0-1) */
    json_reliability: number;
    /** Tool/function calling support */
    supports_tools: boolean;
    /** Web search capability (Perplexity only) */
    supports_web_search: boolean;
}

export type ModelStrength =
    | "reasoning"
    | "speed"
    | "json_compliance"
    | "tool_use"
    | "web_search"
    | "creative_writing"
    | "code_generation"
    | "analysis"
    | "summarization"
    | "cost_efficient";

// ============================================================================
// MODEL REGISTRY
// ============================================================================

export const MODEL_REGISTRY: Record<ProviderName, ModelSpec[]> = {
    gemini: [
        {
            id: "gemini-2.5-flash",
            strengths: ["speed", "cost_efficient", "json_compliance"],
            cost_per_1m_input: 0.075,
            cost_per_1m_output: 0.30,
            max_tokens: 1_000_000,
            avg_latency_ms: 800,
            json_reliability: 0.90,
            supports_tools: true,
            supports_web_search: false,
        },
        {
            id: "gemini-2.5-pro",
            strengths: ["reasoning", "analysis", "json_compliance", "code_generation"],
            cost_per_1m_input: 1.25,
            cost_per_1m_output: 10.0,
            max_tokens: 1_000_000,
            avg_latency_ms: 3000,
            json_reliability: 0.95,
            supports_tools: true,
            supports_web_search: false,
        },
    ],
    openai: [
        {
            id: "gpt-4o",
            strengths: ["reasoning", "creative_writing", "tool_use", "json_compliance"],
            cost_per_1m_input: 2.50,
            cost_per_1m_output: 10.0,
            max_tokens: 128_000,
            avg_latency_ms: 2000,
            json_reliability: 0.95,
            supports_tools: true,
            supports_web_search: false,
        },
        {
            id: "gpt-4o-mini",
            strengths: ["speed", "cost_efficient", "json_compliance"],
            cost_per_1m_input: 0.15,
            cost_per_1m_output: 0.60,
            max_tokens: 128_000,
            avg_latency_ms: 1000,
            json_reliability: 0.90,
            supports_tools: true,
            supports_web_search: false,
        },
    ],
    anthropic: [
        {
            id: "claude-sonnet-4-20250514",
            strengths: ["reasoning", "analysis", "json_compliance", "code_generation"],
            cost_per_1m_input: 3.0,
            cost_per_1m_output: 15.0,
            max_tokens: 200_000,
            avg_latency_ms: 2500,
            json_reliability: 0.95,
            supports_tools: true,
            supports_web_search: false,
        },
        {
            id: "claude-3-5-haiku-20241022",
            strengths: ["speed", "cost_efficient", "summarization"],
            cost_per_1m_input: 0.80,
            cost_per_1m_output: 4.0,
            max_tokens: 200_000,
            avg_latency_ms: 1200,
            json_reliability: 0.85,
            supports_tools: true,
            supports_web_search: false,
        },
    ],
    perplexity: [
        {
            id: "sonar-pro",
            strengths: ["web_search", "reasoning", "analysis"],
            cost_per_1m_input: 3.0,
            cost_per_1m_output: 15.0,
            max_tokens: 200_000,
            avg_latency_ms: 3000,
            json_reliability: 0.75,
            supports_tools: false,
            supports_web_search: true,
        },
        {
            id: "sonar",
            strengths: ["web_search", "speed", "cost_efficient"],
            cost_per_1m_input: 1.0,
            cost_per_1m_output: 1.0,
            max_tokens: 128_000,
            avg_latency_ms: 2000,
            json_reliability: 0.70,
            supports_tools: false,
            supports_web_search: true,
        },
    ],
};

// ============================================================================
// ADAPTER FUNCTIONS
// ============================================================================

/**
 * Calculate estimated cost for a response
 */
export function estimateCost(
    provider: ProviderName,
    model: string,
    usage: TokenUsage
): number {
    const specs = MODEL_REGISTRY[provider];
    const spec = specs?.find(s => s.id === model);
    if (!spec) return 0;

    const inputCost = (usage.prompt_tokens / 1_000_000) * spec.cost_per_1m_input;
    const outputCost = (usage.completion_tokens / 1_000_000) * spec.cost_per_1m_output;
    return Number((inputCost + outputCost).toFixed(6));
}

/**
 * Try to parse JSON from LLM response text
 */
export function tryParseJson(content: string): Record<string, unknown> | null {
    try {
        // Try direct parse first
        return JSON.parse(content);
    } catch {
        // Try to extract JSON from markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[1].trim());
            } catch {
                return null;
            }
        }
        return null;
    }
}

/**
 * Create a standard error response
 */
export function createErrorResponse(
    provider: ProviderName,
    model: string,
    error: string,
    latencyMs: number = 0
): StandardLLMResponse {
    return {
        success: false,
        content: "",
        parsed_json: null,
        provider,
        model,
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        latency_ms: latencyMs,
        cost_usd: 0,
        error,
    };
}
