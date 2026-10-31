import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { AuthSessionApiModel } from '@app-types/models';
import { AuthStateUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { errorResponse, UNAUTHORIZED_STATUS } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';
import { AuthApiErrorCodes } from '@services/authService/authService';
import type { PasswordSignIn } from '@services/authService/authService.type';
import { mockUserOf } from './authMockUtils';

// Like the API: the username is matched lower-case, the password exactly, and every failure gets the same answer.
export default (baseUrl: string) => [
  http.post(`${baseUrl}/auth/login/password`, async ({ request }) => {
    await delay(MOCK_DELAY);

    const { username, password } = (await request.json()) as PasswordSignIn;
    const { auth } = mockStore;
    const isKnownUsername = auth.username !== null && auth.username === username.trim().toLowerCase();
    const isRightPassword = auth.password !== null && auth.password === password;

    if (!isKnownUsername || !isRightPassword) {
      return errorResponse(
        UNAUTHORIZED_STATUS,
        AuthApiErrorCodes.SIGN_IN_FAILED,
        "That username and password don't match. Try again.",
      );
    }

    auth.state = AuthStateUtil.SIGNED_IN;
    auth.isSignInRecent = true;

    return HttpResponse.json<AuthSessionApiModel>({ user: mockUserOf(auth) });
  }),
];
