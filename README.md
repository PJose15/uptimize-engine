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
