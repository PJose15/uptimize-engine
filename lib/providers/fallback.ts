/**
 * V2 Fallback Execution
 *
 * Task-profile-based model selection with waterfall fallback.
 * This replaces mode-based routing with task-specific routing.
 */

import type { LLMRequest, LLMResponse, FallbackResult, ProviderClient } from './types';
import { ProviderError, classifyProviderError } from './types';
import {
  type TaskProfile,
  type V2ProviderName,
  getFallbackChain,
  getModelForTask,
  getProviderForModel,
} from '@/lib/config/models';
import { geminiClient } from './gemini';
import { openaiClient } from './openai';
import { anthropicClient } from './anthropic';
import { groqClient } from './groq';
import { mistralClient } from './mistral';
import { perplexityClient } from './perplexity';

// ============================================================================
// PROVIDER REGISTRY
// ============================================================================

const PROVIDER_CLIENTS: Record<V2ProviderName, ProviderClient> = {
  gemini: geminiClient,
  openai: openaiClient,
  anthropic: anthropicClient,
  groq: groqClient,
  mistral: mistralClient,
  perplexity: perplexityClient,
};

function getClientForModel(model: string): ProviderClient | null {
  const providerName = getProviderForModel(model);
  if (!providerName) return null;
  return PROVIDER_CLIENTS[providerName];
}

// ============================================================================
// EXECUTE WITH FALLBACK
// ============================================================================

export interface ExecuteOptions {
  maxRetries?: number;
  timeoutMs?: number;
  onProviderFailure?: (provider: string, error: Error) => void;
}

/**
 * Execute an LLM request using task-profile-based model selection
 * with waterfall fallback through the tier's fallback chain.
 */
export async function executeWithFallback(
  taskProfile: TaskProfile,
  request: Omit<LLMRequest, 'model'>,
  options: ExecuteOptions = {},
): Promise<FallbackResult> {
  const { maxRetries = 1, timeoutMs = 120_000, onProviderFailure } = options;

  const chain = getFallbackChain(taskProfile);
  const primaryModel = getModelForTask(taskProfile);
  const primaryProvider = getProviderForModel(primaryModel) ?? 'gemini';

  let attempts = 0;

  for (const model of chain) {
    const client = getClientForModel(model);
    if (!client) continue;

    // Retry loop per model
    for (let retry = 0; retry <= maxRetries; retry++) {
      attempts++;

      try {
        const fullRequest: LLMRequest = { ...request, model };

        // Wrap with timeout
        const response = await withTimeout(
          client.call(fullRequest),
          timeoutMs,
          client.name,
        );

        return {
          ...response,
          fallback_used: model !== primaryModel,
          primary_provider: primaryProvider,
          attempts,
        };
      } catch (err) {
        const providerErr = err instanceof ProviderError
          ? err
          : classifyProviderError(client.name, err);

        onProviderFailure?.(client.name, providerErr);

        // Don't retry auth errors
        if (providerErr.code === 'auth') break;

        // On last retry for this model, fall through to next model
        if (retry === maxRetries) break;

        // Brief backoff before retry
        await sleep(500 * (retry + 1));
      }
    }
  }

  // All models in the chain failed
  throw new ProviderError(
    primaryProvider,
    'unknown',
    `All models in ${taskProfile} fallback chain failed after ${attempts} attempts`,
  );
}

/**
 * Direct Perplexity call for research supplement (no fallback).
 */
export async function callPerplexity(
  request: Omit<LLMRequest, 'model'>,
): Promise<LLMResponse | null> {
  try {
    return await perplexityClient.call({ ...request, model: 'sonar-pro' });
  } catch {
    return null;
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  provider: V2ProviderName,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new ProviderError(provider, 'timeout', `${provider}: timeout after ${ms}ms`)),
      ms,
    );
    promise
      .then(val => { clearTimeout(timer); resolve(val); })
      .catch(err => { clearTimeout(timer); reject(err); });
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
