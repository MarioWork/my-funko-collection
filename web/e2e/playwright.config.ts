import { defineConfig, devices } from '@playwright/test';

// Its own port, not Vite's 5173, so `yarn dev` (on real data) can keep running while the tests do.
const E2E_PORT = 5199;

export const BASE_URL = `http://localhost:${E2E_PORT}`;

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
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // The phone layout: top bar, bottom tab bar, sheets instead of dialogs. Chromium too, so no extra browser.
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `yarn dev:playwright --port ${E2E_PORT} --strictPort`,
    url: BASE_URL,
    // Off on purpose: a server already on the port is not known to be this app in mock mode.
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
