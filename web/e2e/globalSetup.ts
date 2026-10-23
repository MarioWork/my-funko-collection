import { chromium } from '@playwright/test';
import {
  ADD_ROUTES_PATHS,
  BASE_ROUTES_PATHS,
  COLLECTION_ROUTES_PATHS,
  FUNKO_ROUTES_PATHS,
} from '../src/application/routes/routesUtils';
import { BASE_URL } from './playwright.config';

const WARM_UP_TIMEOUT_MS = 90000;
const SEED_COLLECTION_ID = '1';

// Vite compiles on first request. Warming here keeps that cost out of the first test's timeout.
export default async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const routesToWarm = [
    BASE_ROUTES_PATHS.HOME,
    FUNKO_ROUTES_PATHS.BASE,
    ADD_ROUTES_PATHS.MANUAL,
    COLLECTION_ROUTES_PATHS.detail(SEED_COLLECTION_ID),
  ];

  for (const route of routesToWarm) {
    try {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'load', timeout: WARM_UP_TIMEOUT_MS });
    } catch {
      // A miss only means the run pays the compile cost itself, so never fail the suite here.
    }
  }

  await browser.close();
}
