import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Integration tier — live provider calls.
 *
 * These suites hit real APIs: they need keys in .env and they cost money per
 * run. Kept out of the default config so a failing `npm run test:run` means a
 * genuine regression rather than an unconfigured environment.
 *
 *   npm run test:integration
 */
export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./__tests__/setup.ts'],
        include: ['__tests__/**/*.integration.test.ts'],
        testTimeout: 180000, // 3 minutes for real API calls
        hookTimeout: 60000,
        sequence: {
            concurrent: false, // Run sequentially to avoid provider rate limits
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './'),
        },
    },
});
