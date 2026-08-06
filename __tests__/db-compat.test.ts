// @vitest-environment node
/**
 * Database portability helpers.
 *
 * Both behaviours here fail silently rather than loudly when they are wrong:
 * a missed Postgres URL leaves rate limiting in memory (per-instance, so
 * effectively absent on serverless), and a missing insensitive mode makes
 * portal search quietly stop matching text it used to find.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { isPostgres, insensitiveContains } from '@/lib/db-compat';

const ORIGINAL_URL = process.env.DATABASE_URL;

afterEach(() => {
    if (ORIGINAL_URL === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = ORIGINAL_URL;
});

describe('isPostgres', () => {
    it('recognises the postgresql:// scheme', () => {
        expect(isPostgres('postgresql://user:pw@host:5432/db')).toBe(true);
    });

    it('recognises the shorter postgres:// scheme', () => {
        // Supabase, Railway and Heroku all hand out this form; matching only
        // the longer one silently disables DB-backed rate limiting.
        expect(isPostgres('postgres://user:pw@host:5432/db')).toBe(true);
    });

    it('does not treat SQLite as Postgres', () => {
        expect(isPostgres('file:./dev.db')).toBe(false);
    });

    it('handles an unset URL without throwing', () => {
        expect(isPostgres('')).toBe(false);
    });

    it('reads DATABASE_URL when no argument is given', () => {
        process.env.DATABASE_URL = 'postgres://user:pw@host:5432/db';
        expect(isPostgres()).toBe(true);

        process.env.DATABASE_URL = 'file:./dev.db';
        expect(isPostgres()).toBe(false);
    });
});

describe('insensitiveContains', () => {
    it('sets insensitive mode on Postgres', () => {
        process.env.DATABASE_URL = 'postgresql://user:pw@host:5432/db';
        expect(insensitiveContains('acme')).toEqual({ contains: 'acme', mode: 'insensitive' });
    });

    it('omits mode on SQLite, whose connector rejects it', () => {
        process.env.DATABASE_URL = 'file:./dev.db';
        expect(insensitiveContains('acme')).toEqual({ contains: 'acme' });
    });
});
