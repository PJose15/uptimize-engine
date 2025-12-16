import { executeWithFallback } from './shared/provider-fallback';
import { logger } from './logger';
import { getBestHooks } from './memory/google-sheets';

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
    hook_id: number; // 1-10, references hooks array
    script: string;
    broll: string;
    on_screen_text: string;
    caption: string;
}

export interface ContentFactorySchedule {
    day: number; // 1-7
    post_idea: string;
    which_script_hook: number; // References hook_id
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
): Promise<any> {

    logger.info("Starting Zenthia Content Factory", { mode });

    // Step 1: Read memory - get best performing hooks
    const bestHooks = await getBestHooks(5);

    const memoryContext = bestHooks.length > 0
        ? `\n\n## PROVEN WINNERS (Learn from these!):\n${bestHooks
            .map((h, i) => `${i + 1}. ${h.winner ? '🏆 ' : ''}${h.text} (${h.engagement_rate}% engagement)`)
            .join('\n')}`
        : '';

    // Step 2: Build prompt
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(context, memoryContext);

    // Step 3: Execute with provider fallback
    const response = await executeWithFallback(
        systemPrompt,
        userPrompt,
        mode
    );

    // Step 4: Extract JSON from response
    const result = extractJSON(response.text);

    if (!result) {
        throw new Error('Failed to extract valid JSON from LLM response');
    }

    // Validate structure
    if (!result.hooks || !Array.isArray(result.hooks) || result.hooks.length !== 10) {
        logger.warn('Invalid hooks array in result');
    }

    logger.info("Zenthia Content Factory completed successfully", {
        hooks_count: result.hooks?.length || 0,
        scripts_count: result.scripts?.length || 0
    });

    return {
        success: true,
        data: {
            agent: 'zenthia_content_factory',
            mode: response.mode,
            provider: response.provider,
            model: response.model,
            result: result
        }
    };
}

// ============================================================================
// Prompt Building
// ============================================================================

function buildSystemPrompt(): string {
    return `You are Zenthia Content Factory - a batch content generation specialist.

Your job: Generate READY-TO-POST content at scale.

Rules:
1. Output ONLY valid JSON (no markdown, no explanations)
2. Generate exactly 10 hooks, 10 scripts, 7-day schedule
3. Make content compliance-safe (no disease claims, no guaranteed outcomes)
4. Learn from proven winners (if provided)
5. Be specific, actionable, and engaging

You are a content production machine. Make every hook, script, and caption READY to copy-paste and post immediately.`;
}

function buildUserPrompt(context: Record<string, any>, memoryContext: string): string {
    const product = context.product || context.business_type || 'the product';
    const platform = context.platform || 'TikTok/Instagram';
    const goal = context.goal || 'viral engagement';
    const vibe = context.vibe || context.voice || 'conversational';

    return `Generate batch content for:

**Product/Offer:** ${product}
**Platform:** ${platform}  
**Goal:** ${goal}
**Vibe/Voice:** ${vibe}
${memoryContext}

---

OUTPUT THIS EXACT JSON STRUCTURE:

{
  "meta": {
    "product": "${product}",
    "platform": "${platform}",
    "goal": "${goal}",
    "mode": "batch_generation"
  },
  "hooks": [
    {
      "hook_text": "First 3 seconds that stop the scroll",
      "angle": "curiosity/pain/transformation/etc",
      "claim_style": "soft/bold/question",
      "cta": "watch/comment/click/share"
    }
    // ... 9 more (10 total)
  ],
  "scripts": [
    {
      "hook_id": 1,
      "script": "15-30 second video script following the hook",
      "broll": "Visual suggestions for B-roll footage",
      "on_screen_text": "Text overlays to add",
      "caption": "Post caption with emojis and hashtags"
    }
    // ... 9 more (10 total)
  ],
  "schedule_7_days": [
    {
      "day": 1,
      "post_idea": "What to post on day 1",
      "which_script_hook": 1
    }
    // ... 6 more (7 total)
  ],
  "compliance_note": "Note about staying compliant (no disease claims, etc.)"
}

CRITICAL: Output ONLY the JSON. No markdown code blocks. No explanations. Just pure JSON.`;
}

// ============================================================================
// JSON Extraction
// ============================================================================

function extractJSON(text: string): ContentFactoryResult | null {
    try {
        // Try direct parse first
        const parsed = JSON.parse(text);
        return parsed as ContentFactoryResult;
    } catch {
        // Try to extract from markdown code blocks
        const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[1]) as ContentFactoryResult;
            } catch {
                logger.warn('Failed to parse JSON from code block');
            }
        }

        // Try to find JSON object in text
        const objectMatch = text.match(/\{[\s\S]*\}/);
        if (objectMatch) {
            try {
                return JSON.parse(objectMatch[0]) as ContentFactoryResult;
            } catch {
                logger.warn('Failed to parse JSON from object match');
            }
        }

        logger.error('Could not extract valid JSON from response');
        return null;
    }
}
