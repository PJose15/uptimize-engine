# Uptimize Engine - Complete Project Overview

> **Master Brief for AI Assistants**  
> Last Updated: August 2026  
> Version: 3.0 — reflects the system as built

---

## Table of Contents
1. [Who We Are](#who-we-are)
2. [What We Do](#what-we-do)
3. [Who We Serve](#who-we-serve)
4. [The Problem We Solve](#the-problem-we-solve)
5. [Our Solution: The 6-Pillar Framework](#our-solution-the-6-pillar-framework)
6. [Technical Architecture](#technical-architecture)
7. [What's Built (Current Status)](#whats-built-current-status)
8. [What's Left to Build](#whats-left-to-build)
9. [Development Roadmap](#development-roadmap)
10. [How to Contribute](#how-to-contribute)

---

## Who We Are

**Uptimize** is an agentic operations company. We deploy autonomous AI agents that discover, diagnose, and resolve the invisible operational chaos — **Shadow Operations** — that bleeds time, revenue, and trust from businesses of every size.

**Our Mission:** Make operational chaos visible, measurable, and autonomously resolvable.

**Our Differentiator:** We sell **measurable outcomes, not software access.** We don't just find problems and hand you a dashboard — our agents actually handle the work, and prove they did it through 6-pillar audit trails. SaaS is our control layer. Agents are the operators.

**What We Are NOT:** We are not an automation agency 2.0. We don't just plug in Zapier flows and call it AI. We build persistent, goal-driven, decision-making systems that operate inside your business.

---

## What We Do

We deliver **agentic outcomes** — autonomous AI agents that run parts of your business and prove they're doing it right.

### Two Products, One Engine

| Layer | What It Is | Who Sees It |
|-------|-----------|-------------|
| **Internal Pipeline** (Factory) | 5-agent system that discovers, diagnoses, designs, builds, and proves | Uptimize operators |
| **Deployed Agents** (Product) | Custom autonomous agents assembled from the sub-agent framework | Clients |

### The Core Pipeline

| Agent | Name | Purpose |
|-------|------|---------|
| **Agent 1** | Market Intelligence | Analyze leads, score by fit, identify Shadow Ops signals |
| **Agent 2** | Outbound & Appointment | Build the message library, run outreach, book calls |
| **Agent 3** | Sales Engineer | Run the discovery audit, quantify pain, produce proposal and SOW |
| **Agent 4** | Systems Delivery | Build workflows, configure systems, QA the deployment |
| **Agent 5** | Client Success | Track adoption, prove ROI, drive expansion |

Each agent is an AI-powered specialist that produces **structured deliverables**
(JSON outputs) that feed into the next agent via handoff envelopes. Three more
pipeline agents (6 Closer, 7 Nurture, 8 Intelligence Keeper) extend the spine
past the close, and five operational agents run the business itself on a
schedule. See [Technical Architecture](#technical-architecture) for the full
fleet.

Every numbered agent decomposes into two specialist sub-agents, which is how a
client-specific agent gets assembled without rebuilding from scratch.

---

## Who We Serve

### Primary ICP: Operations-Heavy Businesses (Any Size)

**Anyone drowning in invisible work they can't prove, track, or scale:**
- Solopreneurs and small teams (1-49) — they have the MOST shadow ops and the least bandwidth
- Mid-market operators (50-500) — scaling pain, tribal knowledge risk, exception chaos
- Enterprise departments (500+) — compliance gaps, cross-team handoff failures

### Ideal Customer Profile (ICP)
- **Title:** Founders, Operations Directors, COOs, Heads of Sales Ops, VPs of Operations
- **Company Size:** Any — from solo operators to enterprise departments
- **Industries:** Logistics, healthcare, legal, real estate, construction, fitness, creator economy, professional services, SaaS, agencies — any business with operational complexity
- **Pain Points:**
  - "We spend hours every day on manual follow-ups"
  - "Work disappears into DMs and WhatsApp groups"
  - "We can't prove what happened when disputes arise"
  - "Exceptions break our processes constantly"
  - "Only one person knows how this works"
  - "We've tried AI tools but nothing stuck"

### What Makes Them Our Customer
They don't need another tool to learn. They need an agent that works. They're ready to let intelligence handle the ops — as long as you can prove it's working.

---

## The Problem We Solve

### The "Shadow Operations" Crisis

Most companies have **two operating systems:**

1. **Official System** (CRM, project management, ticketing)
   - Looks good in demos
   - Missing 60-80% of actual work
   - Nobody uses it consistently

2. **Shadow Operations** (WhatsApp, spreadsheets, memory, DMs,CMRs)
   - Where real work happens
   - Invisible to management
   - No audit trail
   - Context gets lost
   - Work falls through cracks

**The Cost:**
- Targets **10-20 hours/week of recoverable shadow ops** per person
- Deals lost because follow-ups were missed
- Disputes lost because there's no proof
- Knowledge walks out the door when people quit

---

## Our Solution: The 6-Pillar Framework

We prove ROI by measuring improvement across **6 operational pillars:**

### PILLAR 1: Shadow Ops Reduction
**Problem:** Work happens off-system (WhatsApp, texts, spreadsheets, memory)  
**Solution:** Automate and centralize all work into official systems  
**Metrics:** Hours saved/week, tasks automated, channels consolidated

### PILLAR 2: Exception Handling
**Problem:** Edge cases break workflows, require manual intervention  
**Solution:** Routing rules, auto-handling, standardized responses  
**Metrics:** Exception count, auto-handle rate, resolution time

### PILLAR 3: Audit Trail Completeness
**Problem:** Can't prove what happened, disputes lost  
**Solution:** Immutable logs, evidence capture, system of record  
**Metrics:** Audit completeness %, disputes won, compliance score

### PILLAR 4: Knowledge & Decisions
**Problem:** Tribal knowledge, unclear authority, bottleneck approvers  
**Solution:** Documented SOPs, decision matrix, distributed authority  
**Metrics:** Decisions documented %, approval time, bottleneck reduction

### PILLAR 5: Handoffs & SLAs
**Problem:** Context loss between teams, stuck cases, missed SLAs  
**Solution:** Smooth handoffs, SLA timers, auto-escalation  
**Metrics:** SLA hit rate, handoff time, stuck cases resolved

### PILLAR 6: Channels & Evidence
**Problem:** Scattered information, shadow channels, missing proof  
**Solution:** Consolidated channels, evidence capture, findability  
**Metrics:** Capture rate, shadow incidents, findability score

**Why This Matters:** These are **defensible outcomes** that generic AI agencies can't show. We don't sell "AI magic" - we sell measurable operational improvement.

---

## Technical Architecture

### Tech Stack

**Frontend:** Next.js 16 (App Router), React 19, TypeScript, TailwindCSS 4,
local UI primitives in `components/ui/`.

**Backend:** Next.js API routes, server-sent events for live pipeline updates,
Prisma ORM.

**Database:** Prisma v5.22 over SQLite (`prisma/dev.db`) in development.
**30 models** covering core execution, the client portal, v2 sub-agent runs,
the learning system, portfolio management, and the operational agents.
Postgres is required before any serverless deploy — see
`docs/POSTGRES_MIGRATION.md`.

**AI integration:** six providers (Anthropic, OpenAI, Gemini, Groq, Mistral,
Perplexity) behind a common adapter. Work is routed by *task profile* to one of
five model tiers (FAST / BALANCED / QUALITY / MINI / RESEARCH), each with its
own fallback waterfall. `lib/config/models.ts` is the single source of truth
for model aliases, task-to-tier mapping, and pricing.

### The Agent Fleet

The "5-agent pipeline" framing describes the sales-and-delivery spine. The
system as built is larger:

**Pipeline agents (`app/api/agents/run/uptimize/`)**

| Agent | Name | Purpose |
|-------|------|---------|
| 1 | Market Intelligence | Research and score leads into a target pack |
| 2 | Outbound & Appointment | Message architecture and booking pipeline |
| 3 | Sales Engineer | Discovery audit, proposal and SOW |
| 4 | Systems Delivery | Build spec and QA |
| 5 | Client Success | Health analysis and win reports |
| 6 | Closer & Onboarding | Presentation coaching, contract orchestration |
| 7 | Nurture | Signal monitoring and re-engagement sequences |
| 8 | Intelligence Keeper | Pattern collection and playbook updates |

**Operational agents (`app/api/agents/run/operational/`)** — 9 Revenue
Intelligence, 10 Content, 11 Business Development, 12 Compliance, 13 Internal
Ops. These run on a schedule rather than on request.

**Internal venture agents (`app/api/agents/run/internal/`)** — SmartGym (lead
capture, member retention, operations) and PVision (field ops, lead routing,
billing).

Each of the 13 numbered agents declares two specialist **sub-agents** (26 in
total, typed in `lib/subagent/types.ts`) composed sequentially, in parallel, or
conditionally.

### Cross-Cutting Systems

- **Sub-agent framework** (`lib/subagent/`) — composition patterns with
  time-budget splitting and P1-failure recovery. Every sub-agent returns a
  uniform envelope carrying cost, tokens, confidence and escalation severity.
- **Governance** (`lib/governance/`) — a five-level permission matrix covering
  all 13 agents, and an approval gate that decides *before* an external call
  runs. Approval state lives in the database so a portal decision reaches the
  next attempt.
- **Learning** (`lib/learning/`) — collectors pull observations off agent
  completions, anonymize them, score confidence, and route validated learnings
  to the agents that should receive them.
- **Portfolio** (`lib/portfolio/`) — retainer-weighted health, weekly capacity
  against a 33.5h cap, and cross-client pattern detection.
- **Scheduler** (`lib/scheduler/`) — cron registry plus the event dispatcher
  that fires background work after agent completions.

### Execution Paths

- `POST /api/pipeline/run` — SSE-streamed run of Agents 1→5 with retry,
  timeout, cancellation, output validation and cost tracking.
- `POST /api/agents/run/[agentId]` — a single agent (1–5).
- `POST /api/agents/run` — orchestrator dispatch, including the internal
  venture agents.
- `GET /api/cron/[job]` — scheduled agents, bearer-token guarded.
- `POST /api/webhooks/trigger` — external kick-off, API-key guarded.

Agents 1–5 have two implementations selected by `USE_SUBAGENTS`: the legacy
single-call path, and the v2 sub-agent path. Both accept the same inputs and
return the same shape.

---

## What's Built (Current Status)

**Scale:** ~44,300 lines of TypeScript across `app/`, `lib/` and `components/`,
plus ~4,900 lines of tests. 26 API routes, 19 pages, 30 database models.

### Working

- All 19 agent implementations, with the 26-sub-agent framework behind a flag
- Multi-provider routing with per-tier fallback chains and cost tracking
- SSE pipeline execution with retry, timeout, cancellation and validation
- Stage-gated pipeline sessions with human review between stages
- Client portal: overview, activity, approvals, analytics, permissions, audit
- Admin portfolio dashboard: health, capacity, cross-client patterns
- Governance enforcement on agent calls that leave the process
- Learning collection from agent completions, idempotent per run
- Scheduled job dispatch for the operational agents
- Auth with session-cookie middleware, per-route DB validation, CSRF, rate
  limiting, and boot-time environment validation

### Known Gaps

These are real and worth stating plainly:

1. **Postgres migration not done.** SQLite will not survive a serverless
   deploy. This blocks production.
2. **Learning loop is open at the last step.** Collection and promotion run;
   consumption does not. `processPendingNotices()` has no callers and every
   orchestrator receives `memoryEntries: {}`. Wiring it needs a learning-type →
   memory-key mapping first (see README).
3. **WRITE_EXTERNAL / EXECUTE governance has no live caller.** The permission
   matrix lists tools — `send_email`, `create_crm_contact`, `send_invoice` —
   that have no implementation. Enforcement is installed and tested; the tools
   are not built.
4. **Operational agents 9–13 are cron-only.** They have workers and schedules
   but no interactive entry point.
5. **Little end-to-end verification.** Most of `__tests__/agents/` are live-API
   integration tests that cost money and fail without keys. Offline coverage is
   good for the seams added recently, thin for the agents themselves.
6. **Cron scale needs a paid plan.** Nine jobs, one hourly, against Vercel
   Hobby's limit of two daily jobs.

---

## Development Roadmap

### Now — Production Readiness
- [ ] Postgres migration and a real deploy
- [ ] One end-to-end pipeline run against live providers, both execution paths
- [ ] Compare sub-agent vs legacy on cost and output quality
- [ ] Fill in `retainerUsd` for portfolio clients (health is retainer-weighted)

### Next — Close the Loops
- [ ] Learning consumption (stage 4) with the memory-key mapping
- [ ] Implement the external tools the permission matrix already governs
- [ ] Split the test suite into offline unit tests and an opt-in integration tier

### Later — Scale
- [ ] Interactive entry points for the operational agents
- [ ] Portfolio groups (PE / multi-location) beyond the data model
- [ ] White-label and agent template marketplace

---

## How to Contribute

### For AI Assistants (ChatGPT, Claude, Gemini)

When helping with this project, you should:

1. **Understand the Context:**
   - We're building an AI sales/delivery pipeline
   - We track 6 operational pillars (not generic AI work)
   - Each agent produces structured JSON outputs

2. **Maintain Consistency:**
   - Agent outputs must be valid JSON
   - All 6 pillars must be referenced consistently
   - Keep the operator-grade, no-fluff tone

3. **Follow Patterns:**
   - Retry logic: use `withRetry()`
   - Timeouts: use `withTimeout()`
   - Validation: use Zod schemas
   - Database: use Prisma client

4. **Testing:**
   - Always test agent outputs are valid JSON
   - Verify database operations work
   - Check UI updates properly

### For Developers

**Setup:**
```bash
git clone <repo>
cd uptimize-engine
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

**Login:**
- Username: `admin`
- Password: `admin123`

**Database:**
- View: `npx prisma studio` (opens localhost:5555)
- Location: `prisma/dev.db`

---

## Key Terminology

**Shadow Ops:** Off-system work (WhatsApp, DMs, spreadsheets, memory) that doesn't get tracked in official systems.

**FVi7:** First Value in 7 Days - our onboarding protocol to deliver measurable wins quickly.

**6 Pillars:** The operational dimensions we measure to prove ROI (Shadow Ops, Exceptions, Audit Trail, Knowledge, Handoffs, Channels).

**Agent:** An AI-powered specialist (Claude-based) that produces structured deliverables.

**Pipeline:** The sequential execution of all 5 agents from lead to client success.

**Handoff Kit:** The deliverable from one agent to the next (structured JSON).

---

## Contact & Partnership

**Company:** Uptimize  
**Product:** Uptimize Engine  
**Tech Stack:** Next.js + TypeScript + Prisma + Multi-Model AI (Claude, GPT-4o, Gemini, Perplexity)  
**Target Market:** Operations-heavy businesses of any size — from solopreneurs to enterprise departments  
**Differentiation:** Agentic operations with 6-Pillar measurable proof — not software access, but outcome delivery

**Partnership Opportunities:**
- Implementation partners (agencies who deploy our solution)
- Integration partners (CRM, project management tools)
- Referral partners (consultants, operations coaches)

---

## Current Status Summary

**Works:** 19 agents across three fleets, multi-provider tier routing,
stage-gated pipeline sessions, client portal, admin portfolio dashboard,
governance enforcement, learning collection, scheduled jobs.

**Blocks production:** Postgres migration, an end-to-end run against live
providers, and a deploy target that supports the cron schedule.

**Open by design, not oversight:** learning consumption and the external tools
the permission matrix governs. Both are documented in the README with the
specific traps involved.

---

**Last Updated:** August 2026
**Status:** Wiring complete through the sub-agent, governance, learning,
scheduler and portfolio layers; production deployment outstanding.
