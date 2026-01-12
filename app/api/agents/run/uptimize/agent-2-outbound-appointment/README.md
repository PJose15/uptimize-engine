# UptimizeAI Agent 2: Outbound & Appointment Setter

**Status**: Production Ready
**Version**: 1.0.0
**Type**: Outbound Sales & Booking Agent
**Timezone**: America/Puerto_Rico

---

## Mission

Turn Agent-1 Target Packs into high-quality conversations, qualified leads, and booked calls that actually show up.

**Primary Goal**: Book qualified calls consistently using short personalized outreach, structured follow-up sequences, and produce a Qualified Lead Brief for every booked call.

---

## What Agent 2 Does

### Core Functions

1. **Prepare Daily Outbound Run Sheet**
   - Volume planning (new outreach, follow-ups, booking goals)
   - Sequence rules and qualification criteria
   - No-show reduction protocols

2. **Generate Outreach Messages** (3 tracks per lead)
   - Problem-first: Lead with pain point
   - Proof-first: Lead with results/outcomes
   - Curiosity-first: Lead with pattern/question

3. **Execute Follow-up Sequences**
   - 7–12 touch sequences per lead
   - Channel-appropriate messaging (DM vs Email)
   - Angle rotation (question, insight, micro-case, resource, breakup)

4. **Qualify Leads Quickly**
   - Capture 6 key qualification items: Problem, Impact, Urgency, Authority, Stack, Timeline
   - Label as HARD QUALIFIED (4+ items) or SOFT QUALIFIED (2-3 items)

5. **Book Calls**
   - Schedule discovery, audit, or demo calls
   - Generate qualified lead summaries for handoff
   - Run confirmation workflow

6. **Reduce No-Shows**
   - Immediate confirmation with value teaser
   - 24h, 2h, and 15m reminders
   - Require "Reply YES to confirm"
   - Offer reschedule if no confirmation

7. **Update Pipeline**
   - Tag leads with pipeline stage (NEW → CONTACTED → REPLIED → QUALIFIED → BOOKED)
   - Apply pain tags, objection tags, outcome tags
   - Maintain clean CRM data

8. **Nurture Non-Ready Leads**
   - Queue leads for future follow-up
   - Provide next touch timing and message

---

## What Agent 2 Does NOT Do

- ❌ Close pricing or negotiate (Agent-3 handles this)
- ❌ Overpromise or guarantee specific results
- ❌ Fabricate facts about tool stacks or problems (labels assumptions)
- ❌ Send long essays (keeps messages short and operator-style)

---

## Inputs

### Required
- **Task**: Main instruction (e.g., "Generate outbound campaign for these 10 leads")

### Optional Context (`Agent2Context`)
- `targetPack`: Target Pack from Agent 1 (ranked leads with pain, trigger, hook/CTA)
- `calendarAvailability`: Array of available time slots
- `offerPositioning`: Offer positioning statement
- `proofPoints`: Array of proof points (case studies, results)
- `timezone`: Scheduling timezone (defaults to America/Puerto_Rico)
- `channels`: Channels to use (Email, LinkedIn, IG DM, X DM)
- `volumeTargets`: New outreach count, follow-up count, booking goals
- `notes`: Any additional context

---

## Outputs

### Structured JSON Output (`OutboundAndBookingOutput`)

#### 1. Run Metadata
```json
{
  "run_date": "2025-01-12",
  "timezone": "America/Puerto_Rico",
  "channels_used": ["Email", "LinkedIn"],
  "volume_targets": {
    "new_outreach": 20,
    "followups": 30,
    "goal_booked_calls": 5
  },
  "notes": "Prioritize high-intent leads from Target Pack"
}
```

#### 2. Outbound Run Sheet
```json
{
  "daily_plan": [
    {
      "block_name": "Morning Outreach",
      "activity": "new_outreach",
      "count": 10,
      "channel": "Email"
    }
  ],
  "sequence_rules": "7-12 touch sequence, rotate angle every 2 touches",
  "qualification_rules": "Capture 4+ items for hard qualification",
  "no_show_protocol": "Immediate + 24h + 2h reminders, require YES confirmation"
}
```

#### 3. Message Library (per lead)
```json
{
  "lead_id": "lead_001",
  "channel": "Email",
  "track_messages": {
    "problem_first": "Hey Sarah — noticed your team is scaling fast. If follow-up speed is costing you qualified leads, we install an AI ops layer that handles response automation. Open to a quick chat?",
    "proof_first": "Sarah — quick one. We've been building agent workflows that reduce manual ops by 60% and stop leads from slipping. If I mapped your follow-up process in 10 minutes, would that be useful?",
    "curiosity_first": "Random question, Sarah: when a lead comes in after hours, do you see more issues with response time or follow-up consistency? I'm asking because we're seeing that pattern a lot."
  },
  "followup_sequence": [
    {
      "touch_number": 1,
      "day_offset": 0,
      "message": "[Selected track message]",
      "angle_type": "question",
      "cta": "15-min call?"
    },
    {
      "touch_number": 2,
      "day_offset": 2,
      "message": "Quick follow-up: what's your current response time goal for new leads?",
      "angle_type": "question",
      "cta": "Reply with your target"
    }
  ]
}
```

#### 4. Conversation Updates
```json
{
  "lead_id": "lead_001",
  "old_stage": "NEW",
  "new_stage": "CONTACTED",
  "note": "Sent problem-first track via Email"
}
```

#### 5. Bookings
```json
{
  "lead_id": "lead_001",
  "meeting_time_local": "2025-01-15 10:00 AM AST",
  "meeting_type": "discovery",
  "qualified_lead_summary": {
    "problem": "Slow lead follow-up causing 30% missed opportunities",
    "impact": "$50K/month in lost revenue",
    "urgency": "Scaling from 50 to 200 leads/month next quarter",
    "authority": "VP Operations, decision-maker",
    "stack": "HubSpot CRM, Slack, Google Sheets",
    "timeline": "Need solution live in 60 days",
    "qualification_level": "hard_qualified",
    "recommended_offer_angle": "Phase 1: Lead response automation with Slack integration"
  },
  "confirmation_flow": [
    {
      "timing": "immediate",
      "message": "Locked. I'll send a quick agenda: 1) map your current flow, 2) identify the leak, 3) show agent system to fix it. Reply 'YES' to confirm."
    },
    {
      "timing": "24h_before",
      "message": "Quick reminder for tomorrow at 10 AM. Still good? Reply 'YES'."
    }
  ]
}
```

#### 6. Nurture Queue
```json
{
  "lead_id": "lead_002",
  "reason": "Budget constraints, revisit Q2",
  "next_touch_day_offset": 60,
  "nurture_message": "Hey John — checking back in. Is Q2 still the timeline for addressing the follow-up automation gap we discussed?"
}
```

---

## Qualification Framework

### 6-Item Qualification Checklist

1. **Problem**: What is breaking (e.g., "slow follow-up", "leads slipping")
2. **Impact**: What it costs (time, $, or missed opportunities)
3. **Urgency**: Why now (trigger event, growth, pain threshold)
4. **Authority**: Are they a decision-maker or influencer
5. **Stack**: What tools/workflow they currently use
6. **Timeline**: When they want this solved

### Qualification Levels

- **HARD QUALIFIED**: 4+ items captured → Book immediately
- **SOFT QUALIFIED**: 2-3 items captured → Async audit or nurture

---

## Pipeline Stages

- **NEW**: Lead added, not yet contacted
- **CONTACTED**: First outreach sent
- **REPLIED**: Lead responded
- **QUALIFYING**: Actively capturing qualification items
- **QUALIFIED**: Hard or soft qualified
- **BOOKED**: Call scheduled
- **NO-SHOW**: Lead missed scheduled call
- **CLOSED-WON**: Deal closed (Agent-3)
- **CLOSED-LOST**: Lost opportunity
- **NURTURE**: Not ready now, queue for future

---

## Follow-Up Engine

### Default 7–12 Touch Sequence

| Touch | Day Offset | Angle Type | Description |
|-------|-----------|-----------|-------------|
| 1 | 0 | Selected Track | Initial message (problem/proof/curiosity) |
| 2 | 2 | Question | Reframe with question |
| 3 | 4 | Insight | Micro-case or example outcome |
| 4 | 7 | Insight | 1-liner observation |
| 5 | 10 | Resource | Mini-audit or checklist offer |
| 6 | 14 | Reframe | Direct CTA (15 min?) |
| 7 | 21 | Breakup | Polite breakup message |
| 8-12 | 30-75 | Varies | Monthly nurture touches if warm |

**Rule**: Every 2 touches, change angle type.

---

## Message Track Templates

### Track 1: Problem-First
```
Hey {Name} — noticed {trigger/pain}. If {problem} is costing you follow-up speed / visibility, we install an AI ops layer that handles {one outcome}. Open to a quick chat?
```

### Track 2: Proof-First
```
{Name} — quick one. We've been building agent workflows that reduce manual ops and stop leads/tasks from slipping. If I mapped your {area} in 10 minutes and showed the "leak points," would that be useful?
```

### Track 3: Curiosity-First
```
Random question, {Name}: when {trigger} happens, do you see more issues with {pain A} or {pain B}? I'm asking because we're seeing that pattern a lot and fixing it with lightweight agent systems.
```

---

## Objection Handling

### Common Objections & Responses

#### "Too expensive / no budget" → `OBJ_PRICE`
**DM**: "Totally fair. Quick check—are you trying to solve this with time or money right now? If budget is tight, I can show a lighter setup that stops the biggest leak first. Want that?"

#### "Not now / later" → `OBJ_TIMING`
**DM**: "Got it. What's the trigger that will make this a priority—missed leads, team overload, or a launch date? If you tell me that, I'll ping you at the right moment."

#### "We already have someone" → `OBJ_ALREADY_HAVE`
**DM**: "Perfect—then you're ahead. Quick question: do they own follow-ups + reporting + exception handling end-to-end, or is it split? I can do a 10-min gap scan—want that?"

#### "Send info" → `OBJ_SEND_INFO`
**DM**: "For sure—what should I tailor it around: lead follow-up, ops visibility, or team handoffs? If you answer that, I'll send a 5-bullet summary + a quick example."

#### "No time / too busy" → `OBJ_NO_TIME`
**DM**: "I hear you. Can I do this async? You answer 3 questions by text, and I'll send back a quick 'leak map' + what we'd automate first. Want that?"

#### "We tried AI before, didn't work" → `OBJ_BAD_PAST_EXP`
**DM**: "That's common. Usually it fails because there's no guardrails + exception handling + adoption loop. We build it like an ops system, not a demo. Want me to ask 2 questions to see why it failed last time?"

#### "We're happy with current process" → `OBJ_STATUS_QUO`
**DM**: "Love it. Quick sanity check: what's your response time to new leads right now, and do you have a dashboard showing what slips? If yes, you're solid. If not, that's usually the hidden leak."

#### "I'm not the decision maker" → `OBJ_NOT_DM`
**DM**: "Got it—who owns this decision? If you can intro me, I'll keep it tight and send you a 3-bullet summary you can forward."

---

## No-Show Reduction Protocol

### Confirmation Flow

1. **Immediate**: Confirm + value teaser
   *"Locked. I'll send a quick agenda so it's worth your time: 1) map your current flow, 2) identify the leak, 3) show agent system to fix it. Reply 'YES' to confirm."*

2. **24h Before**: Reminder + confirmation request
   *"Quick reminder for tomorrow. Still good on your side? Reply 'YES' and I'll come prepared with a mini-audit."*

3. **2h Before**: Final check-in
   *"See you soon. If anything changes, tell me 'RESCHEDULE' and I'll send options."*

4. **No Confirmation**: Offer reschedule
   *"All good if timing's off — want to reschedule for later this week? Two options: {A} or {B}."*

---

## Tagging System

### Pain Tags
- `PAIN_FOLLOWUP`: Follow-up speed/consistency issues
- `PAIN_VISIBILITY`: Lack of reporting/dashboards
- `PAIN_INBOX`: Inbox overwhelm
- `PAIN_NOSHOW`: High no-show rates
- `PAIN_CRM`: CRM data quality issues
- `PAIN_COMMUNITY`: Community management challenges

### Objection Tags
- `OBJ_PRICE`, `OBJ_TIMING`, `OBJ_ALREADY_HAVE`, `OBJ_SEND_INFO`
- `OBJ_NO_TIME`, `OBJ_BAD_PAST_EXP`, `OBJ_STATUS_QUO`, `OBJ_NOT_DM`
- `OBJ_CHANNEL_PREF`, `OBJ_SECURITY`, `OBJ_PRICE_ASK`, `OBJ_THINK`

### Outcome Tags
- `OUT_BOOKED`: Call booked
- `OUT_NURTURE`: Moved to nurture queue
- `OUT_LOST`: Lost opportunity
- `OUT_NO_SHOW`: No-show on scheduled call
- `OUT_GHOST`: No response after sequence

---

## Channel Variants

### DM Style (LinkedIn, IG, X)
- 1–2 sentences max
- One question per message
- No attachments
- No long context

### Email Style
- 3–6 lines max
- Simple subject lines: "quick question, {Name}", "{Company} ops leak?", "follow-up on {topic}"
- Give 2 time options in closing (reduces friction)

---

## Escalation Rules

Agent 2 escalates to Agent 3 (or human) when:

1. Lead asks for pricing ranges and scope is unclear (needs discovery)
2. Lead wants a proposal without a call
3. Lead brings security/legal/procurement language
4. Lead wants custom integration commitments
5. Lead mentions urgent "we're bleeding money" high-intent signals

---

## KPIs & Performance Metrics

### Weekly Metrics
- **New Outreach Count**: # of first touches sent
- **Follow-up Count**: # of follow-up touches sent
- **Reply Rate %**: Replies / New Outreach Sent
- **Qualification Rate %**: Qualified / Replies
- **Book Rate %**: Booked / Replies
- **Show Rate %**: (Booked - No-Shows) / Booked

### Optimization Loop
Agent 2 produces weekly recommendations:
- Top converting segment
- Top converting angle
- Top objection encountered
- "Next week, double down on {segment} with {angle}"

---

## Integration with Other Agents

### Receives from Agent 1
- Target Pack (ranked leads with pain, trigger, hook/CTA)
- Segment prioritization
- Pain categories and confidence scores

### Sends to Agent 3
- Qualified Lead Brief (problem, impact, urgency, authority, stack, timeline)
- Recommended offer angle
- Conversation history
- Top objection expected

---

## Usage Example

```typescript
import { runAgent2OutboundAppointment } from "./agent-2-outbound-appointment";

const result = await runAgent2OutboundAppointment(
  "Generate outbound campaign for these 10 leads from Target Pack, focus on Email channel",
  {
    targetPack: agent1Output.data.target_pack,
    calendarAvailability: ["Jan 15-17, 10 AM - 4 PM AST", "Jan 18-19, 2 PM - 6 PM AST"],
    offerPositioning: "AI ops layer that reduces manual work and stops leads from slipping",
    proofPoints: [
      "Reduced follow-up time by 60% for SaaS client",
      "Increased show-rate from 45% to 78% for coaching business"
    ],
    timezone: "America/Puerto_Rico",
    channels: ["Email"],
    volumeTargets: {
      newOutreach: 10,
      followups: 15,
      goalBookedCalls: 3
    },
    notes: "Prioritize operators with 50-200 leads/month"
  },
  "balanced"
);

if (result.success) {
  console.log("Bookings:", result.data.bookings);
  console.log("Message Library:", result.data.message_library);
}
```

---

## Writing Style Guidelines

- **Short, direct, confident, respectful**
- **No hype, no fluff**
- **1–2 sentences per outbound message** (unless asked otherwise)
- **Always include a low-friction CTA** (question, 15 min?, 2 options)

---

## Version History

- **v1.0.0** (2025-01-12): Initial production release
  - Complete outbound & booking system
  - 12-touch follow-up engine
  - Objection handling kit
  - No-show reduction protocol
  - Qualification framework
  - Pipeline tagging system

---

## Support

For issues or questions:
- Review Agent 1 README for Target Pack structure
- Check orchestrator.ts for routing configuration
- See types.ts for complete TypeScript interfaces
- Validate output against schema.json

**Timezone**: America/Puerto_Rico (Atlantic Standard Time)
