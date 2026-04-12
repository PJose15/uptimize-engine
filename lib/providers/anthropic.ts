/**
 * V2 Anthropic Provider Client
 */

import Anthropic from '@anthropic-ai/sdk';
import type { ProviderClient, LLMRequest, LLMResponse } from './types';
import { classifyProviderError } from './types';
import { estimateModelCost } from '@/lib/config/models';

const ANTHROPIC_MODELS = ['claude-opus-4-20250514', 'claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022'];

export const anthropicClient: ProviderClient = {
  name: 'anthropic',

  supportsModel(model: string): boolean {
    return ANTHROPIC_MODELS.includes(model);
  },

  async call(request: LLMRequest): Promise<LLMResponse> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw classifyProviderError('anthropic', new Error('ANTHROPIC_API_KEY not set'));

    const start = Date.now();
    const client = new Anthropic({ apiKey });

    // Extract system prompt
    const system = request.system
      || request.messages.find(m => m.role === 'system')?.content;
    const userMessages = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const message = await client.messages.create({
      model: request.model,
      max_tokens: request.max_tokens,
      messages: userMessages,
      ...(system ? { system } : {}),
      temperature: request.temperature ?? 0.7,
    });

    const text = message.content[0]?.type === 'text' ? message.content[0].text : '';
    const inputTokens = message.usage?.input_tokens ?? 0;
    const outputTokens = message.usage?.output_tokens ?? 0;

    return {
      content: text,
      model_used: request.model,
      provider: 'anthropic',
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
