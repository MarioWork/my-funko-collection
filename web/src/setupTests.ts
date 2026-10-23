import '@testing-library/jest-dom/vitest';
import axios from 'axios';
import { resetMockStore } from './mocks/mockStore';
import { server, TEST_BASE_API_URL } from './mocks/server';

axios.defaults.baseURL = TEST_BASE_API_URL;
// jsdom's XMLHttpRequest performs real requests that MSW's Node interception never sees; fetch is intercepted
// in both the node and the jsdom projects, so every test talks to the same mock layer.
axios.defaults.adapter = 'fetch';

// jsdom has no matchMedia. Answer like a desktop window (jsdom is 1024 px wide, Tailwind's `lg`): min-width
// queries match, so useIsDesktop() is true and routed forms open as dialogs.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: query.includes('min-width'),
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  });
}

// A request with no handler fails the test instead of passing on a warning nobody reads.
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
// Every test starts from the same seeded in-memory data, whatever the previous one added or deleted.
afterEach(() => {
  server.resetHandlers();
  resetMockStore();
});
afterAll(() => server.close());
