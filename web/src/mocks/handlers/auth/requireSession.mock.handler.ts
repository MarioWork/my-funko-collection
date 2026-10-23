import { http } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { AuthStateUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { mockStore } from '@mocks/mockStore';
import { unauthorized } from './authMockUtils';

// The routes the API serves without a session: the status, the sign-in and first-run ceremonies, and sign-out
// (which always answers 204, so an expired session can still sign out cleanly).
const PUBLIC_PATH_PATTERN = /\/auth\/(status$|logout$|login\/|setup\/)/;

// Registered first: every other mocked route answers 401 UNAUTHORIZED without a session, as the API does. With
// one, it returns nothing and MSW moves on to the route's own handler.
export default (baseUrl: string) => [
  http.all(`${baseUrl}/*`, async ({ request }) => {
    const isSignedIn = mockStore.auth.state === AuthStateUtil.SIGNED_IN;
    const isPublic = PUBLIC_PATH_PATTERN.test(new URL(request.url).pathname);

    if (isSignedIn || isPublic) return undefined;

    await delay(MOCK_DELAY);

    return unauthorized();
  }),
];
