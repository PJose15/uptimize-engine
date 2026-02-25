# Uptimize Engine — Visual Summary

> Quick visual reference for the Uptimize Engine architecture

```
═══════════════════════════════════════════════════════════════════
                    UPTIMIZE ENGINE v2.0
             Agentic Operations Platform
═══════════════════════════════════════════════════════════════════

CORE PURPOSE
════════════

    "We deploy autonomous AI agents that discover, diagnose, and 
     resolve the invisible operational chaos — Shadow Operations —
     that bleeds time, revenue, and trust from businesses."

    Old: We build tools you use
    New: We build agents that work for you

    SaaS = Control Layer    |    Agents = Operators


ARCHITECTURE: One Engine → Pipeline → Many Outputs
═══════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│                    GOVERNANCE LAYER 🔒                       │
│  Tool Permissions → Approval Gates → Audit Log → Rollback  │
│  Every agent action: permissioned, logged, reversible       │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│              INTERNAL PIPELINE (Factory)                     │
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐               │
│  │ Agent 1  │───▶│ Agent 2  │───▶│ Agent 3  │               │
│  │ Market   │    │ Discovery│    │ Sales    │               │
│  │ Intel    │    │ Diagnosis│    │ Engineer │               │
│  └──────────┘    └──────────┘    └──────────┘               │
│       │                               │                      │
│       │    Handoff Envelopes (JSON)    │                      │
│       │    State Machine + Run IDs    │                      │
│       │                               ▼                      │
│       │              ┌──────────┐    ┌──────────┐           │
│       │              │ Agent 4  │───▶│ Agent 5  │           │
│       │              │ Systems  │    │ Client   │           │
│       └─────────────▶│ Delivery │    │ Success  │           │
│                      └──────────┘    └──────────┘           │
│                                           │                  │
│  Each step: idempotent, audited, replayable                  │
└───────────────────────────────────────────│──────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────┐
│              SKILLS FRAMEWORK (Assembly)                     │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │ Shadow Ops     │  │ Exception      │  │ ROI          │  │
│  │ Discovery      │  │ Mapping        │  │ Calculation  │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │ Proposal       │  │ System         │  │ Audit        │  │
│  │ Generation     │  │ Design         │  │ Reporting    │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
│                                                              │
│  Skills = reusable prompt + schema + validation              │
│  Compose skills into custom agents per client                │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│              DEPLOYED AGENTS (Product)                       │
│                                                              │
│  Client A: ┌───────────┐  ┌───────────┐  ┌───────────┐    │
│            │ Ops Agent │  │ CRM Agent │  │ Slack Bot │    │
│            │ (custom)  │  │ (custom)  │  │ (custom)  │    │
│            └───────────┘  └───────────┘  └───────────┘    │
│                                                              │
│  Client B: ┌───────────┐  ┌───────────┐                    │
│            │ Email     │  │ Calendar  │                    │
│            │ Agent     │  │ Agent     │                    │
│            └───────────┘  └───────────┘                    │
│                                                              │
│  Each deployed agent:                                        │
│  • Authenticated to client's tools                           │
│  • Running with client-specific permissions                  │
│  • Reporting through 6-pillar audit trails                   │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│              PROOF & AUDIT (6 Pillars)                       │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │1. Shadow │ │2. Excep- │ │3. Audit  │                    │
│  │   Ops    │ │   tions  │ │   Trail  │                    │
│  │   ↓ hrs  │ │   ↓ cnt  │ │   ↑ comp │                    │
│  └──────────┘ └──────────┘ └──────────┘                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │4. Know-  │ │5. Hand-  │ │6. Chan-  │                    │
│  │   ledge  │ │   offs   │ │   nels   │                    │
│  │   ↓ risk │ │   ↑ SLA  │ │   ↑ find │                    │
│  └──────────┘ └──────────┘ └──────────┘                    │
│                                                              │
│  Before/after metrics. Defensible. Client-visible.           │
└─────────────────────────────────────────────────────────────┘


MULTI-MODEL INTELLIGENCE
═════════════════════════

  ┌─────────────────────────────────────────────────┐
  │               ROUTER (by task requirements)      │
  │                                                  │
  │  Needs web search?      → Perplexity            │
  │  Needs deep reasoning?  → Claude                │
  │  Needs JSON compliance? → Best available        │
  │  Needs speed?           → Gemini Flash          │
  │  Needs generation?      → GPT-4o               │
  │                                                  │
  │  Adapter layer → Standard response format       │
  │  Telemetry    → Cost + latency + success        │
  │  Fallback     → Waterfall through providers     │
  └─────────────────────────────────────────────────┘


BUILD STATUS
════════════

  Phase 0: Governance           ██████████ 100%  ✅
  Phase 1: Identity Refresh     ████████░░  80%  🔨
  Phase 2: Unified Pipeline     ░░░░░░░░░░   0%  ⏳
  Phase 3: Multi-Model Routing  ░░░░░░░░░░   0%  ⏳
  Phase 4: Skills & Tools       ░░░░░░░░░░   0%  ⏳
  Phase 5: Production Ready     ░░░░░░░░░░   0%  ⏳
  Phase 6: Voice (deferred)     ░░░░░░░░░░   0%  ⏳
  Phase 7: Deployment Targets   ░░░░░░░░░░   0%  ⏳


KEY DIFFERENTIATORS
═══════════════════

❌ Generic AI Agencies Say:
   "We'll use AI to automate your workflows!"
   
✅ We Say:
   "We deploy agents that run your operations.
    They reduce Shadow Ops by 15 hours/week, 
    cut exception rate by 60%, 
    and prove it with audit trails."

❌ They measure:
   - "Tasks automated" (vague)
   - "Time saved" (unverifiable)
   
✅ We measure:
   - 6 specific operational pillars
   - Before/after metrics
   - Defensible, auditable outcomes

❌ They deliver:
   - Software access
   - Dashboards
   
✅ We deliver:
   - Agents that work
   - Measurable proof they're working
   - Governance + rollback + trust


QUICK START (for AI assistants)
════════════════════════════════

When helping with this project:
✓ Check governance (permissions + approval gates) first
✓ Maintain 6-Pillar consistency across all agents
✓ Agent outputs = structured JSON (always validate)
✓ Use established patterns (withRetry, withTimeout, Zod)
✓ Keep operator-grade tone (no fluff)
✓ Test database operations (Prisma client)

Key Files to Know:
- lib/governance/                (trust layer)
- app/api/agents/run/uptimize/   (5-agent pipeline)
- app/api/pipeline/run/route.ts  (pipeline execution)
- docs/governance-policy.md      (governance policy)
- lib/prisma.ts                  (database)


CONTACT
═══════

Project:  Uptimize Engine v2.0
Location: c:\Users\pjaco\uptimize-engine
Docs:     PROJECT_OVERVIEW.md (detailed)
          AI_ASSISTANT_BRIEF.md (concise)
          THIS FILE (visual)
Server:   npm run dev → localhost:3000
Login:    admin / admin123
Database: npx prisma studio → localhost:5555
```
