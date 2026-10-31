import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { UserApiModel } from '@app-types/models';
import type { ResponseWithPaginationUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { paginateMockList } from '@mocks/mockListUtils';
import { toMockUserModel } from '@mocks/mockUsers';
import { UserApiSortingFields } from '@services/userService/userService';
import { everyMockUser } from './userMockUtils';

// A user with no username yet sorts after every username, like the API's "nulls last" (ascending).
const NO_USERNAME_SORT_KEY = '\uffff';

// The signed-in user and the others, like the API's list of every user. Admins only (requireAdmin.mock.handler.ts).
export default (baseUrl: string) => [
  http.get(`${baseUrl}/users`, async ({ request }): Promise<HttpResponse<ResponseWithPaginationUtil<UserApiModel>>> => {
    await delay(MOCK_DELAY);

    const everyone = everyMockUser();
    const users = everyone.map((user) => toMockUserModel(user, everyone));

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
