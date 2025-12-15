/**
 * Google Gemini provider implementation
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { Provider, ProviderResponse, normalizeResponse, createErrorResponse } from "./base";
import { ProviderName, ErrorType } from "../types";
import { CONFIG, getApiKey } from "../config";
import { logger } from "../logger";

export class GeminiProvider implements Provider {
    name = ProviderName.GEMINI;

    isAvailable(): boolean {
        return !!getApiKey(ProviderName.GEMINI);
    }

    async execute(task: string, timeoutMs: number, signal?: AbortSignal): Promise<ProviderResponse> {
        const apiKey = getApiKey(ProviderName.GEMINI);
        if (!apiKey) {
            return createErrorResponse(
                ProviderName.GEMINI,
                ErrorType.AUTH_ERROR,
                "API key not configured"
            );
        }

        const startTime = Date.now();
        const config = CONFIG.PROVIDERS.GEMINI;

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            logger.info("Executing Gemini request", { provider: ProviderName.GEMINI });

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: config.model });

            // Note: Google SDK doesn't support AbortSignal yet, so we still use timeout
            const result = await model.generateContent(task);
            clearTimeout(timeoutId);

            const response = await result.response;
            const text = response.text();

            logger.info("Gemini request successful", {
                provider: ProviderName.GEMINI,
            });

            return normalizeResponse(
                ProviderName.GEMINI,
                config.model,
                text,
                startTime,
                response.usageMetadata?.totalTokenCount
            );
        } catch (error) {
            clearTimeout(timeoutId);

            // Check if aborted
            if (controller.signal.aborted) {
                logger.error("Gemini request aborted", {
                    provider: ProviderName.GEMINI,
                });
                return createErrorResponse(ProviderName.GEMINI, ErrorType.TIMEOUT_ERROR, "Request timeout");
            }

            const errorType = this.classifyError(error);
            const errorMessage = error instanceof Error ? error.message : String(error);

            logger.error("Gemini request failed", {
                provider: ProviderName.GEMINI,
            }, { errorType, errorMessage });

            return createErrorResponse(ProviderName.GEMINI, errorType, errorMessage);
        }
    }

    private classifyError(error: unknown): ErrorType {
        const errorString = String(error).toLowerCase();

        if (errorString.includes("api key") || errorString.includes("unauthorized")) {
            return ErrorType.AUTH_ERROR;
        }
        if (errorString.includes("rate limit") || errorString.includes("quota")) {
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
