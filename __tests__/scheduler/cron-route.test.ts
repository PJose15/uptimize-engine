// @vitest-environment node
/**
 * Cron route authorization.
 *
 * These endpoints spend money on model calls and write to client systems, so
 * the guard is the whole security boundary — there is no session behind it.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const runs: string[] = [];

vi.mock('@/lib/scheduler/operational-jobs', () => ({
    CRON_JOBS: {
        'test-job': {
            schedule: '0 0 * * *',
            description: 'test',
            run: vi.fn(async () => { runs.push('test-job'); }),
        },
        'failing-job': {
            schedule: '0 0 * * *',
            description: 'fails',
            run: vi.fn(async () => { throw new Error('job blew up'); }),
        },
    },
}));

import { GET, POST } from '@/app/api/cron/[job]/route';

const ORIGINAL_SECRET = process.env.CRON_SECRET;

function request(headers: Record<string, string> = {}) {
    return new Request('http://localhost/api/cron/test-job', { headers }) as never;
}

const params = (job: string) => ({ params: Promise.resolve({ job }) });

beforeEach(() => {
    runs.length = 0;
    process.env.CRON_SECRET = 'super-secret-value';
});

afterEach(() => {
    if (ORIGINAL_SECRET === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = ORIGINAL_SECRET;
});

describe('authorization', () => {
    it('runs the job with the right bearer token', async () => {
        const res = await GET(request({ authorization: 'Bearer super-secret-value' }), params('test-job'));

        expect(res.status).toBe(200);
        expect(await res.json()).toMatchObject({ success: true, job: 'test-job' });
        expect(runs).toEqual(['test-job']);
    });

    it('rejects a missing token without running anything', async () => {
        const res = await GET(request(), params('test-job'));

        expect(res.status).toBe(401);
        expect(runs).toEqual([]);
    });

    it('rejects a wrong token without running anything', async () => {
        const res = await GET(request({ authorization: 'Bearer wrong-value-here' }), params('test-job'));

        expect(res.status).toBe(401);
        expect(runs).toEqual([]);
    });

    it('rejects a token passed without the Bearer scheme', async () => {
        const res = await GET(request({ authorization: 'super-secret-value' }), params('test-job'));

        expect(res.status).toBe(401);
        expect(runs).toEqual([]);
    });

    it('closes the endpoint entirely when no secret is configured', async () => {
        delete process.env.CRON_SECRET;

        const res = await GET(request({ authorization: 'Bearer anything' }), params('test-job'));

        expect(res.status).toBe(503);
        expect(runs).toEqual([]);
    });

    it('accepts POST for manual triggering, with the same guard', async () => {
        const denied = await POST(request(), params('test-job'));
        expect(denied.status).toBe(401);

        const allowed = await POST(request({ authorization: 'Bearer super-secret-value' }), params('test-job'));
        expect(allowed.status).toBe(200);
        expect(runs).toEqual(['test-job']);
    });
});

describe('dispatch', () => {
    it('404s an unknown job and lists what it can run', async () => {
        const res = await GET(request({ authorization: 'Bearer super-secret-value' }), params('nope'));

        expect(res.status).toBe(404);
        expect(await res.json()).toMatchObject({ available: ['test-job', 'failing-job'] });
    });

    it('checks authorization before it looks the job up', async () => {
        // An unauthenticated caller must not be able to enumerate job names.
        const res = await GET(request(), params('nope'));
        expect(res.status).toBe(401);
    });

    it('surfaces a failing job as a 500 so the scheduler records the failure', async () => {
        const res = await GET(request({ authorization: 'Bearer super-secret-value' }), params('failing-job'));

        expect(res.status).toBe(500);
        expect(await res.json()).toMatchObject({ success: false, error: 'job blew up' });
    });
});
