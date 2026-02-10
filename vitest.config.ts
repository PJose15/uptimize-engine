import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./__tests__/setup.ts'],
        include: ['__tests__/**/*.test.ts', '__tests__/**/*.test.tsx'],
        testTimeout: 180000, // 3 minutes for real API calls
        hookTimeout: 60000,
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
