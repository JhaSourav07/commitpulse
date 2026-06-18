import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // 1. Add aliases for next/server mapping
    alias: {
      'next/server': path.resolve(__dirname, './node_modules/next/server.js'),
      '@/': path.resolve(__dirname, './'), // Keeps your absolute paths working
    },
    server: {
      deps: {
        // 2. Force Vitest to inline next-auth so it respects the node resolution
        inline: ['next-auth'],
      },
    },
    // ... rest of your existing test config (environment: 'jsdom', etc.)
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: [
      'node_modules',
      '.next',
      ...(process.argv.some((arg) => arg.includes('massive-scaling'))
        ? []
        : ['**/*.massive-scaling.test.ts', '**/*.massive-scaling.test.tsx']),
    ],
    maxWorkers: process.env.CI ? 2 : 4,
    testTimeout: 30000,
    pool: 'forks',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        statements: 50,
        branches: 50,
        functions: 50,
        lines: 50,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      'server-only': path.resolve(__dirname, './__mocks__/server-only.js'),
    },
  },
});
