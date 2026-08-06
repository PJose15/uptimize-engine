import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

/**
 * Stub the Prisma client for every suite by default.
 *
 * `lib/prisma` constructs a PrismaClient at module load, which throws when no
 * client has been generated — taking down suites that never meant to touch a
 * database, before any test runs. A suite that needs real database behaviour
 * declares its own `vi.mock('@/lib/prisma', …)`, which wins over this.
 */
vi.mock('@/lib/prisma', async () => {
    const { prismaStub } = await import('./mocks/prisma');
    return { prisma: prismaStub, default: prismaStub };
});

// Cleanup after each test
afterEach(() => {
    cleanup();
});
