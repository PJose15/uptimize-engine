/**
 * V2 Gemini Provider Client
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ProviderClient, LLMRequest, LLMResponse } from './types';
import { classifyProviderError } from './types';
import { estimateModelCost } from '@/lib/config/models';

const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-pro'];

export const geminiClient: ProviderClient = {
  name: 'gemini',

  supportsModel(model: string): boolean {
    return GEMINI_MODELS.includes(model);
  },

  async call(request: LLMRequest): Promise<LLMResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw classifyProviderError('gemini', new Error('GEMINI_API_KEY not set'));

    const start = Date.now();
    const genAI = new GoogleGenerativeAI(apiKey);

    // Build system instruction + messages
    const systemInstruction = request.system
      || request.messages.find(m => m.role === 'system')?.content;
    const userMessages = request.messages.filter(m => m.role !== 'system');
    const prompt = userMessages.map(m => m.content).join('\n\n');

    const model = genAI.getGenerativeModel({
      model: request.model,
      ...(systemInstruction ? { systemInstruction } : {}),
      generationConfig: {
        maxOutputTokens: request.max_tokens,
        temperature: request.temperature ?? 0.7,
        ...(request.response_format?.type === 'json_object'
          ? { responseMimeType: 'application/json' }
          : {}),
      },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const usage = response.usageMetadata;

    const inputTokens = usage?.promptTokenCount ?? 0;
    const outputTokens = usage?.candidatesTokenCount ?? 0;

    return {
      content: text,
      model_used: request.model,
      provider: 'gemini',
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
