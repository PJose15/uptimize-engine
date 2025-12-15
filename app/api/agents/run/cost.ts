/**
 * Cost calculation utilities for API usage tracking
 */

import { ProviderName } from "./types";

// Pricing as of December 2024 (per 1M tokens)
const PRICING = {
    [ProviderName.GEMINI]: {
        input: 0.075,   // $0.075 per 1M input tokens
        output: 0.30,   // $0.30 per 1M output tokens
    },
    [ProviderName.OPENAI]: {
        input: 0.15,    // $0.15 per 1M input tokens (gpt-4o-mini)
        output: 0.60,   // $0.60 per 1M output tokens
    },
    [ProviderName.ANTHROPIC]: {
        input: 3.00,    // $3.00 per 1M input tokens (claude-3-5-sonnet)
        output: 15.00,  // $15.00 per 1M output tokens
    },
    [ProviderName.PERPLEXITY]: {
        input: 0.20,    // Estimated
        output: 0.80,   // Estimated
    },
};

/**
 * Calculate cost for token usage
 */
export function calculateCost(
    provider: ProviderName,
    totalTokens: number,
    inputTokens?: number,
    outputTokens?: number
): number {
    const pricing = PRICING[provider];
    if (!pricing) return 0;

    // If we have input/output breakdown, use it
    if (inputTokens !== undefined && outputTokens !== undefined) {
        const inputCost = (inputTokens / 1_000_000) * pricing.input;
        const outputCost = (outputTokens / 1_000_000) * pricing.output;
        return inputCost + outputCost;
    }

    // Otherwise, estimate (assume 50/50 split, which is conservative)
    const avgPrice = (pricing.input + pricing.output) / 2;
    return (totalTokens / 1_000_000) * avgPrice;
}

/**
 * Format cost as USD string
 */
export function formatCost(costUSD: number): string {
    if (costUSD < 0.01) {
        return `$${(costUSD * 1000).toFixed(4)}k`; // Show as fraction of a cent
    }
    return `$${costUSD.toFixed(4)}`;
}
