import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./__tests__/setup.ts'],
        // Offline tier by default: no network, no database, no API keys.
        // The *.integration.test.ts suites make live provider calls that cost
        // money and fail without keys — they are opt-in via `npm run
        // test:integration`, so that a red default run means a real regression
        // rather than a missing credential.
        include: ['__tests__/**/*.test.ts', '__tests__/**/*.test.tsx'],
        exclude: ['**/node_modules/**', '**/*.integration.test.ts'],
        testTimeout: 20000,
        hookTimeout: 20000,
        sequence: {
            concurrent: false, // Run sequentially to avoid rate limiting
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './'),
        },
    },
});
