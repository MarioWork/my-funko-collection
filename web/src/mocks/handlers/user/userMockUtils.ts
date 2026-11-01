import { AuthStateUtil } from '@app-types/utility';
import { MOCK_USER_ID } from '@mocks/mockAuth';
import { errorResponse, notFound } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';
import type { MockUserRow } from '@mocks/mockStore.type';
import { isWorkingMockAdmin, mockUserRowOf } from '@mocks/mockUsers';
import { UserApiErrorCodes } from '@services/userService/userService';
import { CONFLICT_STATUS } from '@utils/httpStatusUtils';
import { reauthRequiredResponse } from '../auth/authMockUtils';

const LAST_ADMIN_MESSAGE =
  'There must always be at least one admin who can make changes. Make someone else an admin first.';
const USER_ENTITY = 'User';

export const USERNAME_TAKEN_MESSAGE = 'That username is taken. Pick another one.';

type ManagedMockUser = { userId: number; user: MockUserRow };

// Every user, the signed-in one first, as GET /users lists them.
export function everyMockUser(): MockUserRow[] {
  return [mockUserRowOf(mockStore.auth), ...mockStore.users];
}

export function isSignedInMockUser(userId: number): boolean {
  return userId === MOCK_USER_ID;
}

// The row of a user id, or undefined. The signed-in user's row is built from the sign-in, so a change to them is
// written to mockStore.auth, never to this copy.
export function findMockUser(userId: number): MockUserRow | undefined {
  return everyMockUser().find((user) => user.id === userId);
}

// What every change to one user checks first, like the API: a recent sign-in, then that the user exists. A Response
// when either fails (answer it), the user otherwise.
export function readManagedMockUser(userIdParam: unknown): ManagedMockUser | Response {
  const reauthRequired = reauthRequiredResponse();

  if (reauthRequired) return reauthRequired;

  const userId = Number(userIdParam);
  const user = findMockUser(userId);

  if (!user) return notFound(USER_ENTITY, userId);

  return { userId, user };
}

// Another user's stored row, the one a change is written to.
export function storedMockUser(userId: number): MockUserRow | undefined {
  return mockStore.users.find((user) => user.id === userId);
}

// Whether the user is the only admin who can make changes: they can't be made a member, made read-only or deleted.
export function isLastMockAdmin(user: MockUserRow): boolean {
  const adminCount = everyMockUser().filter(isWorkingMockAdmin).length;

  return isWorkingMockAdmin(user) && adminCount === 1;
}

export const lastAdminResponse = (): Response =>
  errorResponse(CONFLICT_STATUS, UserApiErrorCodes.LAST_ADMIN, LAST_ADMIN_MESSAGE);

// The API ends every session of a user it changes. One browser in the mocks: when that user is the signed-in one,
// this browser is signed out, and its next request answers 401.
export function endMockSessionsOf(userId: number): void {
  if (isSignedInMockUser(userId)) mockStore.auth.state = AuthStateUtil.SIGNED_OUT;
}
