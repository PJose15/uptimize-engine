import { executeWithFallback, FallbackResult } from "../fallback";
import { AgentMode } from "../types";
import { getBestHooks } from "../memory/google-sheets";

type ZenthiaContext = {
  brandName?: string;
  products?: Array<{ name: string; benefits?: string[]; price?: string }>;
  channels?: string[]; // e.g. ["TikTok","IG","Email","Shopify"]
  budget?: string;     // e.g. "$0", "$20/day"
  timePerDayMins?: number; // e.g. 60
  voice?: string;      // e.g. "warm, science-backed, spiritual"
  primaryGoal?: string; // e.g. "first 20 sales"
};

export async function runZenthiaGrowthOperator(
  task: string,
  ctx: ZenthiaContext = {},
  mode: AgentMode = "balanced"
): Promise<FallbackResult> {
  // Get best hooks from memory (defaults to mock if no DB)
  const bestHooks = await getBestHooks(3);
  const hooksContext = bestHooks.length > 0
    ? `\nMEMORY - USE THESE PROVEN ANGLES:\nHere are your top performing hooks recently:\n${bestHooks.map(h => `- "${h.text}" (${h.platform}: ${h.engagement_rate}% engagement)`).join('\n')}\nConsider reusing similar angles or structures.\n`
    : "";

  const prompt = `
You are the "Zenthia Growth Operator" (ZGO).
Your job: convert the user's task into a high-leverage growth execution pack for a DTC supplements brand.

IMPORTANT COMPLIANCE RULES (non-negotiable):
- Do NOT claim to diagnose, treat, cure, or prevent disease.
- Avoid medical promises (e.g., “cures anxiety”, “fixes heart disease”).
- Use compliant language: "supports", "may help", "promotes", "helps maintain".
- Add a short disclaimer when appropriate.

Brand context:
- Brand: ${ctx.brandName ?? "Zenthia"}
- Voice: ${ctx.voice ?? "warm, premium, science-backed + holistic/spiritual education"}
- Channels: ${(ctx.channels ?? ["TikTok", "IG", "Email", "Shopify"]).join(", ")}
- Budget: ${ctx.budget ?? "unknown"}
- Time per day: ${ctx.timePerDayMins ?? 60} minutes
- Products: ${JSON.stringify(ctx.products ?? [], null, 2)}
${hooksContext}

User task:
"${task}"

OUTPUT FORMAT (STRICT JSON ONLY):
{
  "today_brief": {
    "focus": "",
    "why_it_matters": "",
    "top_3_actions": ["", "", ""],
    "metrics_to_watch": ["", "", ""]
  },
  "offer_stack": {
    "primary_offer": "",
    "bundle_or_upsell": "",
    "risk_reversal": "",
    "cta": ""
  },
  "content_plan_7_days": [
    {
      "day": 1,
      "platform": "",
      "video_hook": "",
      "talking_points": ["", "", ""],
      "cta": ""
    }
  ],
  "email_pack": {
    "welcome_sequence_subjects": ["", "", ""],
    "abandon_cart_subjects": ["", ""],
    "post_purchase_subjects": ["", ""]
  },
  "site_cro_queue": [
    { "test": "", "hypothesis": "", "how_to_measure": "" }
  ],
  "compliance_note": ""
}

If you cannot comply, return a JSON error object with a helpful reason.
`;


  // Use your fallback system with mode-based provider priority
  const strictPrompt = prompt + "\n\nCRITICAL: Return ONLY valid JSON. No markdown code fences. No trailing commas. Check your JSON validity before outputting.";
  const result = await executeWithFallback(strictPrompt, mode);

  // If the request failed, return the error as-is
  if (!result.success) {
    return result;
  }

  // Extract and validate JSON from the response
  let rawResponse = result.message.trim();

  // Strip markdown code fences if present - try multiple patterns
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

  // Try to parse the JSON
  try {
    const parsed = JSON.parse(rawResponse);

    // Return the validated JSON as the message
    return {
      ...result,
      message: JSON.stringify(parsed, null, 2)
    };
  } catch (jsonError) {
    // If JSON parsing fails, return an error with more details
    const errorMessage = jsonError instanceof Error ? jsonError.message : String(jsonError);
    const preview = rawResponse.substring(0, 500);

    return {
      success: false,
      message: "Failed to parse LLM response as JSON",
      error: {
        type: result.error?.type || "UNKNOWN_ERROR" as any,
        details: `JSON parse error: ${errorMessage}\n\nRaw response (first 500 chars):\n${preview}...`
      },
      attempts: result.attempts || []
    };
  }
}

