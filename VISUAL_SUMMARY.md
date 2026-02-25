# Uptimize Engine - Visual Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    UPTIMIZE ENGINE                          │
│         AI Sales & Delivery Pipeline Platform               │
└─────────────────────────────────────────────────────────────┘

WHAT WE DO
══════════
Eliminate "Shadow Operations" - the invisible work happening in:
  📱 WhatsApp groups
  📝 Spreadsheets  
  💬 DMs
  🧠 People's heads

SOLUTION: AI-powered pipeline that makes invisible work VISIBLE + MEASURABLE


THE 5-AGENT PIPELINE
══════════════════════

  📊 AGENT 1: Market Intelligence
     ↓ Input: Raw leads
     ↓ Output: Scored leads + Shadow Ops signals
     
  🔍 AGENT 2: Discovery & Diagnosis  
     ↓ Input: Qualified lead
     ↓ Output: Current state audit + pain quantification
     
  🎯 AGENT 3: Sales Engineering
     ↓ Input: Diagnosis
     ↓ Output: Solution design + SOW + Proposal
     
  🛠️  AGENT 4: Systems Delivery
     ↓ Input: Signed SOW
     ↓ Output: Configured workflows + Handoff kit
     
  📈 AGENT 5: Client Success (v3)
     ↓ Input: Deployed system
     ↓ Output: Weekly wins + 6-Pillar metrics + Expansion plan


THE 6 PILLARS (Our Secret Sauce)
══════════════════════════════════

┌──────────────────────────────────────────────────────────┐
│ PILLAR 1: SHADOW OPS REDUCTION                           │
│ ├─ Metric: Hours saved per week                          │
│ ├─ Metric: Tasks automated                               │
│ └─ Metric: Channels consolidated                         │
├──────────────────────────────────────────────────────────┤
│ PILLAR 2: EXCEPTION HANDLING                             │
│ ├─ Metric: Exception count (down ↓)                      │
│ ├─ Metric: Auto-handle rate (up ↑)                       │
│ └─ Metric: Avg resolution time (down ↓)                  │
├──────────────────────────────────────────────────────────┤
│ PILLAR 3: AUDIT TRAIL COMPLETENESS                       │
│ ├─ Metric: Audit completeness %                          │
│ ├─ Metric: Disputes won                                  │
│ └─ Metric: Compliance score                              │
├──────────────────────────────────────────────────────────┤
│ PILLAR 4: KNOWLEDGE & DECISIONS                          │
│ ├─ Metric: Decisions documented %                        │
│ ├─ Metric: Approval time (down ↓)                        │
│ └─ Metric: Escalations (down ↓)                          │
├──────────────────────────────────────────────────────────┤
│ PILLAR 5: HANDOFFS & SLAs                                │
│ ├─ Metric: SLA hit rate (up ↑)                           │
│ ├─ Metric: Handoff time (down ↓)                         │
│ └─ Metric: Stuck cases (down ↓)                          │
├──────────────────────────────────────────────────────────┤
│ PILLAR 6: CHANNELS & EVIDENCE                            │
│ ├─ Metric: Evidence capture rate (up ↑)                  │
│ ├─ Metric: Shadow channel incidents (down ↓)             │
│ └─ Metric: Findability score                             │
└──────────────────────────────────────────────────────────┘


TECH ARCHITECTURE
═════════════════

Frontend: Next.js 15 + React 19 + TypeScript + TailwindCSS
Backend:  Next.js API Routes + SQLite (Prisma)
AI:       Anthropic Claude (5 specialized agents)
Features: Retry, Timeout, Validation, Cost Tracking, SSE

┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ↓
┌─────────────────────────────────────────┐
│         Next.js Frontend (UI)           │
│  ├─ Login                               │
│  ├─ Dashboard                           │
│  ├─ Pipeline (run & monitor)            │
│  └─ History                             │
└──────┬──────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────┐
│    API Routes (Backend)                  │
│  ├─ /api/pipeline/run (SSE streaming)    │
│  ├─ /api/pipeline/cancel                 │
│  ├─ /api/auth                            │
│  └─ /api/history                         │
└──────┬───────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────┐
│  5 AI Agents (Sequential Execution)      │
│  Each agent:                             │
│    1. Receives input JSON                │
│    2. Calls Claude API                   │
│    3. Returns structured JSON            │
│    4. Feeds next agent                   │
└──────┬───────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────┐
│  SQLite Database (Prisma ORM)            │
│  ├─ User (admin seeded)                  │
│  ├─ Session (persistent auth)            │
│  ├─ PipelineRun (history)                │
│  ├─ Template                             │
│  └─ Setting                              │
└──────────────────────────────────────────┘


WHO WE SERVE
════════════

Primary:  Operations Directors, Heads of Sales Ops, VPs of Ops
Size:     50-500 employee companies
Revenue:  $5M-$50M
Pain:     "We lose 10-20 hours/week to invisible manual work"


WHAT'S BUILT ✅
═══════════════

[████████████████████████████] 95% Complete

✅ All 5 agents (Market Intel → Client Success)
✅ Database (SQLite + Prisma)
✅ Authentication (persistent sessions)
✅ Pipeline execution (SSE streaming)
✅ Production features:
   ✅ Retry logic
   ✅ Timeouts
   ✅ Validation
   ✅ Cost tracking
   ✅ Cancellation
   ✅ History auto-save
✅ UI (login, dashboard, pipeline, history)
✅ Agent 5 v3 (6-Pillar tracking)


WHAT'S LEFT ⚠️
══════════════

[█░░░░░░░░░░░░░░░░░░░░░░░░░] 5% Remaining

⚠️ Manual testing checklist
⚠️ Production deployment
⚠️ First client onboarding
⚠️ Settings UI (optional)
⚠️ Analytics dashboard (optional)


NEXT STEPS
══════════

1. Complete manual testing
2. Deploy to production (Vercel/Railway)
3. Onboard pilot client
4. Iterate based on feedback
5. Scale to 10 clients


KEY DIFFERENTIATORS
═══════════════════

❌ Generic AI Agencies Say:
   "We'll use AI to automate your workflows!"
   
✅ We Say:
   "We'll reduce Shadow Ops by 15 hours/week, 
    cut exception rate by 60%, 
    and prove it with audit trails."

❌ They measure:
   - "Tasks automated" (vague)
   - "Time saved" (unverifiable)
   
✅ We measure:
   - 6 specific operational pillars
   - Before/after metrics
   - Defensible outcomes


QUICK START (for AI assistants)
════════════════════════════════

When helping with this project:
✓ Maintain 6-Pillar consistency across all agents
✓ Agent outputs = structured JSON (always validate)
✓ Use established patterns (withRetry, withTimeout, Zod)
✓ Keep operator-grade tone (no fluff)
✓ Test database operations (Prisma client)

Key Files to Know:
- app/api/agents/run/uptimize/agent-5-client-success/agent.ts (latest: v3)
- app/api/pipeline/run/route.ts (main execution)
- lib/prisma.ts (database)
- prisma/schema.prisma (schema)


CONTACT
═══════

Project:  Uptimize Engine
Location: c:\Users\pjaco\uptimize-engine
Docs:     PROJECT_OVERVIEW.md (detailed)
          AI_ASSISTANT_BRIEF.md (concise)
          THIS FILE (visual)
Server:   npm run dev → localhost:3000
Login:    admin / admin123
Database: npx prisma studio → localhost:5555
```
