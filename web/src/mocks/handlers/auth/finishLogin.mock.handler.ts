import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { AuthSessionApiModel } from '@app-types/models';
import { AuthStateUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { errorResponse, UNAUTHORIZED_STATUS } from '@mocks/mockResponses';
import { mockStore, nowIso } from '@mocks/mockStore';
import { AuthApiErrorCodes } from '@services/authService/authService';
import { readCeremonyResponse } from './authMockUtils';

// Any well-formed answer signs in. The passkey it names gets its "last used" date when the mocks know it.
export default (baseUrl: string) => [
  http.post(`${baseUrl}/auth/login/verify`, async ({ request }) => {
    await delay(MOCK_DELAY);

    const response = await readCeremonyResponse(request);
    const hasUser = mockStore.auth.state !== AuthStateUtil.SETUP;

    if (!response || !hasUser) {
      return errorResponse(
        UNAUTHORIZED_STATUS,
        AuthApiErrorCodes.SIGN_IN_FAILED,
        "That passkey didn't work. Try again.",
      );
    }

    const passkey = mockStore.auth.passkeys.find((candidate) => candidate.id === response.id);

    if (passkey) passkey.lastUsedAt = nowIso();

    mockStore.auth.state = AuthStateUtil.SIGNED_IN;
    mockStore.auth.isSignInRecent = true;

    return HttpResponse.json<AuthSessionApiModel>({ user: { name: mockStore.auth.userName } });
  }),
];
