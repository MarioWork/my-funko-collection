import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { UserApiModel } from '@app-types/models';
import { MOCK_DELAY } from '@mocks/handlers';
import { mockStore } from '@mocks/mockStore';
import type { MockUserRow } from '@mocks/mockStore.type';
import { isWorkingMockAdmin, toMockUserModel } from '@mocks/mockUsers';
import type { UpdateUser } from '@services/userService/userService.type';
import {
  endMockSessionsOf,
  everyMockUser,
  isLastMockAdmin,
  isSignedInMockUser,
  lastAdminResponse,
  readManagedMockUser,
  storedMockUser,
} from './userMockUtils';

type UserStanding = Pick<MockUserRow, 'role' | 'isReadOnly'>;

// The user as the change leaves them: what it sends replaces what is there, what it leaves out stays.
function standingAfter(user: MockUserRow, change: UpdateUser): UserStanding {
  return { role: change.role ?? user.role, isReadOnly: change.isReadOnly ?? user.isReadOnly };
}

// The new role and read-only setting on the right row (the signed-in user's live in the sign-in), and the user's
// sessions end.
function applyStanding(userId: number, standing: UserStanding): void {
  if (isSignedInMockUser(userId)) Object.assign(mockStore.auth, standing);

  const row = storedMockUser(userId);

  if (row) Object.assign(row, standing);

  endMockSessionsOf(userId);
}

// Like the API: admins only (requireAdmin.mock.handler.ts), a recent sign-in, never the last admin who can make
// changes made a member or read-only. A change ends the user's sessions; sending what is already there changes
// nothing.
export default (baseUrl: string) => [
  http.patch(`${baseUrl}/users/:userId`, async ({ request, params }) => {
    await delay(MOCK_DELAY);

    const managed = readManagedMockUser(params.userId);

    if (managed instanceof Response) return managed;

    const { userId, user } = managed;
    const next = standingAfter(user, (await request.json()) as UpdateUser);
    const isChange = next.role !== user.role || next.isReadOnly !== user.isReadOnly;
    const isLeavingAdmins = isLastMockAdmin(user) && !isWorkingMockAdmin(next);

    if (isLeavingAdmins) return lastAdminResponse();

    if (isChange) applyStanding(userId, next);

    return HttpResponse.json<UserApiModel>(toMockUserModel({ ...user, ...next }, everyMockUser()));
  }),
];
