# PostgreSQL Migration Guide

SQLite is fine for local development but will not survive a serverless deploy —
each function instance gets its own filesystem, so writes are lost and
concurrent access corrupts. Postgres is required before production.

## Prerequisites

- PostgreSQL 15+ reachable from wherever the app runs
- A connection string: `postgresql://user:password@host:5432/uptimize?schema=public`
- A backup of `prisma/dev.db` if any development data matters

## Steps

### 1. Archive the SQLite migration history

**Do this first.** The three existing migrations in `prisma/migrations/` are
SQLite SQL — `DATETIME` columns, inline `TEXT ... PRIMARY KEY`. Running
`prisma migrate dev` against Postgres with that history present fails, because
Prisma replays the recorded migrations and Postgres rejects the dialect.

```bash
mv prisma/migrations prisma/migrations-sqlite-archive
```

Keep the archive: it is the only record of how the SQLite database was built,
and rollback needs it.

### 2. Switch the datasource

In `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

No model changes are needed. The schema stores JSON as `String` throughout and
uses no native enums, `@db.` annotations, `Decimal` or `Bytes`, so every model
is portable as written.

### 3. Point DATABASE_URL at Postgres

```
DATABASE_URL="postgresql://user:password@host:5432/uptimize?schema=public"
```

Both `postgresql://` and `postgres://` are accepted — `lib/db-compat.ts`
recognises either, and behaviour keyed on the database type (DB-backed rate
limiting, case-insensitive search) switches on that check.

### 4. Generate a fresh initial migration

```bash
npx prisma generate
npx prisma migrate dev --name init_postgres
```

This produces one migration representing the current schema, rather than
replaying SQLite history.

### 5. Seed

```bash
ADMIN_USERNAME=admin ADMIN_PASSWORD='<at least 12 characters>' npx prisma db seed
```

There are no default credentials; the seed refuses to run without these.

### 6. Verify

```bash
npx tsx scripts/smoke-test.ts
```

Checks the wiring that has never executed against a real database — approval
round trip and action scoping, SubAgentRun writes, the learning-memory query,
portfolio loading, and whether the cron endpoint is open. Read-only apart from
rows it creates and removes itself; makes no provider calls.

Then check the behaviours that differ between the two engines:

| Check | How | Why it matters |
|-------|-----|----------------|
| Rate limiting is DB-backed | Make a few API calls, confirm `RateLimitEntry` has rows | In-memory limiting is per-instance; on serverless that means effectively no limit |
| Portal search is case-insensitive | Search the activity log for a differently-cased term | Postgres `LIKE` is case-sensitive where SQLite's is not |
| Approvals survive a restart | Queue an approval, redeploy, confirm it is still pending | Approval state must outlive the process for the portal decision to reach the agent |
| Sub-agent runs are recorded | Run a pipeline with `USE_SUBAGENTS=true`, check `SubAgentRun` | Nothing populated this table before; it is the basis for model-performance learning |

### 7. Migrating existing data (optional)

If development data is worth keeping, export per table from SQLite and import
into Postgres — there are no incompatible column types, so a straight
table-by-table copy works. Order matters for foreign keys: `User` before
`Session`, `ClientConfig` before `ClientPortfolio`, `PipelineSession` before
`PipelineRun` and `SubAgentRun`, `AgentLearning` before `LearningDistribution`.

For a fresh production deployment, skip this and start clean.

## Rollback

```bash
rm -rf prisma/migrations
mv prisma/migrations-sqlite-archive prisma/migrations
```

Set `provider = "sqlite"` and `DATABASE_URL="file:./dev.db"`, then
`npx prisma generate`.

## Known differences already handled in code

- `lib/db-compat.ts` — engine detection and case-insensitive `contains`.
  Prisma's SQLite connector rejects `mode: 'insensitive'` outright, so it is
  applied only on Postgres.
- `lib/rate-limit.ts` — selects the DB-backed limiter via the same check.

If you add a query using `contains`, use `insensitiveContains()` rather than a
bare filter, or search will behave differently across the two engines.
