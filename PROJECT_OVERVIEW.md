# Uptimize Engine - Complete Project Overview

> **Master Brief for AI Assistants**  
> Last Updated: February 10, 2026  
> Version: 1.0

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

**Uptimize** is an AI-powered operations automation company that eliminates "Shadow Operations" - the invisible, off-system work that happens in WhatsApp, spreadsheets, DMs, and people's heads,chaos spreaded workflows.

**Our Mission:** Make operational chaos visible, measurable, and fixable through systematic AI automation.

**Our Differentiator:** We don't just automate workflows - we **prove value** through 6 measurable operational pillars that traditional AI agencies ignore.

---

## What We Do

We deliver **end-to-end operational transformation** through a 5-agent AI sales and delivery pipeline:

### The 5-Agent Pipeline

| Agent | Name | Purpose |
|-------|------|---------|
| **Agent 1** | Market Intelligence | Analyze leads, score by fit, identify Shadow Ops signals |
| **Agent 2** | Discovery & Diagnosis | Run audit, map current state, quantify pain |
| **Agent 3** | Sales Engineering | Design solution, create SOW/proposal, close deal |
| **Agent 4** | Systems Delivery | Build workflows, configure systems, deploy solution |
| **Agent 5** | Client Success | Track adoption, prove ROI, drive expansion |

Each agent is an AI-powered specialist that produces **structured deliverables** (JSON outputs) that feed into the next agent.

---

## Who We Serve

### Primary Target Market
**Operations leaders at mid-market companies (50-500 employees) who are:**
- Drowning in manual work that doesn't get tracked
- Losing money to "Shadow Ops" (WhatsApp follow-ups, spreadsheet hell, tribal knowledge)
- Struggling with exceptions that break workflows
- Unable to prove what happened (no audit trail)

### Ideal Customer Profile (ICP)
- **Title:** Operations Director, Head of Sales Ops, VP Operations, COO
- **Company Size:** 50-500 employees
- **Revenue:** $5M-$50M
- **Pain Points:**
  - "We spend hours every day on manual follow-ups"
  - "Work disappears into DMs and WhatsApp groups"
  - "We can't prove what happened when disputes arise"
  - "Exceptions break our processes constantly"

### Secondary Markets
- Sales teams managing 500+ leads/month
- Customer success teams with complex onboarding
- Service delivery teams with high ticket volume
- Partnership/influencer relationship managers

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
- 10-20 hours/week per person on invisible manual work
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

**Frontend:**
- Next.js 15.1.6 (App Router)
- React 19
- TypeScript
- TailwindCSS
- Shadcn UI components

**Backend:**
- Next.js API routes
- Server-sent events (SSE) for live updates
- SQLite database (via Prisma)

**Database:**
- Prisma ORM v5.22.0
- SQLite (single file: `prisma/dev.db`)
- Models: User, Session, PipelineRun, Template, Setting

**AI Integration:**
- Anthropic Claude (primary)
- Each agent uses Claude with custom system prompts
- Structured JSON outputs with validation

**Key Features:**
- ✅ Retry logic (2 attempts per agent)
- ✅ Timeout handling (2-3 min per agent)
- ✅ Input/output validation (Zod schemas)
- ✅ Cost tracking (live display)
- ✅ Run IDs (unique identifiers)
- ✅ Cancellation support
- ✅ History saving (auto-persist to DB)
- ✅ Rate limiting

### Architecture Diagram

```
User → Login → Dashboard → Pipeline Page
                              ↓
                    POST /api/pipeline/run
                              ↓
                    ┌─────────────────┐
                    │ Pipeline Router │
                    │  (with SSE)     │
                    └─────────────────┘
                              ↓
            ┌─────────────────────────────┐
            │  5 Agents Run Sequentially  │
            ├─────────────────────────────┤
            │ 1. Market Intelligence      │
            │ 2. Discovery & Diagnosis    │
            │ 3. Sales Engineering        │
            │ 4. Systems Delivery         │
            │ 5. Client Success (v3)      │
            └─────────────────────────────┘
                              ↓
                      Save to Database
                              ↓
                    History Page (view runs)
```

### File Structure

```
uptimize-engine/
├── app/
│   ├── api/
│   │   ├── agents/run/uptimize/
│   │   │   ├── agent-1-market-intelligence/
│   │   │   ├── agent-2-discovery-diagnosis/
│   │   │   ├── agent-3-sales-engineer/
│   │   │   ├── agent-4-systems-delivery/
│   │   │   └── agent-5-client-success/ (v3 - 6 Pillars)
│   │   ├── pipeline/
│   │   │   ├── run/route.ts (main execution)
│   │   │   └── cancel/route.ts
│   │   └── auth/
│   ├── pipeline/page.tsx (UI)
│   ├── history/page.tsx
│   └── login/page.tsx
├── lib/
│   ├── prisma.ts (DB client)
│   ├── history.ts (Prisma-backed)
│   ├── auth.ts (Prisma-backed)
│   ├── retry.ts
│   ├── timeout.ts
│   ├── validation.ts
│   ├── costs.ts
│   └── rate-limit.ts
├── prisma/
│   ├── schema.prisma (5 models)
│   ├── seed.ts
│   └── dev.db (SQLite database)
└── components/
    └── ui/ (Shadcn components)
```

---

## What's Built (Current Status)

### ✅ Core Infrastructure (100% Complete)

**Authentication & Security:**
- Login system with persistent sessions
- Database-backed user/session management
- Protected route middleware
- Admin user seeded (username: admin)

**Database Layer:**
- SQLite database with Prisma
- 5 models: User, Session, PipelineRun, Template, Setting
- Migration scripts
- Seed data

**Pipeline Execution:**
- 5-agent sequential pipeline
- Server-sent events (SSE) for live updates
- Retry logic (2 attempts per agent)
- Timeout handling (AbortController)
- Cost estimation and tracking
- Run ID generation
- Cancellation support
- Input/output validation
- Auto-save to database

**UI Components:**
- Login page
- Dashboard (overview)
- Pipeline page (run & monitor)
- History page (past runs)
- Live cost display
- Cancel button
- Progress indicators

### ✅ Agent Implementation (100% Complete)

**All 5 Agents Fully Built:**

1. **Agent 1: Market Intelligence** ✅
   - Lead analysis and scoring
   - Shadow Ops signal detection
   - Multi-lead batch processing

2. **Agent 2: Discovery & Diagnosis** ✅
   - Current state audit
   - Pain quantification
   - Gap analysis

3. **Agent 3: Sales Engineering** ✅
   - Solution design
   - SOW/proposal generation
   - 6-Pillar baseline metrics

4. **Agent 4: Systems Delivery** ✅
   - Workflow configuration
   - System integration
   - Handoff kit creation

5. **Agent 5: Client Success (v3)** ✅
   - **Latest Version: 6-Pillar Tracking Edition**
   - Onboarding (FVi7 protocol: First Value in 7 Days)
   - Weekly win reports (pillar-by-pillar)
   - Adoption tracking (all 6 pillars)
   - Expansion opportunities
   - Health scoring (per-pillar + overall)

### ✅ Production-Ready Features (100% Complete)

| Feature | Status | Implementation |
|---------|--------|----------------|
| Retry Logic | ✅ | `withRetry()` in `lib/retry.ts` |
| Timeout Handling | ✅ | `withTimeout()` in `lib/timeout.ts` |
| Input Validation | ✅ | Zod schemas in `lib/validation.ts` |
| Output Validation | ✅ | Agent-specific schemas |
| Cost Tracking | ✅ | `estimateCost()` in `lib/costs.ts` |
| Run IDs | ✅ | `generateRunId()` in `lib/history.ts` |
| Cancellation | ✅ | `/api/pipeline/cancel` |
| History Saving | ✅ | Auto-persist to SQLite |
| Rate Limiting | ✅ | Sliding window in `lib/rate-limit.ts` |
| Live UI Updates | ✅ | SSE streaming |

### 📊 Current Metrics

- **Lines of Code:** ~15,000+ (TypeScript)
- **Database:** SQLite (single file)
- **API Endpoints:** 12+
- **UI Pages:** 5 (login, dashboard, pipeline, history, settings)
- **Agents:** 5 (fully implemented)
- **Pillars Tracked:** 6 (comprehensive metrics)

---

## What's Left to Build

### 🚧 High Priority (Production Blockers)

1. **Environment Variables**
   - [ ] Add `.env.example` template
   - [ ] Document required API keys
   - [ ] Add validation for missing keys

2. **Error Handling**
   - [ ] Centralized error boundary
   - [ ] Better error messages to users
   - [ ] Sentry/logging integration

3. **Testing**
   - [ ] Manual testing checklist completed
   - [ ] Basic E2E test suite
   - [ ] Agent output validation tests

4. **Deployment**
   - [ ] Production deployment guide
   - [ ] Environment setup (Vercel/Railway/etc)
   - [ ] Database backup strategy

### 🔨 Medium Priority (Polish & UX)

5. **UI Enhancements**
   - [ ] Settings page (API key management)
   - [ ] History filtering/search
   - [ ] Export pipeline results (CSV/PDF)
   - [ ] Dark mode support

6. **Agent Improvements**
   - [ ] Agent configuration UI
   - [ ] Custom prompts per client
   - [ ] Template library management

7. **Analytics**
   - [ ] Pipeline success metrics
   - [ ] Cost analytics dashboard
   - [ ] Agent performance tracking

### 🎯 Low Priority (Future Enhancements)

8. **Multi-tenancy**
   - [ ] Organization/team support
   - [ ] Role-based access control
   - [ ] Per-team agent configs

9. **Integrations**
   - [ ] CRM webhooks (HubSpot, Salesforce)
   - [ ] Slack notifications
   - [ ] Calendar integrations

10. **Advanced Features**
    - [ ] Agent A/B testing
    - [ ] Custom workflow builder
    - [ ] White-label version

---

## Development Roadmap

### Phase 1: MVP Launch (Current - Q1 2026)
**Goal:** Get first 3 paying clients

- [x] Core pipeline (5 agents)
- [x] Database integration
- [x] Production features (retry, timeout, etc)
- [ ] Manual testing complete
- [ ] Deploy to production
- [ ] Onboard first clients

### Phase 2: Scale & Refine (Q2 2026)
**Goal:** 10 paying clients, proven ROI

- [ ] Settings/config UI
- [ ] Advanced error handling
- [ ] Analytics dashboard
- [ ] Export capabilities
- [ ] Template library

### Phase 3: Platform (Q3-Q4 2026)
**Goal:** 50+ clients, multi-tenant SaaS

- [ ] Multi-tenant architecture
- [ ] White-label option
- [ ] Custom workflow builder
- [ ] Marketplace (agent templates)
- [ ] Partner program

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
**Tech Stack:** Next.js + TypeScript + Prisma + Claude AI  
**Target Market:** Mid-market operations leaders (50-500 employees)  
**Differentiation:** 6-Pillar measurable outcomes (not generic AI)

**Partnership Opportunities:**
- Implementation partners (agencies who deploy our solution)
- Integration partners (CRM, project management tools)
- Referral partners (consultants, operations coaches)

---

## Current Status Summary

✅ **What Works:**
- All 5 agents fully implemented
- Database integration complete
- Production features deployed
- UI functional (login, pipeline, history)
- Agent 5 upgraded to v3 (6-Pillar tracking)

⚠️ **What's Needed:**
- Manual testing complete
- Production deployment
- First client onboarded

🎯 **Next Steps:**
1. Complete manual testing checklist
2. Deploy to production (Vercel/Railway)
3. Document API keys and setup
4. Onboard first pilot client
5. Iterate based on feedback

---

**Last Updated:** February 10, 2026  
**Version:** 1.0  
**Status:** Production-ready, awaiting deployment
