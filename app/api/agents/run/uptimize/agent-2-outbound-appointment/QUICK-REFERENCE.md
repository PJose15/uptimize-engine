# Agent 2 Quick Reference Card

**Agent ID**: `uptimize_agent_2` or `outbound_appointment`
**Purpose**: Turn Target Packs into booked calls
**Timezone**: America/Puerto_Rico

---

## Minimal API Call

```bash
POST /api/agents/run
{
  "task": "Generate outbound campaign for these leads",
  "agent": "uptimize_agent_2",
  "context": {
    "channels": ["Email"],
    "volumeTargets": { "newOutreach": 5, "followups": 20, "goalBookedCalls": 2 }
  },
  "mode": "balanced"
}
```

---

## Full API Call (with Agent 1 output)

```bash
POST /api/agents/run
{
  "task": "Generate comprehensive outbound campaign with follow-up sequences",
  "agent": "uptimize_agent_2",
  "context": {
    "targetPack": { /* Agent 1 output.data.result */ },
    "calendarAvailability": ["Jan 15-17, 10 AM - 4 PM AST"],
    "offerPositioning": "AI ops layer that reduces manual work",
    "proofPoints": ["60% reduction in follow-up time"],
    "channels": ["Email", "LinkedIn"],
    "volumeTargets": {
      "newOutreach": 10,
      "followups": 40,
      "goalBookedCalls": 3
    },
    "timezone": "America/Puerto_Rico",
    "notes": "Focus on high-urgency leads"
  },
  "mode": "balanced"
}
```

---

## Output Structure

```typescript
{
  success: true,
  message: "Outbound campaign and bookings generated successfully",
  data: {
    run_metadata: { run_date, timezone, channels_used, volume_targets, notes },
    outbound_run_sheet: { daily_plan, sequence_rules, qualification_rules, no_show_protocol },
    message_library: [
      {
        lead_id: "LEAD_001",
        channel: "Email",
        track_messages: {
          problem_first: "...",
          proof_first: "...",
          curiosity_first: "..."
        },
        followup_sequence: [
          { touch_number: 1, day_offset: 0, message: "...", angle_type: "question", cta: "..." },
          // ... 6-11 more touches
        ]
      }
    ],
    conversation_updates: [
      { lead_id: "LEAD_001", old_stage: "NEW", new_stage: "CONTACTED", note: "..." }
    ],
    bookings: [
      {
        lead_id: "LEAD_001",
        meeting_time_local: "Jan 15, 10 AM AST",
        meeting_type: "discovery",
        qualified_lead_summary: {
          problem: "...",
          impact: "...",
          urgency: "...",
          authority: "...",
          stack: "...",
          timeline: "...",
          qualification_level: "hard_qualified",
          recommended_offer_angle: "..."
        },
        confirmation_flow: [
          { timing: "immediate", message: "..." },
          { timing: "24h_before", message: "..." }
        ]
      }
    ],
    nurture_queue: [
      { lead_id: "LEAD_002", reason: "...", next_touch_day_offset: 60, nurture_message: "..." }
    ]
  }
}
```

---

## 3 Message Tracks

**Problem-First**: Lead with pain
```
"Hey {Name} — noticed {trigger}. If {problem} is costing you follow-up speed,
we install an AI ops layer that handles {outcome}. Open to a quick chat?"
```

**Proof-First**: Lead with results
```
"{Name} — quick one. We've been building agent workflows that reduce manual
ops by 60%. If I mapped your {area} in 10 minutes, would that be useful?"
```

**Curiosity-First**: Lead with question
```
"Random question, {Name}: when {trigger} happens, do you see more issues with
{pain A} or {pain B}? Seeing that pattern a lot and fixing it with agent systems."
```

---

## Follow-Up Sequence (Default 7-12 Touch)

| Touch | Day | Angle | Example |
|-------|-----|-------|---------|
| 1 | 0 | Selected track | Initial message |
| 2 | 2 | Question | "What's your current response time goal?" |
| 3 | 4 | Insight | "Most operators see 3 main leaks..." |
| 4 | 7 | Micro-case | "Course creator reduced no-shows from 60% to 22%" |
| 5 | 10 | Resource | "Want a quick leak audit?" |
| 6 | 14 | Reframe | "15 min to show the gaps?" |
| 7 | 21 | Breakup | "Guessing timing's off—should I check back in Q2?" |

**Rule**: Every 2 touches, change angle type.

---

## 6-Item Qualification Checklist

1. **Problem**: What is breaking
2. **Impact**: What it costs (time/$/opportunities)
3. **Urgency**: Why now
4. **Authority**: Decision maker?
5. **Stack**: Current tools
6. **Timeline**: When they want it solved

**Hard Qualified**: 4+ items → Book immediately
**Soft Qualified**: 2-3 items → Async audit or nurture

---

## 12 Objections Handled

| Objection | Tag | Response Pattern |
|-----------|-----|------------------|
| Too expensive | `OBJ_PRICE` | Reframe value → Phase 1 offer |
| Not now / later | `OBJ_TIMING` | Get trigger date → Permission follow-up |
| Already have someone | `OBJ_ALREADY_HAVE` | Gap scan offer |
| Send info | `OBJ_SEND_INFO` | Get 1 detail first → Tailored summary |
| No time | `OBJ_NO_TIME` | Async audit offer |
| Tried AI before | `OBJ_BAD_PAST_EXP` | Differentiate: QA + adoption |
| Happy with process | `OBJ_STATUS_QUO` | Benchmark question |
| Not decision maker | `OBJ_NOT_DM` | Get intro → Forwardable blurb |

---

## No-Show Reduction Protocol

✅ **Immediate**: "Locked. Reply 'YES' to confirm. I'll send agenda."
✅ **24h Before**: "Quick reminder for tomorrow. Still good? Reply 'YES'."
✅ **2h Before**: "See you soon. If timing changed, say 'RESCHEDULE'."
✅ **No Confirm**: "Want to reschedule? Two options: {A} or {B}."

---

## Pipeline Stages

```
NEW → CONTACTED → REPLIED → QUALIFYING → QUALIFIED → BOOKED
                                                          ↓
                                                     NO-SHOW
                                                          ↓
                                           CLOSED-WON / CLOSED-LOST
```

**Nurture Queue**: Leads not ready now, future follow-up scheduled

---

## Tagging System

**Pain Tags**: `PAIN_FOLLOWUP`, `PAIN_VISIBILITY`, `PAIN_INBOX`, `PAIN_NOSHOW`, `PAIN_CRM`, `PAIN_COMMUNITY`

**Objection Tags**: `OBJ_PRICE`, `OBJ_TIMING`, `OBJ_ALREADY_HAVE`, `OBJ_SEND_INFO`, `OBJ_NO_TIME`, etc.

**Outcome Tags**: `OUT_BOOKED`, `OUT_NURTURE`, `OUT_LOST`, `OUT_NO_SHOW`, `OUT_GHOST`

---

## Channel Variants

**DM** (LinkedIn, IG, X):
- 1-2 sentences
- One question
- No attachments

**Email**:
- 3-6 lines max
- Simple subject: "quick question, {Name}"
- Give 2 time options in closing

---

## Execution Modes

- **fast**: Gemini (quick iterations)
- **balanced**: OpenAI (default, best value)
- **quality**: Anthropic (important campaigns)

---

## Common Patterns

### Pattern 1: Agent 1 → Agent 2
```typescript
const agent1 = await runAgent1(task, context);
const agent2 = await runAgent2(task, {
  targetPack: agent1.data.result,
  ...otherContext
});
```

### Pattern 2: Standalone Agent 2
```typescript
const agent2 = await runAgent2(
  "Generate outreach for this lead: [data]",
  { channels: ["Email"], volumeTargets: { ... } }
);
```

### Pattern 3: Re-engage Nurture Queue
```typescript
const agent2 = await runAgent2(
  "Re-engage leads from nurture queue",
  {
    targetPack: { leads: previousNurtureQueue },
    proofPoints: ["New case study..."],
    notes: "60-day re-engagement"
  }
);
```

---

## Key Files

- **agent.ts**: Main implementation
- **types.ts**: TypeScript definitions
- **schema.json**: Output validation
- **README.md**: Full documentation
- **test-agent-2.ts**: Test suite

---

## Support

- Review full README: `README.md`
- See integration example: `/examples/agent-1-to-agent-2-integration.ts`
- Test with: `npx ts-node test-agent-2.ts`
- API examples: `/examples/api-curl-examples.sh`

**Timezone**: America/Puerto_Rico (AST)
