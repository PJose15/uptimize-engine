# Uptimize Engine - AI Assistant Brief

> **Quick Context Document** - Share this with any AI assistant to get them up to speed

---

## What This Project Is

**Uptimize Engine** = Agentic operations platform that deploys autonomous AI agents to discover, diagnose, and resolve "Shadow Operations" (invisible work happening in WhatsApp, spreadsheets, DMs, and people's heads).

**Key Insight:** SaaS is the control layer. Agents are the operators. We sell measurable outcomes, not software access.

**Tech Stack:** Next.js + TypeScript + Prisma (SQLite) + Multi-Model AI (Claude, GPT-4o, Gemini, Perplexity)

---

## Dual Product Architecture

| Layer | Purpose |
|-------|---------|
| **Internal Pipeline** (Factory) | 5-agent system: discover → diagnose → design → build → prove |
| **Deployed Agents** (Product) | Custom agents assembled from skills framework, deployed into client operations |

### The 5-Agent Internal Pipeline

1. **Market Intelligence** → Analyze leads, score fit, detect Shadow Ops signals
2. **Discovery & Diagnosis** → Audit current state, quantify pain
3. **Sales Engineering** → Design solution, create SOW, close deal  
4. **Systems Delivery** → Build workflows, configure systems
5. **Client Success (v3)** → Track adoption via 6 Pillars, drive expansion

Each agent = multi-model AI with custom system prompt → outputs structured JSON → feeds next agent via handoff envelope

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

## Governance Layer

Every agent action is permissioned, logged, and reversible.

- **Tool permissions** per agent (`lib/governance/tool-permissions.ts`)
- **Approval gates** for external writes and high-cost actions (`lib/governance/approval-gates.ts`)
- **Audit enforcement** — every action logged: who, what, when, result
- **Full policy:** `docs/governance-policy.md`

---

## Current Status

✅ **Complete:**
- All 5 agents implemented (multi-model fallback)
- Governance layer (permissions, approval gates, audit)
- Database (SQLite + Prisma)
- Production features (retry, timeout, validation, cost tracking, cancellation)
- UI (login, pipeline, history)
- Agent 5 v3 with 6-Pillar tracking

🔨 **Building:**
- Unified pipeline (state machine, handoff envelopes, idempotency)
- Multi-model task-aware routing
- Skills & prompts framework
- Deployment targets (Slack, Email, CRM)

---

## File Structure (Key Locations)

```
lib/governance/                 # Trust layer
  ├── tool-permissions.ts       # Per-agent permission matrix
  ├── approval-gates.ts         # Approval enforcement + audit
  └── index.ts

app/api/agents/run/uptimize/    # 5-agent pipeline
  ├── agent-1-market-intelligence/
  ├── agent-2-outbound-appointment/
  ├── agent-3-sales-engineer/
  ├── agent-4-systems-delivery/
  └── agent-5-client-success/ (v3 - 6 Pillars)

app/api/agents/run/
  ├── config.ts                 # Multi-model routing
  ├── fallback.ts               # Waterfall provider system
  ├── orchestrator.ts           # Main orchestrator
  ├── providers/                # Gemini, OpenAI, Anthropic, (Perplexity)
  └── mcp/                      # MCP client + research servers

app/api/pipeline/run/route.ts   # Pipeline execution

lib/
  ├── prisma.ts (DB client)
  ├── history.ts (Prisma-backed)
  ├── auth.ts, retry.ts, timeout.ts, validation.ts, costs.ts
```

---

## How to Help

When working on this project:

1. **Governance first** - Every agent action must be permissioned and auditable
2. **Keep 6-Pillar consistency** - All agents reference the same 6 pillars
3. **Maintain JSON structure** - Agent outputs must be valid, structured JSON
4. **Use established patterns:**
   - Retry: `withRetry()`
   - Timeout: `withTimeout()`
   - Validation: Zod schemas
   - Database: Prisma client
   - Permissions: `checkToolGate()`
5. **Tone:** Operator-grade, no fluff, measurable outcomes

---

## Quick Reference

**Dev Server:** `npm run dev` → http://localhost:3000  
**Login:** admin / admin123  
**Database:** `npx prisma studio` → localhost:5555  
**Location:** `c:\Users\pjaco\uptimize-engine`

**Full Details:** See `PROJECT_OVERVIEW.md` in project root  
**Governance:** See `docs/governance-policy.md`

---

**Target Market:** Operations-heavy businesses of any size — solopreneurs to enterprise  
**Problem:** Shadow Ops — targets 10-20 hours/week of recoverable invisible work per person  
**Solution:** Autonomous agents that make invisible work visible, measurable, and handled
