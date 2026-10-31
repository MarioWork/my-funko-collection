import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { UserWithTemporaryPasswordApiModel } from '@app-types/models';
import { UserStateUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { conflict, errorResponse, notFound } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';
import type { MockUserRow } from '@mocks/mockStore.type';
import { nowIso } from '@mocks/mockStoreUtils';
import { mockTemporaryPasswordFor, temporaryPasswordExpiryFrom, toMockUserModel } from '@mocks/mockUsers';
import { UserApiErrorCodes } from '@services/userService/userService';
import type { NewTemporaryPassword } from '@services/userService/userService.type';
import { BAD_REQUEST_STATUS } from '@utils/httpStatusUtils';
import { reauthRequiredResponse } from '../auth/authMockUtils';
import { endMockSessionsOf, everyMockUser, findMockUser, isSignedInMockUser, storedMockUser } from './userMockUtils';

const ENTITY = 'User';
const USERNAME_TAKEN_MESSAGE = 'That username is taken. Pick another one.';
const USERNAME_REQUIRED_MESSAGE = 'This user has no username yet. Pick one for them.';

type NewSignIn = Pick<MockUserRow, 'username' | 'password'>;

function isUsernameTaken(username: string, userId: number): boolean {
  return everyMockUser().some((user) => user.username === username && user.id !== userId);
}

const usernameRequired = (): Response =>
  errorResponse(BAD_REQUEST_STATUS, UserApiErrorCodes.USERNAME_REQUIRED, USERNAME_REQUIRED_MESSAGE);

// The new password, and the username, on the right row: the signed-in user's live in the sign-in.
function applyTemporaryPassword(userId: number, signIn: NewSignIn): void {
  if (isSignedInMockUser(userId)) {
    Object.assign(mockStore.auth, { ...signIn, mustChangePassword: true });

    return;
  }

  const row = storedMockUser(userId);

  if (!row) return;

  Object.assign(row, {
    ...signIn,
    state: UserStateUtil.TEMPORARY_PASSWORD,
    temporaryPasswordExpiresAt: temporaryPasswordExpiryFrom(nowIso()),
  });
}

// Like the API: admins only, a recent sign-in, a username for a user who has none. The old password stops working,
// the user's sessions end, and the answer carries the new temporary password once.
export default (baseUrl: string) => [
  http.post(`${baseUrl}/users/:userId/temporary-password`, async ({ request, params }) => {
    await delay(MOCK_DELAY);

    const reauthRequired = reauthRequiredResponse();

    if (reauthRequired) return reauthRequired;

    const userId = Number(params.userId);
    const user = findMockUser(userId);

    if (!user) return notFound(ENTITY, userId);

    const body = (await request.json()) as NewTemporaryPassword;
    const username = body.username?.trim().toLowerCase() ?? user.username;

    if (!username) return usernameRequired();

    if (isUsernameTaken(username, userId)) return conflict(USERNAME_TAKEN_MESSAGE);

    const password = mockTemporaryPasswordFor(userId);

    applyTemporaryPassword(userId, { username, password });
    endMockSessionsOf(userId);

    const changed = findMockUser(userId) ?? { ...user, username, password };
    const answer = { user: toMockUserModel(changed, everyMockUser()), temporaryPassword: password };

    return HttpResponse.json<UserWithTemporaryPasswordApiModel>(answer);
  }),
];
