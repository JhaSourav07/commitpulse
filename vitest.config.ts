import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: [
      'node_modules',
      '.next',
      ...(process.argv.some((arg) => arg.includes('massive-scaling'))
        ? []
        : ['**/*.massive-scaling.test.ts']),
    ],
    maxWorkers: process.env.CI ? 2 : 15,
    testTimeout: 30000,
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
