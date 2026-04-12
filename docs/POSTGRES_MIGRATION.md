# PostgreSQL Migration Guide

## Prerequisites
- PostgreSQL 15+ instance running and accessible
- Connection string in the format: `postgresql://user:password@host:5432/uptimize?schema=public`

## Steps

### 1. Update datasource provider
In `prisma/schema.prisma`, change:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2. Set DATABASE_URL
In `.env`, replace the SQLite URL:
```
DATABASE_URL="postgresql://user:password@host:5432/uptimize?schema=public"
```

### 3. Generate migration
```bash
npx prisma migrate dev --name init-postgres
```

### 4. Seed the database
```bash
ADMIN_USERNAME=admin ADMIN_PASSWORD=your-secure-password npx prisma db seed
```

### 5. Verify rate limiting
The rate limiter automatically detects PostgreSQL via `DATABASE_URL` and switches to DB-backed mode. Confirm by checking the `RateLimitEntry` table has rows after API requests.

### 6. Clean up expired rate-limit entries
Expired entries are cleaned automatically when there are more than 1000 rows. For manual cleanup:
```sql
DELETE FROM "RateLimitEntry" WHERE "resetAt" < NOW();
```

## Rollback
To revert to SQLite, restore `DATABASE_URL="file:./prisma/dev.db"` and change the provider back to `"sqlite"`.
