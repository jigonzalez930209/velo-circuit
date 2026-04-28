import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    pool: 'threads',
    // Avoid tinypool worker recursion issues seen on Node 22+ in CI/local runs.
    poolOptions: {
      threads: {
        singleThread: true,
        maxThreads: 1,
        minThreads: 1,
      },
    },
  },
});