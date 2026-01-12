# UptimizeAI Examples

This directory contains examples and integration guides for the UptimizeAI agent system.

## Agent Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│  UPTIMIZE ENGINE: 3-AGENT SALES INTELLIGENCE SYSTEM             │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│  AGENT 1             │  Market Intelligence & Targeting
│  Market Intel        │  • Analyzes leads from communities/sources
│                      │  • Segments by pain, readiness, authority
│  INPUT: Raw leads    │  • Ranks by confidence + urgency
│  OUTPUT: Target Pack │  • Provides hooks, CTAs, trigger events
└──────────┬───────────┘
           │
           │ Target Pack
           ▼
┌──────────────────────┐
│  AGENT 2             │  Outbound & Appointment Setter
│  Outbound & Booking  │  • 3-track outreach (problem/proof/curiosity)
│                      │  • 7-12 touch follow-up sequences
│  INPUT: Target Pack  │  • Lead qualification (6-item checklist)
│  OUTPUT: Bookings    │  • No-show reduction protocol
│         + Qualified  │  • Objection handling (12 scenarios)
│           Lead Brief │  • Pipeline management + tagging
└──────────┬───────────┘
           │
           │ Qualified Lead Summaries
           ▼
┌──────────────────────┐
│  AGENT 3             │  Sales Closer & Delivery (Coming Soon)
│  Sales & Close       │  • Discovery calls with qualified context
│                      │  • Pricing & proposal generation
│  INPUT: Qualified    │  • Objection handling for close
│         Lead Brief   │  • Scope definition + handoff to delivery
│  OUTPUT: Closed Deal │  • Implementation planning
└──────────────────────┘
```

---

## Quick Start

### 1. Run Agent 1 → Agent 2 Integration

```bash
# TypeScript (direct execution)
npx ts-node examples/agent-1-to-agent-2-integration.ts balanced

# Arguments: <mode>
# Modes: fast | balanced | quality
```

### 2. Test Agent 2 Standalone

```bash
npx ts-node app/api/agents/run/uptimize/agent-2-outbound-appointment/test-agent-2.ts
```

### 3. API Usage

```bash
# Step 1: Run Agent 1 (Market Intelligence)
curl -X POST http://localhost:3000/api/agents/run \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Analyze these 5 leads and create a target pack: [lead data...]",
    "agent": "uptimize_agent_1",
    "context": {
      "segment_focus": "Course creators with scaling pain",
      "pain_categories": ["PAIN_FOLLOWUP", "PAIN_VISIBILITY"],
      "target_count": 5
    },
    "mode": "balanced"
  }'

# Step 2: Run Agent 2 (Outbound & Appointment)
# Use Agent 1's output.data.result as targetPack
curl -X POST http://localhost:3000/api/agents/run \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Generate outbound campaign for target pack",
    "agent": "uptimize_agent_2",
    "context": {
      "targetPack": { ... },
      "calendarAvailability": ["Jan 15-17, 10 AM - 4 PM AST"],
      "offerPositioning": "AI ops layer that reduces manual work",
      "channels": ["Email", "LinkedIn"],
      "volumeTargets": {
        "newOutreach": 5,
        "followups": 25,
        "goalBookedCalls": 3
      }
    },
    "mode": "balanced"
  }'
```

---

## Files in This Directory

### `agent-1-to-agent-2-integration.ts`
Complete workflow demonstrating:
- Agent 1: Analyze 5 leads → Target Pack
- Agent 2: Target Pack → Outbound campaign with bookings
- Full context passing between agents
- Sample output display

**Run it:**
```bash
npx ts-node examples/agent-1-to-agent-2-integration.ts
```

**Expected Output:**
- ✅ Target Pack with 5 segmented leads
- ✅ Message library with 3 tracks per lead
- ✅ 2-3 booked calls with qualified summaries
- ✅ Follow-up sequences (7-12 touches each)
- ✅ Nurture queue for non-ready leads

---

## Agent Identifiers

### Agent 1: Market Intelligence & Targeting
- **Primary ID**: `uptimize_agent_1`
- **Alias**: `market_intelligence`

### Agent 2: Outbound & Appointment Setter
- **Primary ID**: `uptimize_agent_2`
- **Alias**: `outbound_appointment`

---

## Context Objects

### Agent 1 Context (`Agent1Context`)
```typescript
{
  segment_focus?: string;           // e.g., "Course creators with scaling pain"
  pain_categories?: string[];       // e.g., ["PAIN_FOLLOWUP", "PAIN_VISIBILITY"]
  min_confidence?: number;          // 0.0 - 1.0, default 0.6
  target_count?: number;            // Max leads in target pack
  channels?: string[];              // e.g., ["Email", "LinkedIn"]
  geography?: string;               // e.g., "North America"
  notes?: string;                   // Additional context
}
```

### Agent 2 Context (`Agent2Context`)
```typescript
{
  targetPack?: any;                 // Agent 1 output (required for best results)
  calendarAvailability?: string[];  // e.g., ["Jan 15-17, 10 AM - 4 PM AST"]
  offerPositioning?: string;        // Value prop statement
  proofPoints?: string[];           // Social proof, case studies
  timezone?: string;                // Default: "America/Puerto_Rico"
  channels?: string[];              // e.g., ["Email", "LinkedIn", "DM"]
  volumeTargets?: {
    newOutreach?: number;           // # of first touches
    followups?: number;             // # of follow-up touches
    goalBookedCalls?: number;       // Booking target
  };
  notes?: string;                   // Additional instructions
}
```

---

## Output Structures

### Agent 1 Output (`TargetPackOutput`)
```typescript
{
  run_metadata: {
    run_date: string;
    source_description: string;
    total_leads_analyzed: number;
    leads_in_pack: number;
  };
  segments: Array<{
    segment_id: string;
    segment_name: string;
    description: string;
    priority: "high" | "medium" | "low";
    estimated_size: number;
  }>;
  leads: Array<{
    lead_id: string;
    name: string;
    company: string;
    role: string;
    segment_id: string;
    channel: string;
    pain_category: string;
    pain_signal: string;
    trigger_event: string;
    confidence_score: number;
    hook_angle: string;
    recommended_cta: string;
    priority_rank: number;
    notes: string;
  }>;
}
```

### Agent 2 Output (`OutboundAndBookingOutput`)
```typescript
{
  run_metadata: { ... };
  outbound_run_sheet: {
    daily_plan: Array<{ block_name, activity, count, channel }>;
    sequence_rules: string;
    qualification_rules: string;
    no_show_protocol: string;
  };
  message_library: Array<{
    lead_id: string;
    channel: string;
    track_messages: {
      problem_first: string;
      proof_first: string;
      curiosity_first: string;
    };
    followup_sequence: Array<{
      touch_number: number;
      day_offset: number;
      message: string;
      angle_type: "question" | "insight" | "micro_case" | "resource" | "breakup" | "reframe";
      cta: string;
    }>;
  }>;
  conversation_updates: Array<{ lead_id, old_stage, new_stage, note }>;
  bookings: Array<{
    lead_id: string;
    meeting_time_local: string;
    meeting_type: "discovery" | "audit" | "demo";
    qualified_lead_summary: {
      problem: string;
      impact: string;
      urgency: string;
      authority: string;
      stack: string;
      timeline: string;
      qualification_level: "hard_qualified" | "soft_qualified";
      recommended_offer_angle: string;
    };
    confirmation_flow: Array<{ timing, message }>;
  }>;
  nurture_queue: Array<{ lead_id, reason, next_touch_day_offset, nurture_message }>;
}
```

---

## Execution Modes

- **`fast`**: Uses fastest models (Gemini → OpenAI → Anthropic)
- **`balanced`**: Balanced quality/speed (OpenAI → Gemini → Anthropic) — **DEFAULT**
- **`quality`**: Highest quality (Anthropic → OpenAI → Gemini)

---

## Common Patterns

### Pattern 1: Weekly Target Pack → Outbound Campaign

```typescript
// Monday: Generate target pack from new community members
const agent1Result = await fetch('/api/agents/run', {
  method: 'POST',
  body: JSON.stringify({
    task: "Analyze this week's new members...",
    agent: "uptimize_agent_1",
    context: { target_count: 20 }
  })
});

// Tuesday: Launch outbound campaign
const agent2Result = await fetch('/api/agents/run', {
  method: 'POST',
  body: JSON.stringify({
    task: "Generate outbound campaign...",
    agent: "uptimize_agent_2",
    context: {
      targetPack: agent1Result.data.result,
      volumeTargets: { newOutreach: 20, followups: 60, goalBookedCalls: 5 }
    }
  })
});
```

### Pattern 2: High-Intent Lead → Immediate Outreach

```typescript
// Real-time: Single high-intent lead detected
const agent1Result = await fetch('/api/agents/run', {
  method: 'POST',
  body: JSON.stringify({
    task: "Analyze this high-intent lead: [data]",
    agent: "uptimize_agent_1",
    context: { target_count: 1, min_confidence: 0.8 }
  })
});

// Immediate: Generate personalized outreach
const agent2Result = await fetch('/api/agents/run', {
  method: 'POST',
  body: JSON.stringify({
    task: "Generate immediate outreach for this hot lead",
    agent: "uptimize_agent_2",
    context: {
      targetPack: agent1Result.data.result,
      volumeTargets: { newOutreach: 1, followups: 7, goalBookedCalls: 1 },
      notes: "High urgency, prioritize same-day booking"
    }
  })
});
```

### Pattern 3: Re-engage Nurture Queue

```typescript
// Monthly: Re-engage leads from nurture queue
const agent2Result = await fetch('/api/agents/run', {
  method: 'POST',
  body: JSON.stringify({
    task: "Re-engage leads from nurture queue with updated proof points",
    agent: "uptimize_agent_2",
    context: {
      targetPack: { leads: previousNurtureQueue },
      proofPoints: ["New case study: 80% reduction in follow-up time"],
      notes: "These leads showed interest 60 days ago, re-engage with new proof"
    }
  })
});
```

---

## Troubleshooting

### Agent 1 returns empty target pack
- Check `min_confidence` — may be too high (try 0.5 or lower)
- Verify lead data includes pain signals and context
- Ensure `target_count` is realistic

### Agent 2 doesn't book calls
- Verify `calendarAvailability` is provided
- Check if leads have sufficient qualification data (problem, impact, urgency)
- Review `qualification_level` in output (may be soft_qualified → nurture queue)

### Integration fails between agents
- Ensure Agent 1's `output.data.result` is passed as `targetPack` to Agent 2
- Check for provider errors in `metadata.provider`
- Review error types: `validation_error`, `parse_error`, `execution_error`

---

## Next Steps

1. ✅ Run `agent-1-to-agent-2-integration.ts` to see the full workflow
2. ✅ Review the README for each agent (`agent-1-market-intelligence/README.md`, `agent-2-outbound-appointment/README.md`)
3. ✅ Test with your own lead data
4. ⏳ Wait for Agent 3 (Sales Closer & Delivery) to complete the system

---

## Support

For issues or questions:
- Check agent-specific READMEs in `/app/api/agents/run/uptimize/`
- Review `orchestrator.ts` for routing logic
- See `types.ts` files for complete TypeScript interfaces
- Validate JSON output against `schema.json` files

**Timezone**: America/Puerto_Rico (Atlantic Standard Time)
