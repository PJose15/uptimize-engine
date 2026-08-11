# PostgreSQL Migration Runbook

Migrate the Uptimize engine from SQLite (`prisma/dev.db`) to PostgreSQL. **Destructive — read end-to-end before executing.**

---

## TL;DR

```
sqlite (current)  →  postgresql (target)
prisma/dev.db     →  Neon / Supabase / RDS / local
3 migrations      →  1 fresh init_postgres migration
```

The schema is already Postgres-friendly: no `Bytes` columns, no `@db.*` SQLite-specific type directives, no native `enum` blocks (all "enums" are `String` columns with comment hints). The only Prisma-level changes are the provider declaration and the migration lock.

---

## Pre-flight checklist

Run before touching anything.

- [ ] Working tree clean (`git status`)
- [ ] On `main` and synced (`git pull --ff-only`)
- [ ] `tsc --noEmit` returns 0 errors
- [ ] All tests green (`npx vitest run`)
- [ ] Backup `prisma/dev.db` somewhere safe: `cp prisma/dev.db prisma/dev.db.backup-$(date +%Y%m%d)`
- [ ] You know the Postgres connection string you want to use (see "Provisioning" below)
- [ ] You have `ADMIN_USERNAME` and `ADMIN_PASSWORD` (≥12 chars) ready for re-seed
- [ ] Decided on data-preservation strategy (see "Data preservation" below)

If any item fails, stop. Migration on top of unknown state is how mid-migration confusion starts.

---

## Provisioning

Pick one. None of these is locked in — you can re-point `DATABASE_URL` later.

| Option | Best for | Notes |
|---|---|---|
| **Neon** | Vercel/serverless deployment | Free tier generous. Two URLs — direct + pooler. Use **pooler URL** for `DATABASE_URL` in Vercel, **direct URL** for migrations (set as `DIRECT_URL`). |
| **Supabase** | If you also want auth/storage later | Direct URL OK. Add `?pgbouncer=true&connection_limit=1` for serverless. |
| **RDS / Cloud SQL** | Production-grade, you control everything | More setup. Need to whitelist IPs or use IAM auth. |
| **Local Docker** | Test the migration end-to-end before touching real infra | `docker run -d --name uptimize-pg -e POSTGRES_PASSWORD=dev -p 5432:5432 postgres:16`. Connection string: `postgresql://postgres:dev@localhost:5432/uptimize?schema=public`. **Recommended first run.** |

**Recommendation:** dry-run the migration locally in Docker first. If the local migration succeeds and the app boots, you have high confidence the cloud migration will too.

---

## Data preservation strategy

Pick one based on what's in `prisma/dev.db`.

### A) Fresh start (recommended for pre-prod)

If `prisma/dev.db` is mock/seed data and you don't need to preserve it, drop it. The seed script recreates the admin user and a default template. **This is the simplest path.**

### B) Export → import via JSON

If you need to preserve specific tables (e.g., `ClientConfig`, `ClientPortfolio`, accumulated `ActivityEvent` rows):

1. Before changing the provider, export targeted tables via a quick `tsx` script using the SQLite-backed Prisma client:
   ```ts
   // scripts/export-for-postgres.ts (write this yourself, throwaway)
   import { prisma } from '../lib/prisma';
   import fs from 'fs/promises';
   const dump = {
     clientConfigs: await prisma.clientConfig.findMany(),
     clientPortfolios: await prisma.clientPortfolio.findMany(),
     // ...whichever tables matter
   };
   await fs.writeFile('export.json', JSON.stringify(dump, null, 2));
   ```
2. Run the migration (steps below).
3. After the migration, write a one-shot importer that reads `export.json` and calls `prisma.X.createMany({ data, skipDuplicates: true })` for each table.

This works because the schema is identical — only the underlying engine changed. **Run in reverse FK dependency order** (Users before Sessions, ClientConfig before ClientPortfolio, etc.).

### C) pgloader

Postgres-aware tool that can read SQLite directly. Powerful but adds a dependency and a learning curve. Skip unless A and B don't fit.

---

## The migration — step by step

Stop here and complete the pre-flight checklist if you haven't.

### 1. Update the Prisma datasource provider

Edit [`prisma/schema.prisma`](../prisma/schema.prisma):

```diff
 datasource db {
-  provider = "sqlite"
+  provider = "postgresql"
   url      = env("DATABASE_URL")
 }
```

If you're using Neon's pooler in production, also add the direct URL for migrations (Prisma uses this to bypass the pooler during DDL):

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### 2. Update the migration lock

Edit [`prisma/migrations/migration_lock.toml`](../prisma/migrations/migration_lock.toml):

```diff
-provider = "sqlite"
+provider = "postgresql"
```

If you skip this, Prisma will refuse to run migrations with `Error: P3019 The datasource provider has been changed`.

### 3. Archive old SQLite migrations

The 3 existing migration files contain SQLite-flavored SQL that won't apply to Postgres. Move them out of the way rather than deleting (in case you ever need the SQLite app archaeology):

```bash
mkdir -p prisma/migrations-sqlite-archive
mv prisma/migrations/20260209181107_init prisma/migrations-sqlite-archive/
mv prisma/migrations/20260227024813_add_portal_models prisma/migrations-sqlite-archive/
mv prisma/migrations/20260409013758_v2_architecture_foundation prisma/migrations-sqlite-archive/
```

Leave `migration_lock.toml` in place (you just updated it).

### 4. Point `.env` at Postgres

Edit `.env` (and `.env.local` if you have one):

```diff
-DATABASE_URL="file:./prisma/dev.db"
+DATABASE_URL="postgresql://<user>:<password>@<host>:5432/uptimize?schema=public"
+# If using Neon pooler in production:
+# DIRECT_URL="postgresql://<user>:<password>@<host>:5432/uptimize?schema=public"
```

Common URL-suffix flags:
- `?schema=public` — standard, almost always wanted
- `?sslmode=require` — needed for most managed Postgres (Neon, Supabase, RDS)
- `?pgbouncer=true&connection_limit=1` — Supabase pooler, serverless

### 5. Generate the fresh init migration

```bash
npx prisma migrate dev --name init_postgres
```

Prisma will:
- Detect the empty Postgres database
- Generate a single new migration file at `prisma/migrations/<timestamp>_init_postgres/migration.sql` containing every model
- Apply it
- Regenerate the Prisma client

If you see `P1001 Can't reach database server` — check `DATABASE_URL`, SSL flags, and that the Postgres instance is actually up.

If you see `P3014` about shadow databases (only relevant for managed Postgres without `CREATE DATABASE` permission), add the shadow database URL:
```
SHADOW_DATABASE_URL="postgresql://...different-db.../shadow?schema=public"
```
For Neon/Supabase, the easiest workaround is using `prisma migrate deploy` after generating the migration locally against a Docker Postgres.

### 6. Seed the admin user and default template

```bash
ADMIN_USERNAME=<your-username> ADMIN_PASSWORD=<at-least-12-chars> npx prisma db seed
```

The seed script ([`prisma/seed.ts`](../prisma/seed.ts)) is idempotent — uses `upsert`. Re-running won't duplicate.

### 7. (Conditional) Import preserved data

If you chose path B in "Data preservation," run your one-shot importer now:
```bash
npx tsx scripts/import-from-export.ts
```

### 8. Re-populate ClientPortfolio if needed

If you've already run the Sprint 14.1 migration script against SQLite, the Postgres `ClientPortfolio` table will be empty. Re-run:
```bash
npx tsx scripts/migrate-to-portfolio.ts
```
The script is idempotent (skips clients that already have a portfolio row).

---

## Verification

After step 6 (or 7/8 if applicable), run these checks. **All must pass.**

### Schema integrity
```bash
npx prisma migrate status
# Expect: "Database schema is up to date!"

npx prisma db pull --print | head -50
# Sanity check: column types look like Postgres (text, integer, timestamp(3), boolean), not SQLite.
```

### Model count
```bash
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"
# Expect: 30+ tables (every model in schema.prisma + _prisma_migrations)
```

### Seed data present
```bash
psql "$DATABASE_URL" -c "SELECT username, role FROM \"User\";"
# Expect: one row matching ADMIN_USERNAME, role=admin
```

### Rate limiter detects Postgres
The rate limiter auto-switches to DB-backed mode when `DATABASE_URL` starts with `postgres`. Confirm by hitting any rate-limited endpoint and then:
```bash
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"RateLimitEntry\";"
# Expect: ≥ 1 row after a few API hits
```

### Application boot
```bash
npm run dev
# Expect: server starts on :3000, login page loads, dashboard renders, no Prisma errors in console.
```

### TypeScript still clean
```bash
npx tsc --noEmit
# Expect: 0 errors. The schema didn't change semantically, just the engine, so types are unchanged.
```

### Tests still pass
```bash
npx vitest run
# Expect: same green count as before migration. The mocked tests don't touch the DB; integration tests that do will now hit Postgres.
```

---

## Operational hygiene (production only)

### Connection pooling
Vercel / any serverless target opens a new connection per cold start. Postgres caps connections (~100 on most plans). Without a pooler you will hit `FATAL: too many connections` under load.
- **Neon:** use the pooler URL (`...pooler...neon.tech`) for `DATABASE_URL`, direct URL for `DIRECT_URL`.
- **Supabase:** use port 6543 (pgbouncer) for `DATABASE_URL`, port 5432 (direct) for `DIRECT_URL`. Append `?pgbouncer=true&connection_limit=1`.
- **Self-managed:** put PgBouncer in front (transaction mode).

### SSL
Managed Postgres requires SSL. Append `?sslmode=require` if Prisma complains. Some providers want `?sslmode=verify-full` plus a CA cert.

### Backups
Set up daily snapshots in your provider's console before relying on the new DB. Neon auto-backs-up on free tier; Supabase same. RDS needs manual snapshot policy.

### Rate-limit cleanup
Expired entries are pruned automatically when the table exceeds 1000 rows. Manual cleanup if needed:
```sql
DELETE FROM "RateLimitEntry" WHERE "resetAt" < NOW();
```

---

## Rollback

If the migration goes badly, revert is straightforward because `prisma/dev.db.backup-*` still exists:

1. Reverse step 4: `DATABASE_URL="file:./prisma/dev.db"` in `.env`
2. Reverse step 2: `provider = "sqlite"` in `migration_lock.toml`
3. Reverse step 1: `provider = "sqlite"` in `schema.prisma`
4. Restore migrations from archive:
   ```bash
   mv prisma/migrations-sqlite-archive/* prisma/migrations/
   rmdir prisma/migrations-sqlite-archive
   ```
5. Delete the half-migrated init: `rm -rf prisma/migrations/<timestamp>_init_postgres`
6. Restore the backup: `cp prisma/dev.db.backup-<date> prisma/dev.db`
7. Regenerate the client: `npx prisma generate`
8. Verify: `npx tsc --noEmit && npm run dev`

If `git diff` shows the only schema-side change is the provider, `git checkout -- prisma/` is the fastest way back.

---

## Common gotchas

| Symptom | Cause | Fix |
|---|---|---|
| `P3019 datasource provider changed` | Forgot to update `migration_lock.toml` | Step 2 |
| `P1001 Can't reach database server` | Wrong URL, SSL not configured, or host unreachable | Verify with `psql "$DATABASE_URL"` directly |
| `FATAL: too many connections` (production) | Not using pooler | See "Connection pooling" |
| `relation "User" does not exist` after migration | Postgres is case-sensitive; Prisma quotes identifiers. Code uses Prisma client (correct), but raw SQL must double-quote `"User"`, `"ClientPortfolio"`, etc. | Quote table names in any raw SQL |
| `Error: P3014` shadow database | Managed Postgres without `CREATE DATABASE` perms | Provide `SHADOW_DATABASE_URL` or migrate locally + `migrate deploy` |
| Seed says `ADMIN_USERNAME env var is required` | Forgot to set seed env vars | Step 6 — both vars, password ≥12 chars |
| Booleans behave differently in queries | SQLite uses 0/1, Postgres uses `true`/`false`. Prisma normalizes, but any raw SQL or string-coerced filters must be updated | Use Prisma client (it handles this), avoid raw SQL booleans |
| Date comparisons off by milliseconds | SQLite stores as text, Postgres as `timestamp(3)`. Round-trip serialization differs by a few ms in edge cases | Don't compare datetimes for equality — use ranges |

---

## What this runbook does NOT cover

- **Multi-tenant / row-level security**: not configured. Schema is currently single-tenant per `clientId` column. Postgres RLS is a future hardening step.
- **Read replicas**: out of scope until traffic justifies it.
- **Logical replication / zero-downtime migration from existing prod Postgres**: this runbook assumes a fresh empty Postgres target, not an existing one.

---

## Sign-off checklist

After completing all steps, confirm before declaring the migration done:

- [ ] `npx prisma migrate status` shows up-to-date
- [ ] `npx tsc --noEmit` returns 0
- [ ] `npx vitest run` returns same green count as pre-migration
- [ ] `npm run dev` boots and login works
- [ ] Admin user exists in `User` table
- [ ] All 30+ expected tables present
- [ ] `prisma/dev.db.backup-*` retained for at least 7 days before deletion
- [ ] `.env` not committed (check `git status`)
- [ ] Production `DATABASE_URL` and `DIRECT_URL` set in deployment env vars (if shipping)
- [ ] Daily backups configured in provider console (if shipping)

If every box is checked, commit the schema/lock changes and the archived old migrations as a single commit. Update `BUILD_STATUS.md` to record that 14.3 ran.
