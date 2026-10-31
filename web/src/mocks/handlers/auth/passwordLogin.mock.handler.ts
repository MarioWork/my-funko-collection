import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { AuthSessionApiModel } from '@app-types/models';
import { AuthStateUtil, UserStateUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { errorResponse } from '@mocks/mockResponses';
import { UNAUTHORIZED_STATUS } from '@utils/httpStatusUtils';
import { mockStore } from '@mocks/mockStore';
import type { MockUserRow } from '@mocks/mockStore.type';
import { AuthApiErrorCodes } from '@services/authService/authService';
import type { PasswordSignIn } from '@services/authService/authService.type';
import { mockUserOf } from './authMockUtils';

const signInFailed = () =>
  errorResponse(
    UNAUTHORIZED_STATUS,
    AuthApiErrorCodes.SIGN_IN_FAILED,
    "That username and password don't match. Try again.",
  );

const temporaryPasswordExpired = () =>
  errorResponse(
    UNAUTHORIZED_STATUS,
    AuthApiErrorCodes.TEMPORARY_PASSWORD_EXPIRED,
    'This temporary password has expired. Ask an admin for a new one.',
  );

// Another user's row matching what was typed (an admin created them and handed out the temporary password).
function findOtherUser({ username, password }: PasswordSignIn): MockUserRow | undefined {
  const typedUsername = username.trim().toLowerCase();

  return mockStore.users.find((user) => user.username === typedUsername && user.password === password);
}

// The browser becomes that user's: their name and role, and the temporary password still to replace.
function signInAs(user: MockUserRow): void {
  Object.assign(mockStore.auth, {
    userName: user.name,
    username: user.username,
    role: user.role,
    password: user.password,
    mustChangePassword: user.state === UserStateUtil.TEMPORARY_PASSWORD,
    passkeys: [],
  });
}

// Like the API: the username is matched lower-case, the password exactly, and every failure gets the same answer,
// but the right temporary password after its 7 days says so.
export default (baseUrl: string) => [
  http.post(`${baseUrl}/auth/login/password`, async ({ request }) => {
    await delay(MOCK_DELAY);

    const credentials = (await request.json()) as PasswordSignIn;
    const { auth } = mockStore;
    const isKnownUsername = auth.username !== null && auth.username === credentials.username.trim().toLowerCase();
    const isRightPassword = auth.password !== null && auth.password === credentials.password;
    const otherUser = isKnownUsername ? undefined : findOtherUser(credentials);

    if (otherUser?.state === UserStateUtil.TEMPORARY_PASSWORD_EXPIRED) return temporaryPasswordExpired();

    if (otherUser) signInAs(otherUser);

    const isSignedInUser = (isKnownUsername && isRightPassword) || otherUser !== undefined;

    if (!isSignedInUser) return signInFailed();

    auth.state = AuthStateUtil.SIGNED_IN;
    auth.isSignInRecent = true;

    return HttpResponse.json<AuthSessionApiModel>({ user: mockUserOf(auth) });
  }),
];
