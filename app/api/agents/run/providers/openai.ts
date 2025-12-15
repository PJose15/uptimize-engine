/**
 * OpenAI provider implementation
 */

import OpenAI from "openai";
import { Provider, ProviderResponse, normalizeResponse, createErrorResponse } from "./base";
import { ProviderName, ErrorType } from "../types";
import { CONFIG, getApiKey } from "../config";
import { logger } from "../logger";

export class OpenAIProvider implements Provider {
    name = ProviderName.OPENAI;

    isAvailable(): boolean {
        return !!getApiKey(ProviderName.OPENAI);
    }

    async execute(task: string, timeoutMs: number, signal?: AbortSignal): Promise<ProviderResponse> {
        const apiKey = getApiKey(ProviderName.OPENAI);
        if (!apiKey) {
            return createErrorResponse(
                ProviderName.OPENAI,
                ErrorType.AUTH_ERROR,
                "API key not configured"
            );
        }

        const startTime = Date.now();
        const config = CONFIG.PROVIDERS.OPENAI;

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            logger.info("Executing OpenAI request", { provider: ProviderName.OPENAI });

            const client = new OpenAI({ apiKey });

            // Make API call with timeout
            const completion = await client.chat.completions.create({
                model: config.model,
                messages: [{ role: "user", content: task }],
                max_tokens: config.maxTokens,
                temperature: config.temperature,
            }, {
                signal: controller.signal,  // OpenAI SDK supports AbortSignal
            });
            clearTimeout(timeoutId);

            const text = completion.choices[0]?.message?.content || "";

            logger.info("OpenAI request successful", {
                provider: ProviderName.OPENAI,
            });

            return normalizeResponse(
                ProviderName.OPENAI,
                config.model,
                text,
                startTime,
                completion.usage?.total_tokens
            );
        } catch (error) {
            clearTimeout(timeoutId);

            // Check if aborted
            if (controller.signal.aborted) {
                logger.error("OpenAI request aborted", {
                    provider: ProviderName.OPENAI,
                });
                return createErrorResponse(ProviderName.OPENAI, ErrorType.TIMEOUT_ERROR, "Request timeout");
            }

            const errorType = this.classifyError(error);
            const errorMessage = error instanceof Error ? error.message : String(error);

            logger.error("OpenAI request failed", {
                provider: ProviderName.OPENAI,
            }, { errorType, errorMessage });

            return createErrorResponse(ProviderName.OPENAI, errorType, errorMessage);
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
