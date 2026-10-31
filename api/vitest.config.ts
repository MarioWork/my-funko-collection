import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    restoreMocks: true,
    include: ['src/**/*.test.ts'],
    // One migrated template database per run; setupTests.ts loads .env.test and gives each test file its own copy.
    globalSetup: ['src/testGlobalSetup.ts'],
    setupFiles: ['src/setupTests.ts'],
  },
});
