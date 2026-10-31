// The in-memory data behind every mock handler. One store per page load (and per test, through resetMockStore()),
// so an add or a delete changes the next list the way the real API would. It is what the signed-in user sees: the
// whole catalogue, and only their own collections and items (the API never sends another user's).
import type { AuthStateUtil as AuthState } from '@app-types/utility';
import { createMockAuth, initialAuthState } from './mockAuth';
import { createSeedData } from './mockSeed';
import type { MockStore } from './mockStore.type';
import { resetMockClock } from './mockStoreUtils';

function createMockStore(): MockStore {
  return { auth: createMockAuth(initialAuthState), ...createSeedData() };
}

export let mockStore: MockStore = createMockStore();

export function resetMockStore(): void {
  resetMockClock();
  mockStore = createMockStore();
}

// For a test that starts signed out or before the first run. resetMockStore() signs back in.
export function setMockAuthState(state: AuthState): void {
  mockStore.auth = createMockAuth(state);
}
