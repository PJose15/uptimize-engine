/**
 * Database Portability Helpers
 *
 * The app runs on SQLite in development and PostgreSQL in production, and the
 * two differ in ways Prisma does not paper over. These helpers keep the
 * difference in one place instead of scattered across query sites.
 */

/**
 * Whether DATABASE_URL points at PostgreSQL.
 *
 * Both `postgresql://` and `postgres://` are valid and in active use —
 * Supabase, Railway, Heroku and others hand out `postgres://`. Matching only
 * the longer form silently degrades anything keyed on this check, which is how
 * the DB-backed rate limiter could have stayed in memory on a real Postgres
 * deployment.
 */
export function isPostgres(url: string = process.env.DATABASE_URL || ''): boolean {
    return url.startsWith('postgresql://') || url.startsWith('postgres://');
}

/**
 * A case-insensitive `contains` filter for the active database.
 *
 * SQLite's LIKE is case-insensitive for ASCII by default and Prisma's SQLite
 * connector rejects `mode: 'insensitive'` outright. PostgreSQL's LIKE is
 * case-sensitive and needs the mode set explicitly. Without this, portal search
 * quietly stops matching differently-cased text the moment you migrate.
 */
export function insensitiveContains(value: string): { contains: string; mode?: 'insensitive' } {
    return isPostgres()
        ? { contains: value, mode: 'insensitive' }
        : { contains: value };
}
