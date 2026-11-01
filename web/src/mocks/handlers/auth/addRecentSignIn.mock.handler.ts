import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { AuthSessionApiModel } from '@app-types/models';
import { UserStateUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { errorResponse } from '@mocks/mockResponses';
import { UNAUTHORIZED_STATUS } from '@utils/httpStatusUtils';
import { mockStore } from '@mocks/mockStore';
import { AuthApiErrorCodes } from '@services/authService/authService';
import type { ConfirmPassword } from '@services/authService/authService.type';
import { mockUserOf } from './authMockUtils';

const passwordMismatch = () =>
  errorResponse(UNAUTHORIZED_STATUS, AuthApiErrorCodes.SIGN_IN_FAILED, "That password doesn't match. Try again.");

const temporaryPasswordExpired = () =>
  errorResponse(
    UNAUTHORIZED_STATUS,
    AuthApiErrorCodes.TEMPORARY_PASSWORD_EXPIRED,
    'This temporary password has expired. Ask an admin for a new one.',
  );

// Signed in as a user an admin created (luke, han): whether their temporary password is past its 7 days.
function isTemporaryPasswordExpired(): boolean {
  const signedInRow = mockStore.users.find((user) => user.username === mockStore.auth.username);

  return signedInRow?.state === UserStateUtil.TEMPORARY_PASSWORD_EXPIRED;
}

// "Confirm it's you" with a password, like the API: only the signed-in user's own password counts (never another
// user's), and a wrong one or a user with none get the same answer. The right temporary password past its 7 days
// says so. The right one renews the recent sign-in.
export default (baseUrl: string) => [
  http.post(`${baseUrl}/auth/recent-sign-in`, async ({ request }) => {
    await delay(MOCK_DELAY);

    const { password } = (await request.json()) as ConfirmPassword;
    const { auth } = mockStore;
    const isRightPassword = auth.password !== null && auth.password === password;

    if (!isRightPassword) return passwordMismatch();

    if (isTemporaryPasswordExpired()) return temporaryPasswordExpired();

    auth.isSignInRecent = true;

    return HttpResponse.json<AuthSessionApiModel>({ user: mockUserOf(auth) });
  }),
];
