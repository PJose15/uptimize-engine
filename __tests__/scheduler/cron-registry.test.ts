// @vitest-environment node
/**
 * Cron registry ↔ vercel.json consistency.
 *
 * These two have to agree and there is nothing at runtime to make them: a job
 * in the registry with no vercel.json entry simply never fires, and a
 * vercel.json path with no registry entry 404s on a schedule nobody watches.
 * Both fail silently in production, which is why they are checked here.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

import { CRON_JOBS, AGENT_SCHEDULES } from '@/lib/scheduler/operational-jobs';

interface VercelConfig {
    crons?: Array<{ path: string; schedule: string }>;
}

const vercelConfig: VercelConfig = JSON.parse(
    readFileSync(join(process.cwd(), 'vercel.json'), 'utf8'),
);

const crons = vercelConfig.crons ?? [];

describe('vercel.json ↔ CRON_JOBS', () => {
    it('declares a cron for every registered job', () => {
        const scheduled = new Set(crons.map(c => c.path.replace('/api/cron/', '')));

        for (const job of Object.keys(CRON_JOBS)) {
            expect(scheduled).toContain(job);
        }
    });

    it('does not schedule a path the route cannot dispatch', () => {
        for (const cron of crons) {
            expect(cron.path.startsWith('/api/cron/')).toBe(true);
            const job = cron.path.replace('/api/cron/', '');
            expect(Object.keys(CRON_JOBS)).toContain(job);
        }
    });

    it('uses the same schedule in both places', () => {
        for (const cron of crons) {
            const job = cron.path.replace('/api/cron/', '');
            expect(cron.schedule).toBe(CRON_JOBS[job].schedule);
        }
    });
});

describe('registry shape', () => {
    it('gives every job a runnable function and a description', () => {
        for (const [name, job] of Object.entries(CRON_JOBS)) {
            expect(typeof job.run, name).toBe('function');
            expect(job.description.length, name).toBeGreaterThan(0);
        }
    });

    it('uses well-formed five-field cron expressions', () => {
        for (const [name, job] of Object.entries(CRON_JOBS)) {
            expect(job.schedule.trim().split(/\s+/), name).toHaveLength(5);
        }
    });

    it('registers every schedule declared in AGENT_SCHEDULES', () => {
        const registered = new Set(Object.values(CRON_JOBS).map(j => j.schedule));

        for (const [name, schedule] of Object.entries(AGENT_SCHEDULES)) {
            expect(registered, `${name} has a schedule but no job to run`).toContain(schedule);
        }
    });

    it('promotes collected learning, not just the weekly report', () => {
        // generateWeeklyBrief only reports on events; processLearningQueue is
        // what advances LearningEvent → AgentLearning. Without a job for it,
        // collected learning accumulates and is never promoted.
        expect(Object.keys(CRON_JOBS)).toContain('agent-8-learning-queue');
    });
});
