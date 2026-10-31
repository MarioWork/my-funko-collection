import { http, HttpResponse } from 'msw/http';
import { SortingDirectionUtil, UserRoleUtil, UserStateUtil } from '@app-types/utility';
import { TEST_BASE_API_URL, server } from '@mocks/server';
import userService, { UserApiSortingFields } from './userService';

describe('getUsers', () => {
  it('sends the page and the sort under their wire names', async () => {
    let receivedQuery = new URLSearchParams();
    server.use(
      http.get(`${TEST_BASE_API_URL}/users`, ({ request }) => {
        receivedQuery = new URL(request.url).searchParams;

        return HttpResponse.json({ data: [], currentPage: 1, totalResultNumber: 0 });
      }),
    );

    await userService.getUsers({
      pagination: { page: '1', size: '100' },
      sortingField: UserApiSortingFields.CREATION_DATE,
      direction: SortingDirectionUtil.DESC,
    });

    expect(Object.fromEntries(receivedQuery)).toEqual({
      page: '1',
      size: '100',
      sorting_fields: 'CREATION_DATE',
      direction: 'DESC',
    });
  });
});

describe('addUser', () => {
  it('creates the user and returns their temporary password, which the list never carries', async () => {
    const created = await userService.addUser({ username: 'rey', role: UserRoleUtil.MEMBER });
    const list = await userService.getUsers({ pagination: { page: '1', size: '100' } });

    expect(created.data?.user).toMatchObject({
      username: 'rey',
      role: UserRoleUtil.MEMBER,
      state: UserStateUtil.TEMPORARY_PASSWORD,
    });
    expect(created.data?.temporaryPassword.length).toBeGreaterThanOrEqual(15);
    expect(JSON.stringify(list)).not.toContain(created.data?.temporaryPassword);
  });

  it('returns the 409 envelope for a taken username', async () => {
    const result = await userService.addUser({ username: 'leia', role: UserRoleUtil.ADMIN });

    expect(result).toMatchObject({ success: false, error: { statusCode: 409, code: 'CONFLICT' } });
  });
});
