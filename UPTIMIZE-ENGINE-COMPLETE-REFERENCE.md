# UPTIMIZE ENGINE — Complete System Reference

> **Generated**: 2026-03-20
> **Repository**: `github.com/PJose15/uptimize-engine`
> **Branch**: `main`
> **Stack**: Next.js 16 + React 19 + Prisma 5 (SQLite) + Tailwind CSS 4 + TypeScript 5
> **Purpose**: AI-powered 5-agent sales operations pipeline with governance, portal, and analytics

---

## TABLE OF CONTENTS

1. [What Is Uptimize Engine?](#1-what-is-uptimize-engine)
2. [Architecture Overview](#2-architecture-overview)
3. [The 6-Pillar Framework](#3-the-6-pillar-framework)
4. [The 5-Agent Pipeline](#4-the-5-agent-pipeline)
5. [Pipeline Orchestration (SSE)](#5-pipeline-orchestration-sse)
6. [Governance Layer](#6-governance-layer)
7. [Client Portal (7 Routes)](#7-client-portal-7-routes)
8. [Database Schema](#8-database-schema)
9. [Authentication & Security](#9-authentication--security)
10. [Admin Dashboard & Pages](#10-admin-dashboard--pages)
11. [Component Library](#11-component-library)
12. [Utility Libraries](#12-utility-libraries)
13. [LLM Provider System](#13-llm-provider-system)
14. [Testing Infrastructure](#14-testing-infrastructure)
15. [File Inventory](#15-file-inventory)
16. [Known Issues & Gaps](#16-known-issues--gaps)
17. [Improvement Roadmap](#17-improvement-roadmap)

---

## 1. WHAT IS UPTIMIZE ENGINE?

Uptimize Engine is a **full-stack AI sales operations platform** that automates the entire customer lifecycle — from market research to client retention — through a sequential 5-agent pipeline. Each agent is an AI-powered specialist that handles one phase of the journey.

### Who Is It For?

- **Service businesses** (logistics, consulting, agencies) that sell operational improvements
- **Solo operators / small teams** running outbound + delivery + client success
- **Operations-heavy companies** with off-system work, exception handling, and scattered processes

### What Does It Do?

```
LEADS IN → [5 AI Agents] → SIGNED DEALS + DELIVERED SYSTEMS + RETAINED CLIENTS
```

1. **Finds** ideal prospects using web research and pain-signal mapping
2. **Books** discovery calls through multi-channel outbound campaigns
3. **Closes** deals with structured discovery, proposals, and SOWs
4. **Builds** workflow automations, integrations, and handoff kits
5. **Retains** clients through KPI tracking, health scoring, and expansion mapping

### The Business Model It Serves

```
┌──────────────────────────────────────────────────────────────────┐
│                    UPTIMIZE BUSINESS FLOW                        │
│                                                                  │
│  Target → Outreach → Discovery → Proposal → Build → Retain     │
│                                                                  │
│  Agent 1   Agent 2    Agent 3     Agent 3   Agent 4   Agent 5   │
│  Research  Booking    Audit       SOW       Delivery  Success   │
│                                                                  │
│  Output:   Output:    Output:     Output:   Output:   Output:   │
│  Lead      Booked     Proposal    Signed    Working   Health    │
│  Pack      Calls      + SOW       Deal      System    Score     │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. ARCHITECTURE OVERVIEW

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS 16 APPLICATION                       │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  ADMIN UI    │  │  CLIENT      │  │  API ROUTES              │  │
│  │              │  │  PORTAL      │  │                          │  │
│  │  Dashboard   │  │  Overview    │  │  /api/pipeline/run (SSE) │  │
│  │  Pipeline    │  │  Activity    │  │  /api/agents/run         │  │
│  │  History     │  │  Approvals   │  │  /api/portal/* (7)       │  │
│  │  Results     │  │  Analytics   │  │  /api/auth               │  │
│  │  Templates   │  │  Permissions │  │  /api/history            │  │
│  │  Compare     │  │  Audit Log   │  │  /api/templates          │  │
│  │  Settings    │  │              │  │  /api/webhooks/trigger   │  │
│  └──────┬───────┘  └──────┬───────┘  │  /api/health             │  │
│         │                 │          └────────────┬─────────────┘  │
│         │                 │                       │                 │
│  ┌──────┴─────────────────┴───────────────────────┴──────────────┐ │
│  │                    BUSINESS LOGIC LAYER                        │ │
│  │                                                                │ │
│  │  ┌─────────────────────────────────────────────────────────┐  │ │
│  │  │              5-AGENT PIPELINE                            │  │ │
│  │  │  Agent 1 → Agent 2 → Agent 3 → Agent 4 → Agent 5       │  │ │
│  │  │  (Gemini)  (Claude)  (GPT-4o)  (Gemini)  (Claude)      │  │ │
│  │  └─────────────────────────────────────────────────────────┘  │ │
│  │                                                                │ │
│  │  ┌─────────────┐ ┌──────────────┐ ┌────────────────────────┐  │ │
│  │  │ GOVERNANCE  │ │ PORTAL       │ │ UTILITIES              │  │ │
│  │  │ Permissions │ │ Events       │ │ Retry, Timeout, Costs  │  │ │
│  │  │ Approvals   │ │ Activity Log │ │ Validation, Rate Limit │  │ │
│  │  │ Audit Trail │ │ Stats Refresh│ │ History, Templates     │  │ │
│  │  └─────────────┘ └──────────────┘ └────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    PRISMA 5 + SQLite                          │   │
│  │  User | Session | PipelineRun | Template | Setting           │   │
│  │  ClientConfig | ActivityEvent | ApprovalItem | AuditEntry    │   │
│  │  PortalStats                                                  │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Tech Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.0.10 |
| UI | React | 19.2.1 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS (v4, OKLCH) | 4.x |
| Database | SQLite via Prisma | 5.22.0 |
| Charts | Recharts | 3.7.0 |
| Icons | Lucide React | 0.563.0 |
| Validation | Zod | 4.3.6 |
| State | Zustand | 5.0.11 |
| Auth | Custom (bcrypt + sessions) | — |
| Testing | Vitest + Testing Library | 4.0.18 |
| AI: Gemini | @google/generative-ai | 0.24.1 |
| AI: Anthropic | @anthropic-ai/sdk | 0.71.2 |
| AI: OpenAI | openai | 6.10.0 |

---

## 3. THE 6-PILLAR FRAMEWORK

The **6-Pillar Operational Audit** is the unifying framework across all 5 agents. It identifies and eliminates operational waste in service businesses.

```
┌─────────────────────────────────────────────────────────────────┐
│                    6-PILLAR OPERATIONAL AUDIT                    │
├──────────────────┬──────────────────────────────────────────────┤
│ PILLAR           │ WHAT IT FINDS                                │
├──────────────────┼──────────────────────────────────────────────┤
│ 1. Shadow Ops    │ Off-system work: WhatsApp, DMs, spreadsheets,│
│    (Ghost Work)  │ sticky notes, memory-based processes         │
├──────────────────┼──────────────────────────────────────────────┤
│ 2. Exceptions    │ Edge cases that break processes: recurring   │
│    (Fire-fights) │ problems, workarounds, escalations           │
├──────────────────┼──────────────────────────────────────────────┤
│ 3. Audit Trail   │ What you can't prove happened: missing logs, │
│    (Proof Gaps)  │ dispute vulnerability, compliance gaps       │
├──────────────────┼──────────────────────────────────────────────┤
│ 4. Knowledge &   │ Tribal knowledge, approval bottlenecks,     │
│    Decisions     │ single points of failure, undocumented SOPs  │
├──────────────────┼──────────────────────────────────────────────┤
│ 5. Handoffs &    │ Context loss between teams/steps, stuck      │
│    SLAs          │ cases, missed deadlines, SLA breaches        │
├──────────────────┼──────────────────────────────────────────────┤
│ 6. Channels &    │ Scattered communication: email + Slack +     │
│    Evidence      │ phone + text, no single source of truth      │
└──────────────────┴──────────────────────────────────────────────┘
```

### How Each Agent Uses the 6 Pillars

| Agent | Pillar Application |
|-------|-------------------|
| **Agent 1** | Maps pain signals to pillar evidence (fit scoring) |
| **Agent 2** | Qualifies leads through Shadow Ops lens |
| **Agent 3** | Conducts 6-pillar discovery audit (35 questions) |
| **Agent 4** | Builds pillar-mapped deliverables + specs |
| **Agent 5** | Tracks before/after metrics per pillar |

---

## 4. THE 5-AGENT PIPELINE

### Pipeline Flow

```
┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐
│  AGENT 1  │───▶│  AGENT 2  │───▶│  AGENT 3  │───▶│  AGENT 4  │───▶│  AGENT 5  │
│  Market   │    │  Outbound │    │  Sales    │    │  Systems  │    │  Client   │
│  Intel    │    │  & Booking│    │  Engineer │    │  Delivery │    │  Success  │
│           │    │           │    │           │    │           │    │           │
│  Gemini   │    │  Claude   │    │  GPT-4o   │    │  Gemini   │    │  Claude   │
│  2min     │    │  2min     │    │  3min     │    │  3min     │    │  3min     │
│  ~$0.50   │    │  ~$1.50   │    │  ~$4.50   │    │  ~$1.20   │    │  ~$1.50   │
└───────────┘    └───────────┘    └───────────┘    └───────────┘    └───────────┘
     │                │                │                │                │
     ▼                ▼                ▼                ▼                ▼
 Target Pack      Bookings +      Proposal +       Workflows +     Health Score
 (10-30 leads)    Campaigns       SOW + Close      Handoff Kit     + KPIs +
                                  Plan                              Proof Assets
```

**Estimated total cost per pipeline run: ~$9.20**

---

### AGENT 1: Market Intelligence & Targeting

**File**: `app/api/agents/run/uptimize/agent-1-market-intelligence/agent.ts` (1,052 lines)
**Types**: `types.ts` (154 lines)
**Model**: Gemini 2.0 Flash (via fallback waterfall)
**Timeout**: 2 minutes

#### Mission
Produce ranked, evidence-based Target Packs of 10-30 leads. Focus on "Shadow Ops" — the invisible off-system work that companies don't realize is costing them.

#### Input
```typescript
runAgent1MarketIntelligence(
  task: string,           // Lead data (raw text, 10-50K chars)
  context: {
    mode?: "Daily Target Pack" | "Segment Deep Dive" | "Angle Testing" | "Weekly Intel";
    enable_research?: boolean;
    research_depth?: "quick" | "standard" | "deep";
    prospect_list?: Array<{ name, company, domain?, linkedin_url? }>;
  },
  mode: "fast" | "balanced" | "quality"
)
```

#### Output: `TargetPackOutput`
```
├── run_metadata (timestamp, mode, segment_focus, total_evaluated, pack_size)
├── angle_of_the_day (angle, why_now, pillar_alignment, industry_trigger)
├── do_not_target[] (company, reason)
├── target_pack_primary[] (fit_score >= 70)
│   ├── lead_id, name, company, role, segment
│   ├── fit_score_0_100 (breakdown: pain, urgency, authority, budget, complexity, stack, reach)
│   ├── shadow_ops_density_0_10
│   ├── exception_hypotheses_top3[]
│   ├── trigger_event
│   ├── hooks (primary + backup, 140 chars each)
│   └── pattern_interrupt_question, cta
├── target_pack_secondary[] (fit_score 60-69)
└── shadow_ops_insights (top_patterns[], industry_blind_spots[], recommended_angles[])
```

#### Evidence Quality Tiers
- **Tier 1 (High)**: Direct quotes from reviews, job postings, social posts
- **Tier 2 (Medium)**: Inferred from company profile, tech stack, hiring
- **Tier 3 (Low)**: Assumptions based on industry patterns (labeled as such)

#### Research MCP Integration
Agent 1 includes an `Agent1ResearchClient` class (375 lines) for web research via MCP servers:
- **Web**: search_web, search_news, search_hiring_signals, search_complaints, search_tech_stack
- **LinkedIn**: get_person_profile, get_company_profile, get_recent_posts, search_people, get_hiring_activity
- **Reviews**: get_google_reviews, get_g2_reviews, get_capterra_reviews, aggregate_reviews, extract_pain_themes
- **Social**: search_twitter, get_twitter_profile, search_facebook, monitor_mentions
- **Industry**: get_company_data, get_competitor_landscape, get_market_trends

#### Key Exports
- `runAgent1MarketIntelligence(task, context, mode)` — Main entry
- `runAgent1WithResearch(task, prospects, context, mode)` — With live research
- `researchAndScoreCompany(companyName, domain?, context)` — Single company
- `getAvailableResearchTools()` — List available MCP tools

---

### AGENT 2: Outbound & Appointment Setter

**File**: `app/api/agents/run/uptimize/agent-2-outbound-appointment/agent.ts` (318 lines)
**Types**: `types.ts` (258 lines)
**Model**: Claude Sonnet (via fallback waterfall)
**Timeout**: 2 minutes

#### Mission
Turn Agent 1's Target Packs into booked discovery calls. Lead with unique, niche-deep questions about Shadow Ops + exceptions.

#### Input
```typescript
runAgent2OutboundAppointment(
  task: string,
  context: {
    targetPack?: any;                  // Agent 1 output
    calendarAvailability?: string[];
    offerPositioning?: string;
    proofPoints?: string[];
    timezone?: string;                 // Default: America/Puerto_Rico
    channels?: string[];
    volumeTargets?: { newOutreach?, followups?, goalBookedCalls? };
  },
  mode: AgentMode
)
```

#### Output: `OutboundAndBookingOutput`
```
├── run_metadata
├── outbound_run_sheet (daily plan)
├── message_library[]
│   ├── lead_id, channel
│   ├── track_messages (pattern_interrupt, problem_first, proof_first)
│   └── followup_sequence[] (7-12 touches: touch_number, day_offset, message, angle_type, cta)
├── conversation_updates[] (lead_id, old_stage → new_stage, tags, note)
├── bookings[]
│   ├── lead_id, meeting_time_local, meeting_type (discovery|audit|demo)
│   ├── qualified_lead_summary (problem, impact, urgency, authority, stack, timeline)
│   ├── shadow_ops_off_system_examples[]
│   ├── top_exceptions_mentioned[]
│   └── confirmation_flow (immediate, 24h_before, 2h_before, 15m_before, no_confirm_reschedule)
└── nurture_queue[] (lead_id, reason, next_touch_day_offset, nurture_message)
```

#### Pipeline Stages
`NEW → CONTACTED → REPLIED → QUALIFYING → QUALIFIED → BOOKED → NO-SHOW → CLOSED-WON/LOST → NURTURE`

#### Objection Handling (6 Playbooks)
| Objection | Strategy |
|-----------|----------|
| "We already have someone" | Position as complementary gap finder |
| "Send info" | Exchange for clarity + scheduling |
| "No time / too busy" | Offer async option |
| "Bad past experience" | Differentiate via systems + QA + adoption |
| "Happy with current" | Test pain with one sharp question |
| "Not the decision maker" | Identify DM + get intro |

---

### AGENT 3: Sales Engineer & Offer Architect

**File**: `app/api/agents/run/uptimize/agent-3-sales-engineer/agent.ts` (717 lines)
**Types**: `types.ts` (249 lines)
**Model**: GPT-4o (via fallback waterfall)
**Timeout**: 3 minutes

#### Mission
Convert qualified calls into signed deals using the 6-Pillar Operational Audit as the discovery framework. Run structured discovery → diagnosis → quantification → phased solution.

#### Input
```typescript
runAgent3SalesEngineer(
  task: string,
  context: {
    qualified_lead_brief?: { lead_id, problem, impact, urgency, authority, stack[], timeline };
    call_context?: { call_transcript_summary, call_notes, call_duration_minutes, attendees[] };
    offer_catalog?: { packages[], pricing_philosophy };
    mode?: "pre_call_prep" | "discovery_execution" | "proposal_generation" | "close_plan_only";
    custom_constraints?: string[];
    skip_pricing?: boolean;
  },
  mode: AgentMode
)
```

#### Output: `Agent3Output`
```
├── pre_call_brief (hypotheses[], must_answer_questions[], meeting_goal)
├── discovery_notes_structured (process_map[], leaks[], impact, success_criteria[])
├── shadow_ops_map (v2 - detailed mapping)
├── exception_library (v2 - categorized exceptions)
├── value_calc
│   ├── assumptions[]
│   ├── time_saved_per_week_hours
│   ├── cost_per_hour_assumption (Solo: $50-100, SMB: $75-150, Private: $100-200)
│   └── monthly_value_estimate
├── solution_blueprint (phase_1, phase_2, phase_3_optional, kpis_to_track[])
├── proposal_sow
│   ├── summary, deliverables[], timeline
│   ├── pricing_options[], client_responsibilities[]
│   ├── assumptions_exclusions[], change_request_process
│   └── acceptance_criteria[]
├── close_plan (objections[], responses[], next_steps[], follow_up_schedule[])
└── handoff_to_agent4_spec ←── CRITICAL HANDOFF
    ├── build_modules[], integrations[]
    ├── agent_specs_needed[], risks[]
    ├── definition_of_done[]
    ├── top_exceptions_to_handle[]
    └── audit_trail_fields_required[]
```

#### 6-Pillar Discovery (35 Questions)
Each pillar has 5-6 structured discovery questions covering:
- Shadow Ops: off-system work, manual processes, memory reliance
- Exceptions: recurring problems, handling, impact
- Audit Trail: dispute history, documentation, auditability
- Knowledge & Decisions: bottlenecks, approvals, tribal knowledge
- Handoffs & SLAs: context loss, SLA hits, stuck cases
- Channels & Evidence: communication scatter, proof capture

---

### AGENT 4: Systems Builder & Delivery Orchestrator

**File**: `app/api/agents/run/uptimize/agent-4-systems-delivery/agent.ts` (580 lines)
**Types**: `types.ts` (256 lines)
**Model**: Gemini 2.0 Flash (via fallback waterfall)
**Timeout**: 3 minutes

#### Mission
Ship stable, adoptable systems addressing all 6 pillars. Tested exception handling, fallback modes, SLA timers.

#### Delivery Principles
1. **Time-to-value first** — Phase 1 in 7-14 days
2. **Exception-first** — Top exceptions are first-class deliverables
3. **Auditability** — Every action creates a log trail
4. **Reliability** — Fallback modes exist for every workflow
5. **Least-privilege** — Minimal access, minimal sensitive data
6. **Pillar coverage** — Every delivery maps to at least one pillar

#### Input
```typescript
runAgent4SystemsDelivery(
  task: string,
  context: {
    handoffSpec?: Agent3HandoffSpec;        // From Agent 3
    clientTools?: { available[], restricted[], credentials?, accessConstraints[] };
    businessRules?: { operatingHours?, policies[], routingRules[], teamRoles[] };
    targetTimelineDays?: number;            // Default: 7-14 for Phase 1
  },
  mode: AgentMode
)
```

#### Output: `DeliveryPackageOutput`
```
├── build_plan (phase_1, phase_2_optional, milestones[], dependencies[])
├── data_model (entities[], fields[], logging_fields[], pipeline_stages[], exception_tags[])
├── workflow_specs[]
│   ├── workflow_name, goal, inputs[], outputs[], tools[]
│   ├── happy_path_steps[]
│   ├── exception_paths[] (exception_name, trigger, behavior, escalation, logging)
│   ├── execution_mode ("native" | "mcp" | "hybrid")
│   ├── audit_events_emitted[]
│   └── kpis_affected[]
├── agent_spec_sheets[]
│   ├── agent_name, purpose
│   ├── allowed_actions[], disallowed_actions[]
│   ├── tool_permissions[], guardrails[]
│   ├── escalation_rules[], logging[]
│   └── input_contract[], output_contract[]
├── qa_plan_and_results
│   ├── qa_checklist[]
│   ├── test_cases[] (happy_path | missing_input | wrong_input | tool_failure | safety)
│   └── results_summary, open_issues[]
├── fallback_modes[] (workflow_name, failure_mode, fallback_behavior, human_action_required)
├── client_handoff_kit ←── CRITICAL HANDOFF TO AGENT 5
│   ├── quickstart_5min[], daily_sop[], weekly_sop[]
│   ├── exception_sop[], training_plan[], admin_notes[]
│   ├── baseline_kpis[], workflows_delivered[]
│   ├── shadow_ops_baseline[], exception_library[]
├── post_launch_monitoring (kpis[], alerts[], support_process[], weekly_review_format[])
└── audit_trail_spec (audit_fields[], event_types[], retention_policy, where_logs_live)
```

---

### AGENT 5: Client Success, Retention & Expansion

**File**: `app/api/agents/run/uptimize/agent-5-client-success/agent.ts` (446 lines)
**Types**: `types.ts` (222 lines)
**Model**: Claude Sonnet 4 (direct Anthropic SDK — NOT fallback)
**Timeout**: 3 minutes

#### Mission
Ensure clients win, adopt, retain long-term, expand naturally. Track adoption + value KPIs across all 6 pillars.

#### Input
```typescript
runAgent5(
  config: { apiKey: string, model?: string, maxTokens?: number, temperature?: number },
  input: {
    handoff_kit: Agent4HandoffKit;      // From Agent 4
    current_week_of: string;            // ISO date
    usage_data?: { workflows_executed, active_users, exceptions_triggered, avg_resolution_hours };
    client_feedback?: string;
    open_tickets?: Array<{ ticket_id, severity: 'P1'|'P2'|'P3', issue, created_at }>;
  }
)
```

#### Output: `Agent5ClientSuccessPackage`
```
├── onboarding_plan (FVi7 Protocol)
│   ├── day_1[] (onboarding + quickstart + wow workflow live)
│   ├── day_3[] (check-in + remove friction + tune exceptions)
│   ├── day_7[] (weekly win report + identify optimizations)
│   └── training_sessions[]
├── adoption_dashboard
│   ├── kpis[], usage_signals[], exception_metrics
│   ├── auditability_metrics, trend_notes
├── weekly_win_report
│   ├── week_of, wins[], metrics_snapshot[]
│   ├── what_broke[], next_actions[]
├── issues_and_tickets[]
│   ├── ticket_id, severity (P1|P2|P3), issue, exception_tag
│   ├── status (open|in_progress|blocked|resolved)
│   └── owner (agent4|agent5|client|you), next_step
├── shadow_ops_reduction_report
│   ├── before_list[], after_list[]
│   ├── delta_summary, new_shadow_ops_detected[]
├── optimization_backlog[] (item, impact, effort, priority 1-10)
├── expansion_map
│   ├── phase_2_recommendations[], phase_3_optional[]
│   └── upsell_triggers[]
├── proof_asset_pipeline
│   ├── testimonial_request_plan[], case_study_draft_outline[]
│   ├── roi_snapshot_points[], proof_angles_to_market[]
└── client_health_score
    ├── score_0_100
    │   ├── Adoption (0-30): Workflows executed + active users
    │   ├── KPI Trend (0-25): Improving vs flat vs declining
    │   ├── Responsiveness (0-20): Client approval speed
    │   ├── Low Friction (0-15): Few P1/P2 issues
    │   └── Expansion Readiness (0-10): New needs emerging
    ├── risk_level (healthy: 80-100 | watch: 60-79 | at_risk: <60)
    ├── drivers[], interventions[]
```

#### Ticketing Severity
| Level | Criteria | SLA |
|-------|----------|-----|
| P1 | System down / revenue-impacting | Escalate to Agent 4 immediately |
| P2 | Partial failure / major friction | Fix within 48h |
| P3 | Minor bug / improvement | Backlog |

---

### Agent Data Flow (Complete Chain)

```
Agent 1 Output
  └─ target_pack_primary[] ─────────────────────────────▶ Agent 2 Input (targetPack)

Agent 2 Output
  └─ bookings[].qualified_lead_summary ─────────────────▶ Agent 3 Input (qualified_lead_brief)
     (problem, impact, urgency, authority, stack,
      shadow_ops_examples[], exceptions_mentioned[])

Agent 3 Output
  └─ handoff_to_agent4_spec ────────────────────────────▶ Agent 4 Input (handoffSpec)
     (build_modules[], integrations[], risks[],
      definition_of_done[], exceptions_to_handle[],
      audit_trail_fields_required[])

Agent 4 Output
  └─ client_handoff_kit ────────────────────────────────▶ Agent 5 Input (handoff_kit)
     (quickstart[], SOPs[], training_plan[],
      baseline_kpis[], workflows_delivered[],
      shadow_ops_baseline[], exception_library[])

Agent 5 Output
  └─ client_health_score + pillar_metrics ──────────────▶ Portal Analytics Display
```

---

## 5. PIPELINE ORCHESTRATION (SSE)

**File**: `app/api/pipeline/run/route.ts`
**Protocol**: Server-Sent Events (SSE)
**Max Duration**: 5 minutes (Next.js serverless limit)

### How It Works

```
Client (Browser)                         Server (Next.js)
     │                                        │
     │  POST /api/pipeline/run                │
     │  { leads: "..." }                      │
     │ ──────────────────────────────────────▶ │
     │                                        │ Rate limit check (5/min)
     │                                        │ Input validation (Zod)
     │  ◀── SSE: run_started ────────────────│
     │                                        │
     │  ◀── SSE: agent_start (agent 1) ──────│ Start Agent 1
     │  ◀── SSE: agent_complete (agent 1) ───│ Log to portal
     │                                        │
     │  ◀── SSE: agent_start (agent 2) ──────│ Pass Agent 1 → Agent 2
     │  ◀── SSE: agent_complete (agent 2) ───│ Log to portal
     │                                        │
     │  ◀── SSE: agent_start (agent 3) ──────│ Pass Agent 2 → Agent 3
     │  ◀── SSE: agent_complete (agent 3) ───│ Log to portal
     │                                        │
     │  ◀── SSE: agent_start (agent 4) ──────│ Pass Agent 3 → Agent 4
     │  ◀── SSE: agent_complete (agent 4) ───│ Log to portal
     │                                        │
     │  ◀── SSE: agent_start (agent 5) ──────│ Pass Agent 4 → Agent 5
     │  ◀── SSE: agent_complete (agent 5) ───│ Log to portal
     │                                        │
     │  ◀── SSE: pipeline_complete ──────────│ Save run + refresh stats
     │                                        │
```

### Per-Agent Execution Pattern

Each agent follows this pattern in the orchestrator:

```typescript
await withRetry(
  () => withTimeoutAndAbort(
    (signal) => runAgentN(leads, context, 'fast'),
    getAgentTimeout(N),   // 120s or 180s
    cancelSignal,         // User cancel support
    'Agent N timed out'
  ),
  { maxAttempts: 2 }
)
```

### Agent Timeouts

| Agent | Timeout | Retries |
|-------|---------|---------|
| Agent 1 | 120s (2 min) | 2 attempts |
| Agent 2 | 120s (2 min) | 2 attempts |
| Agent 3 | 180s (3 min) | 2 attempts |
| Agent 4 | 180s (3 min) | 2 attempts |
| Agent 5 | 180s (3 min) | 2 attempts |

### After Each Agent
1. Calculate cost via `estimateCost(provider, model, inputTokens, outputTokens)`
2. Validate output via `validateAgentOutput(agentNumber, data)`
3. Log to portal: `logActivityEvent()` + `logAuditEntry()`
4. If failed: send `agent_error` event and stop pipeline

### On Completion
1. Calculate total duration
2. Save run to Prisma via `saveRun()`
3. Send `pipeline_complete` event
4. Refresh portal stats via `refreshPortalStats()` (fire-and-forget)

---

## 6. GOVERNANCE LAYER

### Tool Permissions (`lib/governance/tool-permissions.ts`)

Controls what each agent can do. Enforced via `ToolPermissionChecker` singleton.

#### Permission Levels
```
READ → WRITE_INTERNAL → WRITE_EXTERNAL → EXECUTE → ADMIN
```

#### Agent Permission Matrix

| Agent | Levels | Tools | Max Cost | External Write | Execute |
|-------|--------|-------|----------|----------------|---------|
| **Agent 1** | READ, WRITE_INTERNAL | web_search, linkedin_search, review_aggregator, save_target_pack | $2.00 | No | No |
| **Agent 2** | READ, WRITE_INT, WRITE_EXT | read_crm, create_crm_contact*, send_email*, schedule_meeting*, save_campaign | $5.00 | Yes | Yes |
| **Agent 3** | READ, WRITE_INTERNAL | read_pipeline_state, read_crm, save_proposal, save_audit_findings | $3.00 | No | No |
| **Agent 4** | READ, WRITE_INT, WRITE_EXT | read_proposal, create_workflow*, configure_integration*, deploy_agent*, save_handoff_kit | $10.00 | Yes | Yes |
| **Agent 5** | READ, WRITE_INT, WRITE_EXT | read_kpis, read_tickets, update_health_score, create_report*, create_proof_asset | $3.00 | Yes | No |

*\* = requires approval*

#### Permission Check Flow

```
checkPermission(agentId, toolName, level, estimatedCost, batchSize)
  │
  ├─ Agent not found? → DENY (unknown agent)
  ├─ Level not allowed? → DENY (insufficient permission)
  ├─ Tool not in agent's list? → DENY (tool not permitted)
  ├─ Cost > max per action? → DENY (request approval)
  ├─ Batch > max batch size? → DENY (request approval)
  ├─ WRITE_EXTERNAL but can_write_external=false? → DENY
  ├─ EXECUTE but can_execute=false? → DENY
  └─ All pass → ALLOW (with requires_approval flag from tool definition)
```

### Approval Gates (`lib/governance/approval-gates.ts`)

Actions requiring approval are queued, held, and logged until a human decides.

#### Gate Check Flow

```
checkGate(agentId, toolName, level, options)
  │
  ├─ Permission Check (via ToolPermissionChecker)
  │
  ├─ DENIED → Create audit record (result: "denied") → Return "blocked"
  │
  ├─ ALLOWED + requires_approval:
  │   ├─ Create ApprovalRequest (24-hour expiry)
  │   ├─ Write to Prisma (createApprovalIfNeeded)
  │   ├─ Create audit record (result: "queued")
  │   └─ Return "queued_for_approval"
  │
  └─ ALLOWED + no approval needed:
      ├─ Create audit record (result: "success")
      └─ Return "proceed"
```

#### Approval Request Lifecycle

```
PENDING ──▶ APPROVED (by user, with reason)
       ──▶ DENIED (by user, with reason)
       ──▶ EXPIRED (after 24 hours)
```

#### Risk Level Assignment
- Cost > $5 → **high**
- Cost > $1 → **medium**
- Otherwise → **low**

---

## 7. CLIENT PORTAL (7 Routes)

### Portal Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      PORTAL LAYOUT (layout.tsx)                  │
│  ┌───────────┐  ┌───────────────────────────────────────────┐   │
│  │  SIDEBAR   │  │  CONTENT AREA                             │   │
│  │           │  │                                           │   │
│  │  Logo     │  │  ┌─────────────────────────────────────┐  │   │
│  │  Agent    │  │  │  Overview / Activity / Approvals /  │  │   │
│  │  Status   │  │  │  Analytics / Permissions / Audit    │  │   │
│  │           │  │  └─────────────────────────────────────┘  │   │
│  │  Nav:     │  │                                           │   │
│  │  Overview │  │                                           │   │
│  │  Activity │  │                                           │   │
│  │  Approvals│  │                                           │   │
│  │  (badge)  │  │                                           │   │
│  │  Analytics│  │                                           │   │
│  │  Perms    │  │                                           │   │
│  │  Audit    │  │                                           │   │
│  │           │  │                                           │   │
│  │  User     │  │                                           │   │
│  │  Footer   │  │                                           │   │
│  └───────────┘  └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### API Routes

| Method | Route | Purpose | Data Source |
|--------|-------|---------|-------------|
| GET | `/api/portal/client` | Client + agent metadata | `clientConfig` table |
| GET | `/api/portal/stats` | KPIs + live pending count | `portalStats` + `approvalItem` |
| GET | `/api/portal/activity` | Filterable activity feed | `activityEvent` table |
| GET/PATCH | `/api/portal/approvals` | Approval queue + decisions | `approvalItem` + `auditEntry` |
| GET | `/api/portal/analytics` | 6-pillar metrics + trends | `pipelineRun` (Agent 5 data) |
| GET | `/api/portal/permissions` | Agent access matrix | governance rules + `auditEntry` |
| GET | `/api/portal/audit` | Immutable audit trail | `auditEntry` table |

### Portal Pages Detail

#### Overview (`/portal`)
- Welcome header with client name
- 4 hero metrics: Actions Today, Hours Saved, Pending Approvals, Health Score
- Hours Saved bar chart (6 weeks)
- Quick Stats: Total Actions, Success Rate, Exceptions Resolved, Total Cost
- Recent Activity (last 4) + Pending Approvals with inline Approve/Deny

#### Activity (`/portal/activity`)
- Search box (real-time on action + description)
- Pillar filter: All, Shadow Ops, Exceptions, Audit Trail, Knowledge, Handoffs, Channels
- Status filter: All, Completed, Pending, Failed
- Timeline display with expandable cards

#### Approvals (`/portal/approvals`)
- **Pending tab**: Cards with risk level, affected system, reason, note input, Approve/Deny buttons
- **History tab**: Compact rows with decision, decider, note
- Optimistic UI (update before API confirms, revert on error)

#### Analytics (`/portal/analytics`)
- 3 summary cards (Hours Saved, Health Score, Exceptions Resolved)
- 6-pillar grid: before/after bars with improvement %
- Trend charts: Hours Saved per Week + Health Score Trend

#### Permissions (`/portal/permissions`)
- Access level legend (Read, Write, Execute, No Access)
- Category cards (CRM, Email, Calendar, etc.)
- Per-tool rows: name, description, access badge, last used timestamp

#### Audit Log (`/portal/audit`)
- Export CSV button
- Search + status filter
- Table: Timestamp, Action, Tool, Status, By, Cost
- Footer stats: entry count + total cost

### Data Fetching Hook

All portal pages use a shared generic hook:
```typescript
usePortalData<T>(url: string): { data: T | null, loading: boolean, error: string | null, refetch: () => void }
```

---

## 8. DATABASE SCHEMA

**File**: `prisma/schema.prisma` (149 lines)
**Engine**: SQLite
**Seed**: `prisma/seed.ts` (286 lines)

### Models

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│    User      │  │   Session    │  │ PipelineRun  │
│              │  │              │  │              │
│ id           │  │ id           │  │ id           │
│ username (u) │  │ token (u)    │  │ runId (u)    │
│ password     │  │ userId       │  │ timestamp    │
│ role         │  │ expiresAt    │  │ leads        │
│ createdAt    │  │ createdAt    │  │ duration     │
└──────────────┘  └──────────────┘  │ cost         │
                                     │ status       │
┌──────────────┐  ┌──────────────┐  │ results      │
│  Template    │  │   Setting    │  └──────────────┘
│              │  │              │
│ id           │  │ id           │
│ name (u)     │  │ key (u)      │
│ description  │  │ value        │
│ content      │  │ updatedAt    │
│ usageCount   │  └──────────────┘
│ createdAt    │
│ updatedAt    │
└──────────────┘

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ ClientConfig │  │ActivityEvent │  │ ApprovalItem │
│              │  │              │  │              │
│ id           │  │ id           │  │ id           │
│ clientId (u) │  │ clientId     │  │ clientId     │
│ name         │  │ action       │  │ action       │
│ company      │  │ description  │  │ description  │
│ agentId      │  │ status       │  │ riskLevel    │
│ agentName    │  │ pillar       │  │ affectedSys  │
│ agentDesc    │  │ toolUsed     │  │ reason       │
│ agentStatus  │  │ costUsd      │  │ status       │
│ deployedAt   │  │ durationMs   │  │ decidedAt    │
│ industry     │  │ pipelineRunId│  │ decidedBy    │
└──────────────┘  │ timestamp    │  │ note         │
                   └──────────────┘  │ timestamp    │
                                     └──────────────┘
┌──────────────┐  ┌──────────────┐
│  AuditEntry  │  │ PortalStats  │
│              │  │              │
│ id           │  │ id           │
│ clientId     │  │ clientId (u) │
│ action       │  │ actionsToday │
│ tool         │  │ hoursSaved   │
│ status       │  │ pendingAppr  │
│ approvedBy   │  │ healthScore  │
│ costUsd      │  │ totalActions │
│ details      │  │ totalCost    │
│ timestamp    │  │ successRate  │
│              │  │ exceptions   │
└──────────────┘  │ updatedAt    │
                   └──────────────┘
```

### Seed Data (Default)
- Admin user: `admin / admin123`
- Client: "Sarah Chen" @ "Meridian Logistics" with "Ops Handler" agent
- 8 activity events, 4 approvals, 13 audit entries, 1 stats record
- 1 lead template with sample data
- Run seed: `npx tsx prisma/seed.ts`

---

## 9. AUTHENTICATION & SECURITY

### Auth Flow
```
Login → POST /api/auth (username + password)
  → bcrypt compare
  → Generate session token
  → Store Session in DB
  → Set HttpOnly cookie (SameSite=Strict)

Check → GET /api/auth
  → Read cookie
  → Validate token in DB
  → Return { authenticated, user: { username, role } }

Logout → POST /api/auth { action: 'logout' }
  → Delete session from DB
  → Clear cookie
```

### Client-Side Auth (`lib/auth-context.tsx`)
- `AuthProvider` wraps app, checks auth on mount
- Public routes: `/login`, `/api/*`, `/portal/*`
- `useAuth()` hook for consuming components
- Auto-redirect to `/login` if unauthenticated

### Security Measures
- **Rate Limiting**: Auth (10/15min), Pipeline (5/min), API (60/min), Webhook (20/min)
- **Input Validation**: Zod schemas for all inputs
- **XSS Prevention**: Regex patterns block `<script>`, `javascript:`, event handlers, template injection
- **HTML Sanitization**: `<>&"'` escaped
- **Session Security**: HttpOnly, SameSite=Strict cookies
- **API Key Validation**: 20-200 chars, alphanumeric only

---

## 10. ADMIN DASHBOARD & PAGES

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Dashboard | Pipeline overview, metrics, charts, recent runs |
| `/login` | Login | Username/password auth (default: admin/admin123) |
| `/pipeline` | Pipeline | Execute pipeline with lead input, real-time SSE progress |
| `/history` | History | View/delete past runs, stats summary |
| `/results` | Results | "What Gets Produced" — demo of pipeline outputs |
| `/templates` | Templates | CRUD for reusable lead input templates |
| `/compare` | Compare | Side-by-side run comparison with diff highlighting |
| `/settings` | Settings | Application configuration (placeholder) |

### Dashboard Metrics
- Total Runs, Leads Analyzed, Avg Pipeline Time, Success Rate
- Charts: Pipeline History (area), Agent Performance (bar), Lead Distribution (pie)
- Recent Agent Runs with status badges and JSON preview

### Pipeline Page Features
- Lead input textarea (10-50K chars)
- Real-time SSE streaming with progress bar
- Cost tracking per agent
- Download JSON results / Copy to clipboard
- Cancel button during execution

---

## 11. COMPONENT LIBRARY

### Dashboard Components (`components/dashboard/`)

| Component | Props | Purpose |
|-----------|-------|---------|
| `MetricCard` | title, value, subtitle, icon, trend | Dashboard stat card with trend indicator |
| `AgentCard` | agentNumber, name, status, duration, outputPreview | Agent status during pipeline execution |
| `PipelineFlow` | agents[], className | Horizontal flow diagram with status circles |
| `Charts` | (3 chart components) | Area, Bar, Pie charts via Recharts |

### UI Components (`components/ui/`)

| Component | Variants | Purpose |
|-----------|----------|---------|
| `Button` | default, destructive, outline, secondary, ghost, link | CVA-based button with Radix slot |
| `Card` | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter | Composition-pattern card |
| `Badge` | default, success, warning, error, info, outline | Status/category badges |
| `Progress` | value (0-100), showLabel | Gradient progress bar |

### Portal Components (`app/portal/`)

| Component | Purpose |
|-----------|---------|
| `CardSkeleton` | Loading placeholder for cards |
| `MetricSkeleton` | Loading placeholder for metric cards |
| `TableRowSkeleton` | Loading placeholder for table rows |
| `ErrorBanner` | Error alert with retry button |
| `SidebarSkeleton` | Loading placeholder for sidebar |

---

## 12. UTILITY LIBRARIES

### `lib/costs.ts` — LLM Cost Tracking

**Pricing Registry** (per 1M tokens):

| Provider | Model | Input | Output |
|----------|-------|-------|--------|
| Gemini | gemini-2.0-flash-exp | $0.075 | $0.30 |
| Gemini | gemini-1.5-pro | $1.25 | $5.00 |
| Anthropic | claude-sonnet-4 | $3.00 | $15.00 |
| Anthropic | claude-3-opus | $15.00 | $75.00 |
| OpenAI | gpt-4o | $2.50 | $10.00 |
| OpenAI | gpt-4o-mini | $0.15 | $0.60 |

**Key Functions**: `estimateCost()`, `calculateCost()`, `aggregatePipelineCosts()`, `formatCost()`, `estimateTokens()` (text.length / 4)

### `lib/retry.ts` — Exponential Backoff

- Default: 3 attempts, 1s initial delay, 2x multiplier, 30s max delay
- Jitter: 0-30% randomness to prevent thundering herd
- Retryable errors: ECONNRESET, ETIMEDOUT, 429, 500-504, timeout, network error
- Custom `RetryError` class preserving cause and attempt count

### `lib/timeout.ts` — Timeout + Abort

- `withTimeout(promise, ms)` — Race promise against timer
- `withTimeoutAndAbort(fn, ms, signal)` — Supports external cancellation (user cancel button)
- Agent timeouts: 120s (Agents 1-2), 180s (Agents 3-5)

### `lib/rate-limit.ts` — Sliding Window

- In-memory Map-based limiter (auto-cleanup at 10K entries)
- Presets: pipeline (5/min), api (60/min), auth (10/15min), webhook (20/min)
- Client ID extraction: x-forwarded-for → x-real-ip → user-agent hash

### `lib/validation.ts` — Zod Schemas + XSS

- `LeadInputSchema`: 10-50K chars, no malicious patterns
- `TemplateSchema`: name (alphanumeric), description (500 chars), content (10K chars)
- `WebhookTriggerSchema`: leads + optional callbackUrl + metadata
- `containsMaliciousPatterns()`: blocks `<script>`, `javascript:`, event handlers, template injection

### `lib/history.ts` — Run Persistence

- `saveRun()`, `loadHistory()`, `getRunById()`, `deleteRun()`, `clearHistory()`
- `generateRunId()`: `run_${timestamp}_${random6}`
- `getHistorySummary()`: totalRuns, successRate, avgDuration, totalCost

### `lib/portal-events.ts` — Portal Event Logging

- `logActivityEvent()` → creates activityEvent record
- `logAuditEntry()` → creates auditEntry record
- `createApprovalIfNeeded()` → creates pending approvalItem
- `refreshPortalStats()` → recomputes actionsToday, totalActions, pendingApprovals, successRate

---

## 13. LLM PROVIDER SYSTEM

### Provider Abstraction (`app/api/agents/run/providers/`)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Gemini    │    │   OpenAI    │    │  Anthropic  │
│  Provider   │    │  Provider   │    │  Provider   │
│             │    │             │    │             │
│ gemini.ts   │    │ openai.ts   │    │anthropic.ts │
│             │    │             │    │             │
│ Flash, Pro  │    │ 4o, Mini,   │    │ Sonnet,     │
│             │    │ Turbo       │    │ Opus        │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
                ┌─────────┴─────────┐
                │  FALLBACK SYSTEM  │
                │  (fallback.ts)    │
                │                   │
                │  Waterfall order: │
                │  Gemini → OpenAI  │
                │  → Anthropic      │
                └───────────────────┘
```

### Fallback Waterfall (Agents 1-4)

```typescript
executeWithFallback(task, mode, timeoutMs, retryPolicy)
```

| Mode | Priority |
|------|----------|
| `fast` | OpenAI GPT-4o first |
| `balanced` | Anthropic Claude Sonnet first |
| `quality` | Anthropic Claude Opus first |

**Exception**: Agent 5 uses Anthropic Claude Sonnet **directly** (not fallback).

### Task Requirements Router (`router.ts`)

Routes agents to optimal models based on:
- `TaskRequirements` interface (speed, quality, cost constraints)
- `AGENT_DEFAULTS` with per-agent requirement profiles
- Dynamic selection: checks available API keys → picks best match

---

## 14. TESTING INFRASTRUCTURE

**Framework**: Vitest 4.0 + Testing Library React + jsdom
**Config**: `vitest.config.ts` — 180s timeout, sequential execution (avoid rate limits)

### Test Files

| File | Tests | Agent |
|------|-------|-------|
| `__tests__/agents/agent-1.test.ts` | Market Intel | Real API calls |
| `__tests__/agents/agent-2.test.ts` | Outbound | Real API calls |
| `__tests__/agents/agent-3.test.ts` | Sales Engineer | Real API calls |
| `__tests__/agents/agent-4.test.ts` | Systems Delivery | Real API calls |
| `__tests__/agents/agent-5.test.ts` | Client Success | Real API calls |
| `__tests__/setup.ts` | Vitest setup | — |

### Commands

```bash
pnpm test              # Watch mode
pnpm test:run          # Single run
pnpm test:agent1       # Individual agent test
pnpm test:agent2
pnpm test:agent3
pnpm test:agent4
pnpm test:agent5
```

---

## 15. FILE INVENTORY

### Summary

| Category | Files | Est. Lines |
|----------|-------|-----------|
| Agent Implementations | 25 | ~4,250 |
| API Routes | 42 | ~3,000 |
| Frontend Pages | 13 | ~1,500 |
| Portal (UI + API) | 17 | ~2,000 |
| Components | 9 | ~800 |
| Libraries | 15 | ~2,500 |
| Database | 2 | ~435 |
| Tests | 6 | ~3,000 |
| Config | 7 | ~200 |
| **TOTAL** | **~152** | **~15,000+** |

### Directory Tree

```
uptimize-engine/
├── app/
│   ├── api/
│   │   ├── agents/run/
│   │   │   ├── orchestrator.ts, route.ts, types.ts, config.ts
│   │   │   ├── providers/ (base, adapter, router, gemini, openai, anthropic, telemetry)
│   │   │   ├── tools/, skills/, mcp/, memory/, integration/, prompts/
│   │   │   ├── fallback.ts, logger.ts, cost.ts, retry.ts
│   │   │   ├── automation/ (workflow-engine)
│   │   │   ├── shared/ (audit-pillars, schemas)
│   │   │   ├── uptimize/
│   │   │   │   ├── agent-1-market-intelligence/ (agent, types, index, schema)
│   │   │   │   ├── agent-2-outbound-appointment/ (agent, types, index, schema)
│   │   │   │   ├── agent-3-sales-engineer/ (agent, types, index, schema)
│   │   │   │   ├── agent-4-systems-delivery/ (agent, types, index, schema)
│   │   │   │   └── agent-5-client-success/ (agent, types, index, schema)
│   │   │   └── internal/ (smartgym, pvision venture agents)
│   │   ├── pipeline/ (run/route, batch/route, cancel/route, pipeline-state)
│   │   ├── portal/ (client, stats, activity, approvals, analytics, permissions, audit)
│   │   ├── auth/route.ts
│   │   ├── health/route.ts
│   │   ├── history/route.ts
│   │   ├── templates/route.ts
│   │   ├── webhooks/trigger/route.ts
│   │   └── integrations/sheets/leads/route.ts
│   ├── portal/ (layout, page, activity, approvals, analytics, permissions, audit)
│   ├── login/, pipeline/, history/, results/, templates/, compare/, settings/
│   ├── layout.tsx, page.tsx, error.tsx, providers.tsx, globals.css
├── components/
│   ├── dashboard/ (AgentCard, MetricCard, PipelineFlow, Charts, index)
│   └── ui/ (Button, Card, Badge, Progress, index)
├── lib/
│   ├── prisma.ts, auth.ts, auth-context.tsx
│   ├── costs.ts, validation.ts, rate-limit.ts, retry.ts, timeout.ts
│   ├── history.ts, templates.ts, utils.ts
│   ├── portal.ts, portal-events.ts
│   ├── pipeline-state.ts, job-queue.ts, notifications.ts, agent-schemas.ts
│   ├── governance/ (tool-permissions, approval-gates, index)
│   └── integrations/ (google-sheets)
├── prisma/ (schema.prisma, seed.ts)
├── __tests__/ (setup, agents/agent-1-5.test.ts)
├── examples/ (integration, research, test-runner, audit-data)
├── data/ (lead-templates.json)
├── public/ (favicon, SVGs)
├── package.json, tsconfig.json, next.config.ts, vitest.config.ts
└── .env, .env.example, .env.local
```

---

## 16. KNOWN ISSUES & GAPS

### Pre-existing Type Errors (8)
1. 5 test files: Cannot find agent module imports
2. `agent-1-market-intelligence/agent.ts`: CompanyProfile type cast
3. `examples/agent-1-to-agent-2-integration.ts`: Agent1ResearchContext mismatch
4. `lib/validation.ts`: Missing arguments

### Architecture Gaps
| Issue | Impact | Priority |
|-------|--------|----------|
| **Hardcoded client ID** (`client_001` everywhere) | No multi-tenant support | High |
| **Agent 5 uses Anthropic directly** (not fallback) | Inconsistency with Agents 1-4 | Medium |
| **No pagination** on activity/approvals/audit | Performance with large datasets | Medium |
| **In-memory rate limiting** | Resets on server restart; no clustering | Medium |
| **MCP Integration** (Agent 1) | Specified but may not be fully tested | Low |
| **No real-time updates** | Portal requires manual refresh | Low |
| **Settings page** is placeholder | Not implemented | Low |
| **No email/notification delivery** | `notifications.ts` exists but is scaffold | Low |

### Security Gaps
| Issue | Impact |
|-------|--------|
| Default credentials in seed (admin/admin123) | Must change in production |
| SQLite for production data | Not suitable for concurrent writes |
| No CSRF protection | Vulnerable to cross-site request forgery |
| API keys in .env file | Need secrets manager for production |
| No rate limit persistence | In-memory; resets on restart |

---

## 17. IMPROVEMENT ROADMAP

### Immediate (High Impact)

1. **Multi-tenant support**: Replace hardcoded `client_001` with dynamic client resolution from auth
2. **Pagination**: Add offset/cursor to activity, approvals, and audit endpoints
3. **Agent 5 fallback**: Align Agent 5 with Agents 1-4 using `executeWithFallback()`
4. **Fix type errors**: Resolve 8 pre-existing TypeScript errors
5. **Settings page**: Implement API key management, notification config, timeouts

### Short-term (Value Adds)

6. **Real-time portal updates**: WebSocket or SSE for live activity feed
7. **Persistent rate limiting**: Redis or SQLite-based rate limiter
8. **Email notifications**: Wire up `notifications.ts` for approval alerts
9. **Production database**: Migrate from SQLite to PostgreSQL
10. **CSRF protection**: Add CSRF tokens to forms

### Medium-term (Scale)

11. **Batch pipeline**: Implement `pipeline/batch/route.ts` for parallel runs
12. **Agent retry granularity**: Per-provider retry instead of per-agent
13. **Cost optimization**: Track actual token usage (not estimates)
14. **Dashboard analytics**: Real historical charts (currently static data)
15. **Webhook callbacks**: Implement actual callback delivery after pipeline completion

### Long-term (Product)

16. **Native workflow execution**: Agent 4's "native mode" workflows that run without Make/Zapier
17. **MCP server deployment**: Full MCP integration for Agent 1 research tools
18. **Multi-model experimentation**: A/B test different models per agent
19. **Client self-service**: Portal login, permission change requests
20. **API marketplace**: Third-party integrations via the integration manager

---

## ENVIRONMENT SETUP

### Required Environment Variables

```env
# At least one AI provider key required
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Database
DATABASE_URL=file:./prisma/dev.db

# Auth
NEXTAUTH_SECRET=your_secret_here

# Optional
PERPLEXITY_API_KEY=your_perplexity_key
GOOGLE_SHEET_ID=your_sheet_id
BRAVE_API_KEY=your_brave_key
```

### Quick Start

```bash
# Install dependencies
npm install

# Set up database
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts

# Start dev server
npm run dev

# Run tests
pnpm test:run
```

### Key URLs (Development)

| URL | Purpose |
|-----|---------|
| `http://localhost:3000` | Admin Dashboard |
| `http://localhost:3000/login` | Login (admin/admin123) |
| `http://localhost:3000/pipeline` | Pipeline Execution |
| `http://localhost:3000/portal` | Client Portal |
| `http://localhost:3000/api/health` | Health Check |

---

*This document is a complete reference for the Uptimize Engine codebase as of 2026-03-20. It covers every file, function, data flow, and architectural decision. Use it to onboard new developers, brief AI assistants, or plan future development.*
