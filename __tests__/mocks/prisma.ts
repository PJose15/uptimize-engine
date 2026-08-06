/**
 * Default Prisma stub for offline tests.
 *
 * Most agent suites mock the provider layer and never intend to touch a
 * database — but importing an agent pulls in `lib/prisma`, which constructs a
 * PrismaClient at module load. Without a generated client that throws at
 * import, so fourteen otherwise-offline suites failed before a single test ran.
 *
 * This returns empty results for every model and method via a Proxy, so it does
 * not need updating when a model is added. A test that cares about database
 * behaviour should declare its own `vi.mock('@/lib/prisma', …)`, which takes
 * precedence over this one.
 */

/** Method name → what an empty database would return. */
function resultFor(method: string, args: unknown): unknown {
    if (method.startsWith('findMany')) return [];
    if (method.startsWith('findUnique') || method.startsWith('findFirst')) return null;
    if (method === 'count') return 0;
    if (method === 'aggregate' || method === 'groupBy') return method === 'groupBy' ? [] : {};

    // createMany / updateMany / deleteMany report affected-row counts.
    if (method.endsWith('Many')) return { count: 0 };

    // create / update / upsert echo the payload back, which is close enough to
    // real behaviour for a caller that just reads the returned row.
    if (method === 'create' || method === 'update' || method === 'upsert') {
        const data = (args as { data?: Record<string, unknown> } | undefined)?.data ?? {};
        return { id: 'stub_id', createdAt: new Date(), updatedAt: new Date(), ...data };
    }

    if (method === 'delete') return { id: 'stub_id' };

    return null;
}

const modelProxy = new Proxy({} as Record<string, unknown>, {
    get: (_target, method: string) => async (args: unknown) => resultFor(method, args),
});

export const prismaStub = new Proxy({} as Record<string, unknown>, {
    get: (_target, prop: string) => {
        // Client-level helpers rather than models.
        if (prop === '$connect' || prop === '$disconnect') return async () => {};
        if (prop === '$transaction') {
            return async (arg: unknown) =>
                Array.isArray(arg) ? Promise.all(arg) : (arg as (tx: unknown) => unknown)(prismaStub);
        }
        if (prop === 'then') return undefined; // not a thenable

        return modelProxy;
    },
});
