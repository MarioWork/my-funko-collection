// Small helpers every mock handler shares: the env, ids and a clock.
import type { MockReviewColumns, MockRowWithId } from './mockStore.type';

// A funko no admin has reviewed or changed: every new one, and the seed's catalogue.
export const NOT_REVIEWED: MockReviewColumns = {
  reviewedAt: null,
  rejectionReason: null,
  changedByAdminAt: null,
  mergedIntoId: null,
};

// Vite's env in the browser and in Vitest. Playwright loads this file in plain Node, where import.meta.env does
// not exist, so it reads as empty there (the defaults: no extra funkos, signed in).
const viteEnv: ImportMetaEnv | undefined = import.meta.env;
export const mockEnv: Partial<ImportMetaEnv> = viteEnv ?? {};

const FIRST_DATE = Date.UTC(2026, 0, 5, 9, 30);
const DAY_MS = 24 * 60 * 60 * 1000;
// The mock clock starts after every seed date and moves one second per write, so new rows sort as newest and every
// run gives the same timestamps. resetMockStore() winds it back.
const CLOCK_START = Date.UTC(2026, 9, 1, 12, 0);
const CLOCK_STEP_MS = 1000;

let clock = CLOCK_START;

// The seed's dates: one day apart from 5 January 2026.
export function mockDate(index: number): string {
  return new Date(FIRST_DATE + index * DAY_MS).toISOString();
}

const HOUR_MS = 60 * 60 * 1000;

// A seed date `hoursAgo` hours before the mock clock starts: for rows the API keeps only for a while (notifications,
// 90 days), so they are still recent when the store is made.
export function mockRecentDate(hoursAgo: number): string {
  return new Date(CLOCK_START - hoursAgo * HOUR_MS).toISOString();
}

export function nextId(rows: MockRowWithId[]): number {
  return rows.reduce((highest, row) => Math.max(highest, row.id), 0) + 1;
}

// "Now" for a write or an export: the next tick of the mock clock.
export function nowIso(): string {
  clock += CLOCK_STEP_MS;

  return new Date(clock).toISOString();
}

export function resetMockClock(): void {
  clock = CLOCK_START;
}
