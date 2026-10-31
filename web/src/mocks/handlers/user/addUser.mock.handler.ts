import { http } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { UserWithTemporaryPasswordApiModel } from '@app-types/models';
import { MOCK_DELAY } from '@mocks/handlers';
import { conflict, created } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';
import { nextId } from '@mocks/mockStoreUtils';
import { newMockUserRow, toMockUserModel } from '@mocks/mockUsers';
import type { CreateUser } from '@services/userService/userService.type';
import { reauthRequiredResponse } from '../auth/authMockUtils';
import { everyMockUser } from './userMockUtils';

const USERNAME_TAKEN_MESSAGE = 'That username is taken. Pick another one.';

// Like the API: admins only (requireAdmin.mock.handler.ts), a sign-in from the last 10 minutes, a free username.
// The answer carries the temporary password once; the list never shows it.
export default (baseUrl: string) => [
  http.post(`${baseUrl}/users`, async ({ request }) => {
    await delay(MOCK_DELAY);

    const reauthRequired = reauthRequiredResponse();

    if (reauthRequired) return reauthRequired;

    const body = (await request.json()) as CreateUser;
    const username = body.username.trim().toLowerCase();
    const everyone = everyMockUser();

    if (everyone.some((user) => user.username === username)) return conflict(USERNAME_TAKEN_MESSAGE);

    const row = newMockUserRow(nextId(everyone), username, body.role);

    mockStore.users.push(row);

    const user = toMockUserModel(row, everyMockUser());

    return created({ user, temporaryPassword: row.password ?? '' } satisfies UserWithTemporaryPasswordApiModel);
  }),
];
