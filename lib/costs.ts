/**
 * API Cost Tracking Utility
 * Estimates costs based on token usage for different LLM providers
 */

// Pricing per 1M tokens (as of early 2025)
export const PRICING = {
    gemini: {
        'gemini-2.0-flash-exp': { input: 0.075, output: 0.30 },
        'gemini-1.5-pro': { input: 1.25, output: 5.00 },
        'gemini-1.5-flash': { input: 0.075, output: 0.30 },
    },
    anthropic: {
        'claude-sonnet-4-20250514': { input: 3.00, output: 15.00 },
        'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
        'claude-3-opus-20240229': { input: 15.00, output: 75.00 },
    },
    openai: {
        'gpt-4o': { input: 2.50, output: 10.00 },
        'gpt-4o-mini': { input: 0.15, output: 0.60 },
        'gpt-4-turbo': { input: 10.00, output: 30.00 },
    },
} as const;

export type Provider = keyof typeof PRICING;
export type GeminiModel = keyof typeof PRICING.gemini;
export type AnthropicModel = keyof typeof PRICING.anthropic;
export type OpenAIModel = keyof typeof PRICING.openai;

export interface TokenUsage {
    inputTokens: number;
    outputTokens: number;
}

export interface CostEstimate {
    provider: Provider;
    model: string;
    inputTokens: number;
    outputTokens: number;
    inputCost: number;
    outputCost: number;
    totalCost: number;
}

export interface PipelineCostSummary {
    agents: CostEstimate[];
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCost: number;
    estimatedMonthlyAt: (runsPerDay: number) => number;
}

/**
 * Estimate token count from text (rough approximation)
 * ~4 characters per token for English text
 */
export function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

/**
 * Calculate cost for a single API call
 */
export function calculateCost(
    provider: Provider,
    model: string,
    usage: TokenUsage
): CostEstimate {
    const pricing = PRICING[provider]?.[model as keyof typeof PRICING[typeof provider]];

    if (!pricing) {
        // Default to mid-range pricing if model not found
        console.warn(`Unknown model ${model} for ${provider}, using default pricing`);
        return {
            provider,
            model,
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
            inputCost: (usage.inputTokens / 1_000_000) * 1.0,
            outputCost: (usage.outputTokens / 1_000_000) * 5.0,
            totalCost: (usage.inputTokens / 1_000_000) * 1.0 + (usage.outputTokens / 1_000_000) * 5.0,
        };
    }

    const inputCost = (usage.inputTokens / 1_000_000) * pricing.input;
    const outputCost = (usage.outputTokens / 1_000_000) * pricing.output;

    return {
        provider,
        model,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        inputCost,
        outputCost,
        totalCost: inputCost + outputCost,
    };
}

/**
 * Simpler estimate function when you only have approximate token counts
 */
export function estimateCost(
    provider: Provider,
    model: string,
    inputTokens: number,
    outputTokens: number
): number {
    const estimate = calculateCost(provider, model, { inputTokens, outputTokens });
    return estimate.totalCost;
}

/**
 * Aggregate costs from multiple runs (simple version)
 */
export function aggregateCosts(costs: number[]): number {
    return costs.reduce((sum, cost) => sum + cost, 0);
}

/**
 * Aggregate costs from multiple agent runs
 */
export function aggregatePipelineCosts(costs: CostEstimate[]): PipelineCostSummary {
    const totalInputTokens = costs.reduce((sum, c) => sum + c.inputTokens, 0);
    const totalOutputTokens = costs.reduce((sum, c) => sum + c.outputTokens, 0);
    const totalCost = costs.reduce((sum, c) => sum + c.totalCost, 0);

    return {
        agents: costs,
        totalInputTokens,
        totalOutputTokens,
        totalCost,
        estimatedMonthlyAt: (runsPerDay: number) => totalCost * runsPerDay * 30,
    };
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
    if (cost < 0.01) {
        return `$${(cost * 100).toFixed(3)}¢`;
    }
    return `$${cost.toFixed(4)}`;
}

/**
 * Format token count for display
 */
export function formatTokens(tokens: number): string {
    if (tokens >= 1_000_000) {
        return `${(tokens / 1_000_000).toFixed(1)}M`;
    }
    if (tokens >= 1_000) {
        return `${(tokens / 1_000).toFixed(1)}K`;
    }
    return tokens.toString();
}
