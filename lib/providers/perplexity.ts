/**
 * V2 Perplexity Provider Client
 *
 * Uses OpenAI-compatible API with Perplexity base URL.
 * Dedicated for research tasks with web search (sonar-pro).
 */

import OpenAI from 'openai';
import type { ProviderClient, LLMRequest, LLMResponse } from './types';
import { classifyProviderError } from './types';
import { estimateModelCost } from '@/lib/config/models';

const PERPLEXITY_MODELS = ['sonar-pro', 'sonar'];

export const perplexityClient: ProviderClient = {
  name: 'perplexity',

  supportsModel(model: string): boolean {
    return PERPLEXITY_MODELS.includes(model);
  },

  async call(request: LLMRequest): Promise<LLMResponse> {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) throw classifyProviderError('perplexity', new Error('PERPLEXITY_API_KEY not set'));

    const start = Date.now();
    const client = new OpenAI({
      apiKey,
      baseURL: 'https://api.perplexity.ai',
    });

    const messages: OpenAI.ChatCompletionMessageParam[] = [];
    if (request.system) {
      messages.push({ role: 'system', content: request.system });
    }
    for (const msg of request.messages) {
      messages.push({ role: msg.role, content: msg.content });
    }

    const completion = await client.chat.completions.create({
      model: request.model,
      messages,
      max_tokens: request.max_tokens,
      temperature: request.temperature ?? 0.7,
    });

    const text = completion.choices[0]?.message?.content ?? '';
    const inputTokens = completion.usage?.prompt_tokens ?? 0;
    const outputTokens = completion.usage?.completion_tokens ?? 0;

    return {
      content: text,
      model_used: request.model,
      provider: 'perplexity',
      usage: {
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: inputTokens + outputTokens,
      },
      cost_usd: this.estimateCost(inputTokens, outputTokens, request.model),
      latency_ms: Date.now() - start,
    };
  },

  estimateCost(inputTokens: number, outputTokens: number, model: string): number {
    return estimateModelCost(model, inputTokens, outputTokens);
  },
};
