/**
 * V2 OpenAI Provider Client
 */

import OpenAI from 'openai';
import type { ProviderClient, LLMRequest, LLMResponse } from './types';
import { classifyProviderError } from './types';
import { estimateModelCost } from '@/lib/config/models';

const OPENAI_MODELS = ['gpt-4o', 'gpt-4o-mini'];

export const openaiClient: ProviderClient = {
  name: 'openai',

  supportsModel(model: string): boolean {
    return OPENAI_MODELS.includes(model);
  },

  async call(request: LLMRequest): Promise<LLMResponse> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw classifyProviderError('openai', new Error('OPENAI_API_KEY not set'));

    const start = Date.now();
    const client = new OpenAI({ apiKey });

    // Build messages with system prompt
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
      max_completion_tokens: request.max_tokens,
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
      provider: 'openai',
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
