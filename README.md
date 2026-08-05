# Uptimize Engine

Agentic operations platform. A fleet of LLM agents runs Uptimize's sales and
delivery pipeline, and a multi-tenant client portal reports what those agents
did — measured against the 6-Pillar framework.

See [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) for the business context and
[UPTIMIZE-ENGINE-COMPLETE-REFERENCE.md](./UPTIMIZE-ENGINE-COMPLETE-REFERENCE.md)
for the system reference.

## Setup

```bash
npm install
cp .env.example .env      # then fill in the required values
npx prisma generate
npx prisma migrate dev
npm run dev
```

The app validates its environment at boot (`lib/env.ts`, wired through
`instrumentation.ts`) and refuses to start if a required variable is missing.

**Required:** `DATABASE_URL`, at least one AI provider key, and — in production
— `NEXTAUTH_SECRET`. Every variable is documented in
[.env.example](./.env.example).

### Seeding the admin user

```bash
npx prisma db seed
```

Reads `ADMIN_USERNAME` and `ADMIN_PASSWORD` from `.env`. The password must be
at least 12 characters; there are no default credentials.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on :3000 |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest, watch mode |
| `npm run test:run` | Vitest, single pass |
| `npm run test:agent1` … `test:agent5` | One agent's suite |
| `npx prisma studio` | Browse the database on :5555 |

Note that most of `__tests__/agents/` are **integration** tests that make live
provider calls — they fail without API keys in `.env`, and they cost money when
they pass. `__tests__/reports/` is pure unit-test coverage and runs offline.

## Agent execution paths

Agents 1–5 have two implementations, selected by `USE_SUBAGENTS`:

- **Legacy (default)** — one model call per agent, prompt-assembled from
  `(task, context)`.
- **Sub-agent (`USE_SUBAGENTS=true`)** — each agent runs two specialist
  sub-agents (e.g. `1A-research-specialist` → `1B-scoring-analyst`) composed
  sequentially, in parallel, or conditionally, with per-task model tiers from
  `lib/config/models.ts`. Every sub-agent run is recorded in `SubAgentRun`.

`app/api/agents/run/uptimize/subagent-adapters.ts` is the seam between them:
it presents the legacy `(task, context, mode)` signature either way, so call
sites do not branch. When a sub-agent path needs structured input the caller
did not supply, it logs and degrades to the legacy path rather than failing.

Reported cost follows the same split — the sub-agent path reports measured
cost, the legacy path a token-based estimate against a fixed model name.

## Governance

Any call an agent makes to a system outside this process goes through
`withGovernance()` / `enforceGovernance()` in `lib/governance/enforce.ts`. The
check happens *before* the call runs, so an action awaiting approval has not
already happened.

Three outcomes: **executed**, **denied** (policy refuses it), or
**awaiting_approval** (queued for a human, not run). Approval state lives in
the `ApprovalItem` table — the id the gate returns is the row id, so a decision
made in the portal is visible to the next attempt. Pass that id back to resume.

The permission matrix in `lib/governance/tool-permissions.ts` covers all 13
agents and denies unknown agents and unregistered tools by default. Note that
it also lists tools that have no implementation yet (`send_email`,
`create_crm_contact`, …) — those entries are policy waiting for code, and
gating them is a no-op until the tool exists.

## Scheduled jobs

Agents 8–13 run on a schedule rather than on request. `GET /api/cron/[job]`
dispatches from the `CRON_JOBS` registry in `lib/scheduler/operational-jobs.ts`;
`vercel.json` maps each schedule to a path. A test asserts the two agree —
nothing at runtime does, and a mismatch fails silently in both directions.

Requests must carry `Authorization: Bearer $CRON_SECRET`. Without the secret
set, the endpoint returns 503 and nothing runs: these jobs spend money on model
calls and write to client systems, so it fails closed rather than open. Vercel
Cron supplies the header automatically from the project env var. The same
endpoint accepts POST, so a job can be triggered by hand with the same
credential:

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
  https://<host>/api/cron/agent-13-daily-brief
```

Schedules are UTC — that is what Vercel evaluates them in. Comments in
`AGENT_SCHEDULES` give the intended America/Puerto_Rico local time; PR does not
observe DST, so these do not drift seasonally.

**Deployment note:** there are 9 jobs, one of them hourly. Vercel's Hobby plan
allows 2 cron jobs at daily granularity, so this configuration needs Pro — or
an external scheduler pointed at the same endpoints.

## Learning pipeline

Observations flow through four stages. Only the first two run today:

1. **Collect** — the pipeline route dispatches `onAgentNComplete()` for Agents
   2–5 as each finishes, writing `LearningEvent` rows. Collection is idempotent
   per `(sourceAgentId, sourceRunId)`: agent retries and Agent 3's own inline
   collector would otherwise double-count, and confidence scoring treats
   duplicates as independent corroboration.
2. **Promote** — Agent 8's worker rolls `LearningEvent` rows into
   `AgentLearning` with confidence labels and creates `LearningDistribution`
   notices. Runs daily as the `agent-8-learning-queue` cron. (Note this is
   `processLearningQueue()`, not `generateWeeklyBrief()` — the weekly brief
   only reports on events and promotes nothing.)
3. **Distribute** — `LEARNING_DISTRIBUTION_MAP` routes each learning type to
   the agents that should receive it.
4. **Consume** — **not wired.** `processPendingNotices()` has no callers, and
   every orchestrator is passed `memoryEntries: {}`.

Before wiring stage 4, note that `processPendingNotices()` marks notices
delivered as it reads them, while `buildSubAgentContext` filters memory against
`SUBAGENT_MEMORY_KEYS` — namespaced keys like `shared:money_leak_map`. Learning
keys are unnamespaced (`pillar_finding`, `effective`), so a naive wiring would
consume every notice and then discard it in the filter. Stage 4 needs a
learning-type → memory-key mapping first.

## Architecture

- `app/api/agents/run/uptimize/` — pipeline agents 1–8
- `app/api/agents/run/operational/` — operational agents 9–13 (cron-driven)
- `app/api/agents/run/internal/` — internal venture agents (SmartGym, PVision)
- `app/api/pipeline/` — SSE pipeline execution, sessions, stage gates
- `app/portal/` + `app/api/portal/` — client-facing portal
- `lib/subagent/` — sub-agent composition patterns (sequential/parallel/conditional)
- `lib/governance/` — tool permissions and approval gates
- `lib/learning/` — cross-run learning collection and distribution
- `lib/config/models.ts` — model tiers, task profiles, fallback chains, pricing

## Security notes

- Page routes are guarded by `middleware.ts`, which only checks that a session
  cookie is **present** — the edge runtime cannot reach the database.
- API routes must therefore authorize themselves, using `requireSession()` or
  `getSessionFromRequest()` from `lib/api-auth.ts`. Adding a route to the
  middleware list does not protect it.
- `POST /api/webhooks/trigger` is closed (503) until `WEBHOOK_API_KEY` is set.
  There is no default key.
