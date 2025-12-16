# Zenthia Growth Operator Enhancement Plan

## Vision
Transform ZGO from a one-off content generator into a **learning system** that gets smarter over time by tracking what works and building daily operating rhythms.

---

## Step 1: Lock Current Milestone ✅

**Status:** Ready to commit

**Action:**
```powershell
git status
git add .
git commit -m "ZGO: agent routing + JSON-safe output + local test client"
git push
```

> This "freezes" your working agent in GitHub.

---

## Step 2: Return Structured Data (Not Stringified JSON)

### Current State
```typescript
// ❌ Current: JSON is stringified in message
{
  success: true,
  message: "{\"today_brief\": {...}}", // String containing JSON
  data: { provider: "openai", ... }
}
```

### Target State
```typescript
// ✅ Better: Parsed object in data.result
{
  success: true,
  message: "Generated growth plan successfully",
  data: {
    provider: "openai",
    model: "gpt-4o-mini",
    timestamp: "...",
    latencyMs: 1234,
    tokensUsed: 500,
    result: {  // ← The parsed JSON plan
      today_brief: { focus: "...", ... },
      offer_stack: { ... },
      content_plan_7_days: [ ... ],
      email_pack: { ... },
      site_cro_queue: [ ... ],
      compliance_note: "..."
    }
  }
}
```

### Why?
- Frontend can access `data.result.today_brief.focus` directly
- No need to parse JSON twice
- TypeScript gets full type safety
- Makes building a dashboard 10x easier

### Implementation

#### Update `AgentResult` type in [types.ts](file:///c:/Users/pjaco/uptimize-engine/app/api/agents/run/types.ts)

```typescript
export interface AgentResult {
    success: boolean;
    message: string;
    data?: {
        provider: string;
        model: string;
        timestamp: string;
        latencyMs: number;
        tokensUsed?: number;
        result?: any;  // ← Add this for structured output
    };
    usage?: UsageInfo;
    error?: {
        type: ErrorType;
        details: string;
        timestamp: string;
    };
}
```

#### Update [orchestrator.ts](file:///c:/Users/pjaco/uptimize-engine/app/api/agents/run/orchestrator.ts)

```typescript
// When routing to ZGO, parse the JSON and put it in data.result
if (agent === "zenthia_growth_operator") {
    const zenthiaResult = await runZenthiaGrowthOperator(task, context || {});
    
    if (zenthiaResult.success) {
        // Parse the JSON message and put it in data.result
        let parsedResult;
        try {
            parsedResult = JSON.parse(zenthiaResult.message);
        } catch (e) {
            parsedResult = null;
        }

        return {
            success: true,
            message: "Growth plan generated successfully",
            data: {
                provider: zenthiaResult.metadata?.provider || "zenthia",
                model: zenthiaResult.metadata?.model || "unknown",
                timestamp: new Date().toISOString(),
                latencyMs: Date.now() - startTime,
                tokensUsed: zenthiaResult.metadata?.tokensUsed,
                result: parsedResult  // ← Parsed plan here
            },
        };
    }
    // ... error handling
}
```

---

## Step 3: Add "Zenthia Growth Operator Modes"

### Concept
Allow callers to choose behavior:
- **fast** → Quick drafts (Gemini/OpenAI mini first)
- **balanced** → Default (good output + cost control)  
- **quality** → Best output (Claude Sonnet first, higher tokens)

### Implementation

#### Update [zenthia-growth-operator.ts](file:///c:/Users/pjaco/uptimize-engine/app/api/agents/run/zenthia-growth-operator.ts)

```typescript
export async function runZenthiaGrowthOperator(
    task: string, 
    ctx: ZenthiaContext = {},
    mode: AgentMode = "balanced"  // ← Add mode parameter
) {
    // Pass mode to executeWithFallback
    const result = await executeWithFallback(prompt, mode);
    // ... rest of logic
}
```

#### Update [orchestrator.ts](file:///c:/Users/pjaco/uptimize-engine/app/api/agents/run/orchestrator.ts)

```typescript
if (agent === "zenthia_growth_operator") {
    const zenthiaResult = await runZenthiaGrowthOperator(task, context || {}, mode);
    // ...
}
```

### Usage
```javascript
// Fast draft
POST /api/agents/run
{
  "task": "...",
  "mode": "fast",
  "agent": "zenthia_growth_operator"
}

// High quality
{
  "mode": "quality"  // Will try Claude first
}
```

---

## Step 4: Build Daily Growth Brief

### Concept
A simplified endpoint for **daily check-ins** that takes minimal input and returns focused action items.

### Input
```typescript
{
  "agent": "zenthia_growth_operator",
  "task": "daily_brief",  // Special keyword
  "context": {
    "goal": "first 20 sales",
    "what_changed_yesterday": "Posted 3 TikToks, got 500 views",
    "current_numbers": {
      "visits": 120,
      "add_to_cart": 5,
      "purchases": 0
    }
  }
}
```

### Output
```json
{
  "data": {
    "result": {
      "today_focus": "Convert your viewers into email subscribers",
      "top_3_actions": [
        "Add exit-intent popup with 10% off",
        "Create 2 TikToks showcasing customer testimonials",
        "Send abandoned cart email to 5 people"
      ],
      "metrics_to_watch": [
        "Email capture rate",
        "Add-to-cart rate", 
        "Time on product page"
      ]
    }
  }
}
```

### Implementation

Create [zenthia-daily-brief.ts](file:///c:/Users/pjaco/uptimize-engine/app/api/agents/run/zenthia-daily-brief.ts):

```typescript
import { executeWithFallback } from "./fallback";
import { AgentMode } from "./types";

export async function runDailyBrief(
    goal: string,
    whatChangedYesterday: string,
    currentNumbers: Record<string, any>,
    mode: AgentMode = "balanced"
) {
    const prompt = `
You are the Zenthia Growth Operator doing a daily check-in.

Goal: ${goal}
Yesterday: ${whatChangedYesterday}
Current metrics: ${JSON.stringify(currentNumbers)}

Return STRICT JSON:
{
  "today_focus": "One sentence focus for today",
  "top_3_actions": ["action 1", "action 2", "action 3"],
  "metrics_to_watch": ["metric 1", "metric 2", "metric 3"]
}
`;

    const result = await executeWithFallback(prompt, mode);
    
    // Same JSON extraction logic as ZGO
    // ...
    
    return result;
}
```

Update orchestrator routing to check for `task === "daily_brief"`.

---

## Step 5: Memory Layer with Google Sheets

### Concept
Track what **actually works** over time:
- Best-performing hooks
- Best angles  
- Best offers
- Weekly results

Agent gets smarter by **reusing what worked**.

### Architecture

```
┌─────────────────┐
│  ZGO Agent      │
│  (generates)    │
└────────┬────────┘
         │
         v
┌─────────────────┐       ┌──────────────────┐
│  Memory Layer   │◄─────►│  Google Sheets   │
│  (reads/writes) │       │  - best_hooks    │
│                 │       │  - weekly_results│
└─────────────────┘       └──────────────────┘
```

### Google Sheets Setup

**Sheet 1: best_hooks**
| hook | platform | views | engagement_rate | date_added |
|------|----------|-------|----------------|------------|
| "Did you know 1 in 3..." | TikTok | 5000 | 8.5% | 2025-12-15 |

**Sheet 2: weekly_results**
| week_ending | visits | purchases | top_hook | notes |
|-------------|--------|-----------|----------|-------|
| 2025-12-15 | 1200 | 3 | Hook #7 | Email started working |

### Implementation

Create [memory/google-sheets.ts](file:///c:/Users/pjaco/uptimize-engine/app/api/agents/run/memory/google-sheets.ts):

```typescript
import { google } from 'googleapis';

export async function getBestHooks(limit: number = 5) {
    const sheets = google.sheets('v4');
    // Read from Google Sheets
    // Return top hooks by engagement
}

export async function saveHook(hook: string, platform: string, metrics: any) {
    // Write new hook to Google Sheets
}

export async function getWeeklyResults() {
    // Read last 4 weeks of results
}
```

Update ZGO prompt to include:

```typescript
const bestHooks = await getBestHooks(3);

const prompt = `
...existing prompt...

MEMORY (use this):
These hooks performed best recently:
${bestHooks.map(h => `- "${h.text}" (${h.engagement_rate}% engagement)`).join('\n')}

Consider reusing similar angles.
`;
```

---

## Implementation Order

1. ✅ **Git commit** (do now)
2. **Structured JSON** (2-3 hours)
   - Update types
   - Update orchestrator  
   - Update test script
   - Test end-to-end
3. **Mode routing** (30 min)
   - Add mode parameter to ZGO
   - Test all 3 modes
4. **Daily brief** (1-2 hours)
   - Create new endpoint
   - Simpler prompt
   - Test with mock data
5. **Memory layer** (4-6 hours)
   - Set up Google Sheets API
   - Create memory utilities
   - Integrate with ZGO
   - Test read/write

---

## Verification

After each step:

```powershell
node test-api-client.js
```

Expected outputs:
- Step 2: `data.result.today_brief` exists
- Step 3: Different providers based on mode
- Step 4: Simplified daily brief response
- Step 5: Agent references past best hooks
