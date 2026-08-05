# Debug scripts

Ad-hoc scripts kept from development: provider connectivity checks, model
listings, one-off pipeline runs, Google Sheets probes.

These are **not** part of the build or the test suite. They are excluded from
`tsconfig.json`, so they do not affect `npm run build` or `npx tsc --noEmit`.
Several make live API calls and cost money when run.

Run one with:

```bash
npx tsx scripts/debug/<script>.ts     # or: node scripts/debug/<script>.js
```

They expect a populated `.env` at the repo root and were written against the
code as it stood when each was added — some may reference functions that have
since moved. Treat them as starting points, not maintained tooling.

The real test suite is `__tests__/` (`npm run test:run`); the migration script
in `scripts/` is maintained.
