import { AuthStateUtil, UserRoleUtil } from '@app-types/utility';
import { MOCK_USER_ID } from '@mocks/mockAuth';
import { errorResponse } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';
import type { MockUserRow } from '@mocks/mockStore.type';
import { mockUserRowOf } from '@mocks/mockUsers';
import { UserApiErrorCodes } from '@services/userService/userService';
import { CONFLICT_STATUS } from '@utils/httpStatusUtils';

const LAST_ADMIN_MESSAGE = 'There must always be at least one admin. Make someone else an admin first.';

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

// Another user's stored row, the one a change is written to.
export function storedMockUser(userId: number): MockUserRow | undefined {
  return mockStore.users.find((user) => user.id === userId);
}

// Whether the user is the only admin: they can't be made a member or deleted.
export function isLastMockAdmin(user: MockUserRow): boolean {
  const adminCount = everyMockUser().filter((row) => row.role === UserRoleUtil.ADMIN).length;

  return user.role === UserRoleUtil.ADMIN && adminCount === 1;
}

export const lastAdminResponse = (): Response =>
  errorResponse(CONFLICT_STATUS, UserApiErrorCodes.LAST_ADMIN, LAST_ADMIN_MESSAGE);

// The API ends every session of a user it changes. One browser in the mocks: when that user is the signed-in one,
// this browser is signed out, and its next request answers 401.
export function endMockSessionsOf(userId: number): void {
  if (isSignedInMockUser(userId)) mockStore.auth.state = AuthStateUtil.SIGNED_OUT;
}
