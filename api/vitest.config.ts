import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    restoreMocks: true,
    include: ['src/**/*.test.ts'],
    // Loads .env.test before any test imports config/env.ts; DATABASE_URL=:memory: gives each worker its own db.
    setupFiles: ['src/setupTests.ts'],
  },
});
