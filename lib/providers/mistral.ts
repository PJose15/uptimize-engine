/**
 * V2 Mistral Provider Client
 *
 * Uses OpenAI-compatible API with Mistral base URL.
 */

import OpenAI from 'openai';
import type { ProviderClient, LLMRequest, LLMResponse } from './types';
import { classifyProviderError } from './types';
import { estimateModelCost } from '@/lib/config/models';

const MISTRAL_MODELS = ['mistral-large-latest', 'mistral-small-latest'];

export const mistralClient: ProviderClient = {
  name: 'mistral',

  supportsModel(model: string): boolean {
    return MISTRAL_MODELS.includes(model);
  },

  async call(request: LLMRequest): Promise<LLMResponse> {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) throw classifyProviderError('mistral', new Error('MISTRAL_API_KEY not set'));

    const start = Date.now();
    const client = new OpenAI({
      apiKey,
      baseURL: 'https://api.mistral.ai/v1',
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
      ...(request.response_format?.type === 'json_object'
        ? { response_format: { type: 'json_object' } }
        : {}),
    });

    const text = completion.choices[0]?.message?.content ?? '';
    const inputTokens = completion.usage?.prompt_tokens ?? 0;
    const outputTokens = completion.usage?.completion_tokens ?? 0;

    return {
      content: text,
      model_used: request.model,
      provider: 'mistral',
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
