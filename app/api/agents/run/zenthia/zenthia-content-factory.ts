import { executeWithFallback, FallbackResult } from '../fallback';
import { logger } from '../logger';
import { getBestHooks } from '../memory/google-sheets';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ContentFactoryHook {
    hook_text: string;
    angle: string;
    claim_style: string;
    cta: string;
}

export interface ContentFactoryScript {
    hook_id: number;
    script: string;
    broll: string;
    on_screen_text: string;
    caption: string;
}

export interface ContentFactorySchedule {
    day: number;
    post_idea: string;
    which_script_hook: number;
}

export interface ContentFactoryResult {
    meta: {
        product: string;
        platform: string;
        goal: string;
        mode: string;
    };
    hooks: ContentFactoryHook[];
    scripts: ContentFactoryScript[];
    schedule_7_days: ContentFactorySchedule[];
    compliance_note: string;
}

// ============================================================================
// Main Agent Function
// ============================================================================

export async function runZenthiaContentFactory(
    task: string,
    context: Record<string, any>,
    mode: 'fast' | 'balanced' | 'quality' = 'balanced'
): Promise<FallbackResult> {
    // Get best hooks from memory
    const bestHooks = await getBestHooks(5);
    const memoryContext = bestHooks.length > 0
        ? `\n\nPROVEN WINNERS - Learn from these:\n${bestHooks.map((h, i) => `${i + 1}. ${h.winner ? '🏆 ' : ''}${h.text} (${h.engagement_rate}% engagement)`).join('\n')}\n`
        : '';

    // Build complete prompt
    const product = context.product || context.business_type || 'the product';
    const platform = context.platform || 'TikTok';
    const goal = context.goal || 'viral engagement';
    const vibe = context.vibe || context.voice || 'conversational';

    const prompt = `You are Zenthia Content Factory - a batch content generator.

Generate READY-TO-POST content for:
- Product: ${product}
- Platform: ${platform}
- Goal: ${goal}
- Voice: ${vibe}
${memoryContext}

OUTPUT FORMAT (STRICT JSON ONLY):
{
  "meta": {"product": "${product}", "platform": "${platform}", "goal": "${goal}", "mode": "batch"},
  "hooks": [
    {"hook_text": "...", "angle": "...", "claim_style": "...", "cta": "..."}
    // ... 9 more (10 total)
  ],
  "scripts": [
    {"hook_id": 1, "script": "...", "broll": "...", "on_screen_text": "...", "caption": "..."}
    // ... 9 more (10 total)
  ],
  "schedule_7_days": [
    {"day": 1, "post_idea": "...", "which_script_hook": 1}
    // ... 6 more (7 total)
  ],
  "compliance_note": "..."
}

CRITICAL: Output ONLY valid JSON. No markdown. No explanations.`;

    // Execute with fallback
    const result = await executeWithFallback(prompt, mode);

    if (!result.success) {
        return result;
    }

    // Extract and parse JSON
    let rawResponse = result.message.trim();

    // Strip markdown code fences
    const patterns = [
        /```json\s*\n([\s\S]*?)\n```/,
        /```\s*\n([\s\S]*?)\n```/,
        /```json([\s\S]*?)```/,
        /```([\s\S]*?)```/
    ];

    for (const pattern of patterns) {
        const match = rawResponse.match(pattern);
        if (match) {
            rawResponse = match[1].trim();
            break;
        }
    }

    try {
        const parsed = JSON.parse(rawResponse);

        return {
            ...result,
            message: JSON.stringify(parsed, null, 2)
        };
    } catch (jsonError) {
        const errorMessage = jsonError instanceof Error ? jsonError.message : String(jsonError);
        return {
            success: false,
            message: 'Failed to parse LLM response as JSON',
            error: {
                type: result.error?.type || 'UNKNOWN_ERROR' as any,
                details: `JSON parse error: ${errorMessage}`
            },
            attempts: result.attempts || []
        };
    }
}
