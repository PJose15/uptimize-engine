# Agent Stack v2 Upgrade Status

**Shadow Ops Elimination Edition**

## Overview

This document tracks the v2 upgrade of all 5 agents to implement the "Shadow Ops" differentiator across the entire agent stack.

##Core v2 Differentiator

All agents now focus on:
- **Shadow Ops** (off-system work: WhatsApp, DMs, spreadsheets, memory)
- **Exception Handling** (edge cases that break workflows)
- **Audit Trails** (proving what happened for compliance/documentation)

This is the defensible differentiator that generic AI agencies cannot show.

---

## Upgrade Status

### ✅ Agent 5 - Client Success (COMPLETE)
**Location:** `agent-5-client-success/`

**v2 Changes:**
- System prompt updated with Shadow Ops focus
- Schema includes:
  - `shadow_ops_reduction_report` (before/after tracking)
  - `exception_metrics` (count, top exceptions, resolution time)
  - `auditability_metrics` (audit trail completeness)
- Types fully updated
- Templates library (10 ready-to-use templates)
- Test suite with Week 1 and Week 4 scenarios
- Complete README

**Files:**
- ✅ schema.json (v2)
- ✅ agent.ts (v2 system prompt)
- ✅ types.ts (v2)
- ✅ templates.md (complete)
- ✅ test-agent-5.ts (complete)
- ✅ README.md (complete)

---

### ✅ Ops Spine - Shared Data Model (COMPLETE)
**Location:** `shared/schemas/ops-spine.json`

**What it is:**
Canonical schema for all 5 agents to read/write the same data structures.

**Entities:**
- Lead, Account, Opportunity, Project
- Workflow, Deliverable, KPI
- Ticket, ChangeRequest
- ProofAsset, AuditEvent

**Key Fields:**
- `shadow_ops_density_0_10` (Lead)
- `shadow_ops_profile` (Account)
- `exception_paths_top5` (Workflow)
- `exception_tag` (Ticket)
- `shadow_ops_reduction` (ProofAsset)
- `audit_trail` (Project, AuditEvent)

---

### 🔄 Agent 1 - Market Intelligence (PARTIAL)
**Location:** `agent-1-market-intelligence/`

**v2 Changes Completed:**
- ✅ schema.json updated with:
  - `shadow_ops_insights` (top signals found)
  - `shadow_ops_density_0_10` per lead
  - `shadow_ops_rationale` per lead
  - `exception_hypotheses_top3` per lead
  - `pattern_interrupt_question` per lead
- ✅ agent.ts system prompt updated to v2
- ✅ types.ts updated with v2 interfaces

**Remaining Work:**
- Update agent.ts buildPrompt() to reflect new schema fields
- Update README to explain Shadow Ops Density scoring
- Add examples to demonstrate v2 output

**v2 Key Features:**
- Shadow Ops Density scoring (0-10) prioritizes leads with heavy off-system work
- Exception hypotheses predict likely edge cases
- Pattern-interrupt questions for outreach

---

### 🔄 Agent 2 - Outbound & Appointment (PARTIAL)
**Location:** `agent-2-outbound-appointment/`

**v2 Changes Completed:**
- ✅ schema.json updated with:
  - `pattern_interrupt` in track_messages (default outreach track)
  - `shadow_ops_off_system_examples` in qualified_lead_summary
  - `top_exceptions_mentioned` in qualified_lead_summary
  - `objections_expected_tags` in qualified_lead_summary
  - `tags` in conversation_updates
  - `shadow_ops_guess` and `likely_exceptions_guess` in nurture_queue

**Remaining Work:**
- Update agent.ts with v2 system prompt (Pattern-Interrupt Questions first)
- Update types.ts with v2 interfaces
- Update README with Pattern-Interrupt Question library
- Add v2 examples

**v2 Key Features:**
- Pattern-Interrupt Questions as default outreach track
- Shadow Ops qualification during discovery
- Exception tracking in lead qualification

---

### ⏳ Agent 3 - Sales Engineer (PENDING)
**Location:** `agent-3-sales-offer/`

**v2 Changes Needed:**
- Update schema.json with:
  - `shadow_ops_map` (top 10 invisible tasks)
  - `exception_library` (top 5 exceptions + handling)
  - `exception_paths_committed` in proposal_sow
  - `audit_trail_commitment` in proposal_sow
  - Update handoff_to_agent4_spec with exception fields
- Update agent.ts with v2 system prompt (Exception-First Discovery)
- Update types.ts with Shadow Ops Map and Exception Library interfaces
- Update README with discovery question library

**v2 Key Features:**
- Shadow Ops Audit (mandatory discovery section)
- Exception Library (top 5 exceptions documented)
- Exception handling becomes a deliverable in SOW

---

### ⏳ Agent 4 - Systems Builder (PENDING)
**Location:** `agent-4-systems-delivery/`

**v2 Changes Needed:**
- Update schema.json with:
  - `exception_paths` in workflow_specs (make them required)
  - `audit_events_emitted` in workflow_specs
  - `fallback_modes` in delivery package
  - `audit_trail_spec` (new top-level section)
- Update agent.ts with v2 system prompt (Exception Paths as Deliverables)
- Update types.ts with Exception Path and Audit Trail types
- Update README with exception handling standards

**v2 Key Features:**
- Exception paths are first-class deliverables (not nice-to-have)
- Every workflow must have documented fallback modes
- Audit trail spec defines what gets logged and why

---

## v2 Schema Summary by Agent

### Agent 1 → Agent 2 Handoff
**New Fields:**
- `shadow_ops_density_0_10`: Scores how much off-system work exists
- `exception_hypotheses_top3`: Predicted edge cases
- `pattern_interrupt_question`: Opener for outreach

### Agent 2 → Agent 3 Handoff
**New Fields:**
- `shadow_ops_off_system_examples`: Actual off-system work mentioned
- `top_exceptions_mentioned`: Edge cases they face
- `objections_expected_tags`: Objection categories for close plan

### Agent 3 → Agent 4 Handoff
**New Fields:**
- `top_exceptions_to_handle`: Must-handle edge cases
- `audit_trail_fields_required`: What must be logged

### Agent 4 → Agent 5 Handoff
**New Fields:**
- `shadow_ops_baseline`: Before-state of invisible work
- `exception_library`: Documented exception paths
- `exception_sop`: Standard operating procedure for exceptions

### Agent 5 Tracking
**New Fields:**
- `shadow_ops_reduction_report`: Before/after comparison
- `exception_metrics`: Count, top exceptions, resolution time
- `auditability_metrics`: Audit trail completeness %

---

## Next Steps to Complete v2

### Priority 1: Finish Agent 3 and 4 Schema Updates
1. Agent 3 schema (shadow_ops_map, exception_library)
2. Agent 4 schema (exception_paths, audit_trail_spec)

### Priority 2: Update System Prompts
1. Agent 2 system prompt (Pattern-Interrupt Questions)
2. Agent 3 system prompt (Exception-First Discovery)
3. Agent 4 system prompt (Exception Paths as Deliverables)

### Priority 3: Update Types
1. Agent 2 types.ts
2. Agent 3 types.ts
3. Agent 4 types.ts

### Priority 4: Documentation
1. Agent 1 README (explain Shadow Ops Density)
2. Agent 2 README (Pattern-Interrupt library)
3. Agent 3 README (Exception-First Discovery questions)
4. Agent 4 README (Exception Path standards)

### Priority 5: Examples & Tests
1. Agent 1-4 test files with v2 examples
2. End-to-end test showing handoffs across all 5 agents

---

## How to Use v2 Agents

### Agent 1 (v2) - Targeting
```typescript
const result = await runAgent1MarketIntelligence(
  "Generate daily target pack for private groups segment"
);

// v2 output includes:
result.data.target_pack_primary.forEach(lead => {
  console.log(`Shadow Ops Density: ${lead.shadow_ops_density_0_10}/10`);
  console.log(`Exceptions: ${lead.exception_hypotheses_top3.join(', ')}`);
  console.log(`Pattern-Interrupt Q: ${lead.pattern_interrupt_question}`);
});

result.data.shadow_ops_insights.top_signals_found;
// ["We track it in spreadsheets", "Manual WhatsApp coordination", ...]
```

### Agent 2 (v2) - Outbound
```typescript
const result = await runAgent2Outbound(targetPack);

// v2 qualification includes:
result.data.bookings.forEach(booking => {
  const qual = booking.qualified_lead_summary;
  console.log(`Shadow Ops: ${qual.shadow_ops_off_system_examples}`);
  console.log(`Exceptions: ${qual.top_exceptions_mentioned}`);
  console.log(`Expected Objections: ${qual.objections_expected_tags}`);
});
```

### Agent 5 (v2) - Client Success
```typescript
const result = await agent5.run(input);

// Shadow Ops reduction tracking
console.log('Before:', result.shadow_ops_reduction_report.before_list);
console.log('After:', result.shadow_ops_reduction_report.after_list);
console.log('Delta:', result.shadow_ops_reduction_report.delta_summary);

// Exception metrics
console.log('Exceptions this week:', result.adoption_dashboard.exception_metrics.exceptions_count_week);
console.log('Avg resolution:', result.adoption_dashboard.exception_metrics.avg_time_to_resolution);

// Audit trail
console.log('Audit completeness:', result.adoption_dashboard.auditability_metrics.audit_trail_completeness);
```

---

## v2 Benefits

### For Sales (Agent 1-3)
- **Better targeting**: Shadow Ops Density finds prospects others miss
- **Better outreach**: Pattern-Interrupt Questions get replies
- **Better discovery**: Exception-First uncovers real operational pain
- **Better proposals**: Shadow Ops Map + Exception Library show depth

### For Delivery (Agent 4)
- **Better systems**: Exception paths prevent production failures
- **Better documentation**: Audit trails prove compliance
- **Better handoffs**: Client can self-serve with clear SOPs

### For Client Success (Agent 5)
- **Better proof**: Shadow Ops elimination is measurable
- **Better retention**: Exception reduction shows ongoing value
- **Better expansion**: Audit trail completeness enables Phase 2/3

### Overall
**This is the differentiator.** Generic AI agencies automate the obvious. We weaponize the invisible.

---

## Testing v2

### Unit Tests
Each agent should have test file covering v2 schema:
```bash
npx tsx test-agent-1.ts  # v2 schema validation
npx tsx test-agent-2.ts  # v2 schema validation
npx tsx test-agent-5.ts  # COMPLETE
```

### Integration Test (End-to-End)
```bash
npx tsx test-full-pipeline-v2.ts  # Agent 1 → 2 → 3 → 4 → 5 handoffs
```

---

## Version History

- **v1.0**: Basic agent stack (functional)
- **v2.0**: Shadow Ops Edition (current - partial)
  - ✅ Agent 5 complete
  - ✅ Ops Spine complete
  - 🔄 Agent 1 partial (schema + prompt done)
  - 🔄 Agent 2 partial (schema done)
  - ⏳ Agent 3 pending
  - ⏳ Agent 4 pending

---

## Questions?

See individual agent READMEs for detailed documentation.

For v2 implementation details, see:
- `agent-5-client-success/README.md` (complete reference)
- `shared/schemas/ops-spine.json` (canonical data model)
