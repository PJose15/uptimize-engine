import { executeWithFallback } from "./fallback";

type ZenthiaContext = {
  brandName?: string;
  products?: Array<{ name: string; benefits?: string[]; price?: string }>;
  channels?: string[]; // e.g. ["TikTok","IG","Email","Shopify"]
  budget?: string;     // e.g. "$0", "$20/day"
  timePerDayMins?: number; // e.g. 60
  voice?: string;      // e.g. "warm, science-backed, spiritual"
  primaryGoal?: string; // e.g. "first 20 sales"
};

export async function runZenthiaGrowthOperator(task: string, ctx: ZenthiaContext = {}) {
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


  // Use your fallback system (Gemini → OpenAI → Anthropic) to get a response
  const result = await executeWithFallback(prompt);

  // If the request failed, return the error as-is
  if (!result.success) {
    return result;
  }

  // Extract and validate JSON from the response
  let rawResponse = result.message;

  // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
  const codeBlockMatch = rawResponse.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    rawResponse = codeBlockMatch[1].trim();
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
    // If JSON parsing fails, return an error
    return {
      success: false,
      message: "Failed to parse LLM response as JSON",
      error: {
        type: result.error?.type || "UNKNOWN_ERROR" as any,
        details: `JSON parse error: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}. Raw response: ${rawResponse.substring(0, 200)}...`
      },
      attempts: result.attempts || []
    };
  }
}

