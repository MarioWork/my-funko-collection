import { defineConfig, devices } from '@playwright/test';

export const BASE_URL = 'http://localhost:5173';

export default defineConfig({
  testDir: './tests',
  globalSetup: './globalSetup.ts',
  testMatch: '**/*.e2e.test.ts',
  tsconfig: '../tsconfig.e2e.json',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'yarn dev:playwright',
    url: BASE_URL,
    // Off on purpose: 5173 is Vite's default, so reuse could attach to a sibling project's dev server.
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
