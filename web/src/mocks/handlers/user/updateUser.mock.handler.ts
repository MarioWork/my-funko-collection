import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { UserApiModel } from '@app-types/models';
import type { UserRoleUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { mockStore } from '@mocks/mockStore';
import { toMockUserModel } from '@mocks/mockUsers';
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

// The new role on the right row (the signed-in user's lives in the sign-in), and the user's sessions end.
function applyRole(userId: number, role: UserRoleUtil): void {
  if (isSignedInMockUser(userId)) mockStore.auth.role = role;

  const row = storedMockUser(userId);

  if (row) row.role = role;

  endMockSessionsOf(userId);
}

// Like the API: admins only (requireAdmin.mock.handler.ts), a recent sign-in, never the last admin made a member.
// A new role ends the user's sessions; the same role changes nothing.
export default (baseUrl: string) => [
  http.patch(`${baseUrl}/users/:userId`, async ({ request, params }) => {
    await delay(MOCK_DELAY);

    const managed = readManagedMockUser(params.userId);

    if (managed instanceof Response) return managed;

    const { userId, user } = managed;
    const { role } = (await request.json()) as UpdateUser;
    const isRoleChange = role !== user.role;

    if (isRoleChange && isLastMockAdmin(user)) return lastAdminResponse();

    if (isRoleChange) applyRole(userId, role);

    return HttpResponse.json<UserApiModel>(toMockUserModel({ ...user, role }, everyMockUser()));
  }),
];
