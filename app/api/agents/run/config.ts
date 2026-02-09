/**
 * Configuration management for agent orchestrator
 */

import { ProviderConfig, ProviderName, AgentMode } from "./types";

export const CONFIG = {
    // Request validation
    MAX_TASK_LENGTH: 50000, // characters
    MIN_TASK_LENGTH: 1,

    // Timeouts
    DEFAULT_TIMEOUT_MS: 120000, // 2 minutes for large agent prompts

    // Provider configurations
    PROVIDERS: {
        GEMINI: {
            name: ProviderName.GEMINI,
            model: "gemini-2.5-flash", // Using 2.5 flash for better availability
            timeoutMs: 120000,
            maxTokens: 8192,
            temperature: 0.7,
        } as ProviderConfig,
        // Placeholders for future providers
        OPENAI: {
            name: ProviderName.OPENAI,
            model: "gpt-4o", // Dec 2024: Main multimodal model
            timeoutMs: 120000,
            maxTokens: 4096,
            temperature: 0.7,
        } as ProviderConfig,
        ANTHROPIC: {
            name: ProviderName.ANTHROPIC,
            model: "claude-3-5-sonnet-20241022", // Dec 2024: Latest version
            timeoutMs: 120000,
            maxTokens: 4096,
            temperature: 0.7,
        } as ProviderConfig,
    },
};

/**
 * Validate that required environment variables are set
 */
export function validateEnvironment(): {
    hasGemini: boolean;
    hasOpenAI: boolean;
    hasAnthropic: boolean;
    hasPerplexity: boolean;
} {
    return {
        hasGemini: !!process.env.GEMINI_API_KEY,
        hasOpenAI: !!process.env.OPENAI_API_KEY,
        hasAnthropic: !!process.env.ANTHROPIC_API_KEY,
        hasPerplexity: !!process.env.PERPLEXITY_API_KEY,
    };
}

/**
 * Get API key for a provider
 */
export function getApiKey(provider: ProviderName): string | undefined {
    switch (provider) {
        case ProviderName.GEMINI:
            return process.env.GEMINI_API_KEY;
        case ProviderName.OPENAI:
            return process.env.OPENAI_API_KEY;
        case ProviderName.ANTHROPIC:
            return process.env.ANTHROPIC_API_KEY;
        case ProviderName.PERPLEXITY:
            return process.env.PERPLEXITY_API_KEY;
        default:
            return undefined;
    }
}

/**
 * Mode-based provider routing
 * Determines which providers to try first based on requested mode
 */
export const MODE_ROUTING: Record<AgentMode, ProviderName[]> = {
    // Fast: Prioritize speed and cost
    fast: [ProviderName.GEMINI, ProviderName.OPENAI, ProviderName.ANTHROPIC],

    // Balanced: Best cost/performance (default)
    balanced: [ProviderName.OPENAI, ProviderName.GEMINI, ProviderName.ANTHROPIC],

    // Quality: Prioritize output quality
    quality: [ProviderName.ANTHROPIC, ProviderName.OPENAI, ProviderName.GEMINI],
};

/**
 * Get provider priority based on mode
 */
export function getProviderPriority(mode: AgentMode = "balanced"): ProviderName[] {
    return MODE_ROUTING[mode] || MODE_ROUTING.balanced;
}
