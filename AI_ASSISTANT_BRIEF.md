# Uptimize Engine - AI Assistant Brief

> **Quick Context Document** - Share this with any AI assistant to get them up to speed

---

## What This Project Is

**Uptimize Engine** = AI-powered sales & delivery pipeline that eliminates "Shadow Operations" (invisible work happening in WhatsApp, spreadsheets, DMs, and people's heads).

**Tech Stack:** Next.js + TypeScript + Prisma (SQLite) + Claude AI

---

## The 5-Agent Pipeline

We run leads through 5 sequential AI agents:

1. **Market Intelligence** → Analyze leads, score fit, detect Shadow Ops signals
2. **Discovery & Diagnosis** → Audit current state, quantify pain
3. **Sales Engineering** → Design solution, create SOW, close deal  
4. **Systems Delivery** → Build workflows, configure systems
5. **Client Success (v3)** → Track adoption via 6 Pillars, drive expansion

Each agent = Claude with custom system prompt → outputs structured JSON → feeds next agent

---

## Our Differentiator: The 6 Pillars

We prove ROI by measuring improvement across **6 operational pillars:**

1. **Shadow Ops Reduction** - Hours saved by automating off-system work
2. **Exception Handling** - Exception count down, auto-handle rate up
3. **Audit Trail** - Completeness %, disputes won, compliance
4. **Knowledge & Decisions** - Decisions documented, approval time down
5. **Handoffs & SLAs** - SLA hit rate, handoff time, stuck cases
6. **Channels & Evidence** - Evidence capture rate, findability

---

## Current Status

✅ **Complete:**
- All 5 agents implemented
- Database (SQLite + Prisma)
- Production features (retry, timeout, validation, cost tracking, cancellation)
- UI (login, pipeline, history)
- Agent 5 v3 with 6-Pillar tracking

⚠️ **Needs Testing:**
- Manual testing checklist
- Production deployment
- First client onboarding

---

## File Structure (Key Locations)

```
app/api/agents/run/uptimize/
  ├── agent-1-market-intelligence/
  ├── agent-2-discovery-diagnosis/
  ├── agent-3-sales-engineer/
  ├── agent-4-systems-delivery/
  └── agent-5-client-success/ (v3 - 6 Pillars)

app/api/pipeline/run/route.ts (main execution)

lib/
  ├── prisma.ts (DB client)
  ├── history.ts (Prisma-backed)
  ├── auth.ts (Prisma-backed)
  ├── retry.ts, timeout.ts, validation.ts, costs.ts

prisma/
  ├── schema.prisma (User, Session, PipelineRun, Template, Setting)
  └── dev.db (SQLite database)
```

---

## How to Help

When working on this project:

1. **Keep 6-Pillar consistency** - All agents reference the same 6 pillars
2. **Maintain JSON structure** - Agent outputs must be valid, structured JSON
3. **Use established patterns:**
   - Retry: `withRetry()`
   - Timeout: `withTimeout()`  
   - Validation: Zod schemas
   - Database: Prisma client
4. **Tone:** Operator-grade, no fluff, measurable outcomes

---

## Quick Reference

**Dev Server:** `npm run dev` → http://localhost:3000  
**Login:** admin / admin123  
**Database:** `npx prisma studio` → localhost:5555  
**Location:** `c:\Users\pjaco\uptimize-engine`

**Full Details:** See `PROJECT_OVERVIEW.md` in project root

---

**Target Market:** Mid-market operations leaders (50-500 employees)  
**Problem:** Shadow Ops costing 10-20 hours/week per person  
**Solution:** AI pipeline that makes invisible work visible + measurable

