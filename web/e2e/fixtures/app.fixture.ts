import { defineNetworkFixture, type NetworkFixture, type NetworkFixtureOptions } from '@msw/playwright';
import { test as base, expect } from '@playwright/test';
import { AuthStateUtil } from '@app-types/utility';
import { getHandlers } from '@mocks/handlers';
import { resetMockStore, setMockAuthState } from '@mocks/mockStore';
import { BASE_URL } from '../playwright.config';

// The app calls the API on its own origin (VITE_BASE_API_URL='/api'), so the mocks listen on the dev server's URL.
export const BASE_API_URL = `${BASE_URL}/api`;

type Fixtures = {
  handlers: NetworkFixtureOptions['handlers'];
  // Where the mocks start: signed in (the default, so most tests skip the login), signed out, or before setup.
  authState: AuthStateUtil;
  network: NetworkFixture;
  // Chrome's virtual authenticator (a platform passkey with user verification that always passes), so the app's
  // real WebAuthn calls run against the mocks. Opt in by naming it in a test.
  virtualAuthenticator: void;
};

const VIRTUAL_AUTHENTICATOR_OPTIONS = {
  protocol: 'ctap2',
  transport: 'internal',
  hasResidentKey: true,
  hasUserVerification: true,
  isUserVerified: true,
} as const;

// The same MSW handlers as dev and Vitest, routed through Playwright's own network layer (page.route under the
// hood). The app's in-page worker stands down under VITE_PLAYWRIGHT, so this is the only mock layer running.
// The handlers share one in-memory store per worker, so every test starts from the seed again.
export const test = base.extend<Fixtures>({
  handlers: [getHandlers(BASE_API_URL), { option: true }],
  authState: [AuthStateUtil.SIGNED_IN, { option: true }],
  network: [
    async ({ context, handlers, authState }, use) => {
      resetMockStore();
      setMockAuthState(authState);

      const network = defineNetworkFixture({ context, handlers });

      await network.enable();
      await use(network);
      await network.disable();
    },
    { auto: true },
  ],
  virtualAuthenticator: [
    async ({ page }, use) => {
      const session = await page.context().newCDPSession(page);

      await session.send('WebAuthn.enable');
      const { authenticatorId } = await session.send('WebAuthn.addVirtualAuthenticator', {
        options: VIRTUAL_AUTHENTICATOR_OPTIONS,
      });
      await use();
      await session.send('WebAuthn.removeVirtualAuthenticator', { authenticatorId });
    },
    { auto: false },
  ],
});

export { expect };
