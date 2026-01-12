import { executeWithFallback } from "../fallback";
import { AgentMode } from "../types";

interface DailyBriefContext {
    goal?: string;
    whatChangedYesterday?: string;
    currentNumbers?: {
        visits?: number;
        addToCart?: number;
        purchases?: number;
        emailSubscribers?: number;
        socialFollowers?: number;
    };
}

export async function runDailyBrief(
    ctx: DailyBriefContext = {},
    mode: AgentMode = "fast"  // Default to fast for daily check-ins
) {
    const goal = ctx.goal || "grow the business";
    const yesterday = ctx.whatChangedYesterday || "No updates provided";
    const numbers = ctx.currentNumbers || {};

    const prompt = `
You are the Zenthia Growth Operator doing a DAILY CHECK-IN.

Goal: ${goal}
Yesterday: ${yesterday}
Current metrics: ${JSON.stringify(numbers, null, 2)}

Your job: Give focused, actionable guidance for TODAY.

OUTPUT FORMAT (STRICT JSON ONLY):
{
  "today_focus": "One clear sentence: what to focus on today",
  "why_now": "Why this matters right now (1 sentence)",
  "top_3_actions": [
    "Specific action 1 (with time estimate)",
    "Specific action 2 (with time estimate)",
    "Specific action 3 (with time estimate)"
  ],
  "metrics_to_watch": [
    "Key metric 1 to track today",
    "Key metric 2 to track today",
    "Key metric 3 to track today"
  ],
  "yesterday_win": "One quick observation about what changed yesterday (or 'N/A')"
}

IMPORTANT:
- Be specific and actionable
- Focus on what can be done TODAY
- Keep it brief and punchy
- Use compliant language (supports, may help, promotes)

If you cannot parse the input, return an error in JSON format.
`;

    // Use fast mode by default for quick daily check-ins
    const result = await executeWithFallback(prompt, mode);

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
        // If JSON parsing fails, return an error with details
        const errorMessage = jsonError instanceof Error ? jsonError.message : String(jsonError);
        const preview = rawResponse.substring(0, 500);

        return {
            success: false,
            message: "Failed to parse daily brief response as JSON",
            error: {
                type: result.error?.type || "UNKNOWN_ERROR" as any,
                details: `JSON parse error: ${errorMessage}\n\nRaw response (first 500 chars):\n${preview}...`
            },
            attempts: result.attempts || []
        };
    }
}
