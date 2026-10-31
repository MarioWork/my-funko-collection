import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { UserApiModel } from '@app-types/models';
import type { ResponseWithPaginationUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { paginateMockList } from '@mocks/mockListUtils';
import { mockStore } from '@mocks/mockStore';
import type { MockUserRow } from '@mocks/mockStore.type';
import { mockUserRowOf } from '@mocks/mockUsers';
import { UserApiSortingFields } from '@services/userService/userService';

// A user with no username yet sorts after every username, like the API's "nulls last" (ascending).
const NO_USERNAME_SORT_KEY = '\uffff';

// A row as the API answers it: never a password.
function toUserModel({ password: _password, ...user }: MockUserRow): UserApiModel {
  return user;
}

// The signed-in user and the others, like the API's list of every user. Admins only (requireAdmin.mock.handler.ts).
export default (baseUrl: string) => [
  http.get(`${baseUrl}/users`, async ({ request }): Promise<HttpResponse<ResponseWithPaginationUtil<UserApiModel>>> => {
    await delay(MOCK_DELAY);

    const users = [mockUserRowOf(mockStore.auth), ...mockStore.users].map(toUserModel);

    return HttpResponse.json(
      paginateMockList(request, users, {
        sorts: {
          [UserApiSortingFields.USERNAME]: (user) => user.username ?? NO_USERNAME_SORT_KEY,
          [UserApiSortingFields.NAME]: (user) => user.name,
          [UserApiSortingFields.CREATION_DATE]: (user) => user.createdAt,
        },
      }),
    );
  }),
];
