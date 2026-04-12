/**
 * V2 Provider Type System
 *
 * Standardized request/response types for all LLM providers.
 * Every provider client implements the ProviderClient interface.
 */

import type { V2ProviderName } from '@/lib/config/models';

// ============================================================================
// REQUEST / RESPONSE
// ============================================================================

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  model: string;
  messages: LLMMessage[];
  max_tokens: number;
  temperature?: number;
  system?: string;
  response_format?: { type: 'json_object' | 'text' };
}

export interface LLMResponse {
  content: string;
  model_used: string;
  provider: V2ProviderName;
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  cost_usd: number;
  latency_ms: number;
}

export interface FallbackResult extends LLMResponse {
  fallback_used: boolean;
  primary_provider: V2ProviderName;
  attempts: number;
}

// ============================================================================
// PROVIDER CLIENT INTERFACE
// ============================================================================

export interface ProviderClient {
  name: V2ProviderName;
  supportsModel: (model: string) => boolean;
  call: (request: LLMRequest) => Promise<LLMResponse>;
  estimateCost: (inputTokens: number, outputTokens: number, model: string) => number;
}

// ============================================================================
// PROVIDER ERROR
// ============================================================================

export class ProviderError extends Error {
  constructor(
    public provider: V2ProviderName,
    public code: 'auth' | 'rate_limit' | 'timeout' | 'network' | 'model' | 'unknown',
    message: string,
    public cause?: unknown,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export function classifyProviderError(provider: V2ProviderName, error: unknown): ProviderError {
  const msg = String(error).toLowerCase();

  if (msg.includes('api key') || msg.includes('unauthorized') || msg.includes('authentication')) {
    return new ProviderError(provider, 'auth', `${provider}: authentication failed`, error);
  }
  if (msg.includes('rate limit') || msg.includes('quota') || msg.includes('429')) {
    return new ProviderError(provider, 'rate_limit', `${provider}: rate limited`, error);
  }
  if (msg.includes('timeout') || msg.includes('aborted')) {
    return new ProviderError(provider, 'timeout', `${provider}: request timeout`, error);
  }
  if (msg.includes('network') || msg.includes('econnrefused') || msg.includes('fetch failed')) {
    return new ProviderError(provider, 'network', `${provider}: network error`, error);
  }
  if (msg.includes('model')) {
    return new ProviderError(provider, 'model', `${provider}: model error`, error);
  }

  return new ProviderError(provider, 'unknown', `${provider}: ${msg}`, error);
}
