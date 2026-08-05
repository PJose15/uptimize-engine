/**
 * Next.js instrumentation hook — runs once per server start.
 * Used to fail fast on a misconfigured environment.
 */

export async function register() {
    // Edge runtime does not carry the full server env; only validate on Node.
    if (process.env.NEXT_RUNTIME !== 'nodejs') return;

    const { assertEnv } = await import('./lib/env');
    assertEnv();
}
