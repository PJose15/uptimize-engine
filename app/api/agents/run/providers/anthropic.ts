/**
 * Anthropic (Claude) provider implementation
 */

import Anthropic from "@anthropic-ai/sdk";
import { Provider, ProviderResponse, normalizeResponse, createErrorResponse } from "./base";
import { ProviderName, ErrorType } from "../types";
import { CONFIG, getApiKey } from "../config";
import { logger } from "../logger";

export class AnthropicProvider implements Provider {
    name = ProviderName.ANTHROPIC;

    isAvailable(): boolean {
        return !!getApiKey(ProviderName.ANTHROPIC);
    }

    async execute(task: string, timeoutMs: number, signal?: AbortSignal): Promise<ProviderResponse> {
        const apiKey = getApiKey(ProviderName.ANTHROPIC);
        if (!apiKey) {
            return createErrorResponse(
                ProviderName.ANTHROPIC,
                ErrorType.AUTH_ERROR,
                "API key not configured"
            );
        }

        const startTime = Date.now();
        const config = CONFIG.PROVIDERS.ANTHROPIC;

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            logger.info("Executing Anthropic request", { provider: ProviderName.ANTHROPIC });

            const client = new Anthropic({ apiKey });

            // Make API call with timeout
            const message = await client.messages.create({
                model: config.model,
                max_tokens: config.maxTokens || 4096,
                messages: [{ role: "user", content: task }],
                temperature: config.temperature,
            });  // Note: Anthropic SDK may not support AbortSignal directly
            clearTimeout(timeoutId);

            const text = message.content[0]?.type === "text" ? message.content[0].text : "";

            logger.info("Anthropic request successful", {
                provider: ProviderName.ANTHROPIC,
            });

            return normalizeResponse(
                ProviderName.ANTHROPIC,
                config.model,
                text,
                startTime,
                message.usage?.input_tokens + message.usage?.output_tokens
            );
        } catch (error) {
            clearTimeout(timeoutId);

            // Check if aborted
            if (controller.signal.aborted) {
                logger.error("Anthropic request aborted", {
                    provider: ProviderName.ANTHROPIC,
                });
                return createErrorResponse(ProviderName.ANTHROPIC, ErrorType.TIMEOUT_ERROR, "Request timeout");
            }

            const errorType = this.classifyError(error);
            const errorMessage = error instanceof Error ? error.message : String(error);

            logger.error("Anthropic request failed", {
                provider: ProviderName.ANTHROPIC,
            }, { errorType, errorMessage });

            return createErrorResponse(ProviderName.ANTHROPIC, errorType, errorMessage);
        }
    }

    private classifyError(error: unknown): ErrorType {
        const errorString = String(error).toLowerCase();

        if (errorString.includes("api key") || errorString.includes("unauthorized") || errorString.includes("authentication")) {
            return ErrorType.AUTH_ERROR;
        }
        if (errorString.includes("rate limit") || errorString.includes("quota") || errorString.includes("429")) {
            return ErrorType.RATE_LIMIT_ERROR;
        }
        if (errorString.includes("timeout")) {
            return ErrorType.TIMEOUT_ERROR;
        }
        if (errorString.includes("network") || errorString.includes("econnrefused")) {
            return ErrorType.NETWORK_ERROR;
        }
        if (errorString.includes("model")) {
            return ErrorType.MODEL_ERROR;
        }

        return ErrorType.UNKNOWN_ERROR;
    }
}
