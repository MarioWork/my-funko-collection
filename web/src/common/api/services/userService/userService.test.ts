import { http, HttpResponse } from 'msw/http';
import { SortingDirectionUtil, SubmissionStatusUtil, UserRoleUtil, UserStateUtil } from '@app-types/utility';
import { MOCK_USER_ID } from '@mocks/mockAuth';
import { MOCK_MEMBER_ID } from '@mocks/mockUsers';
import { addMockSubmission, mockStore } from '@mocks/mockStore';
import { TEST_BASE_API_URL, server } from '@mocks/server';
import userService, { UserApiSortingFields } from './userService';

type ReceivedRequest = { path: string; body: unknown };

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

describe('updateUser', () => {
  it('sends the new role to the user’s path and returns the changed user', async () => {
    let received: ReceivedRequest | undefined;
    server.use(
      http.patch(`${TEST_BASE_API_URL}/users/:userId`, async ({ request, params }) => {
        received = { path: String(params.userId), body: await request.json() };

        return HttpResponse.json({ id: 3, role: UserRoleUtil.ADMIN });
      }),
    );

    const result = await userService.updateUser(3, { role: UserRoleUtil.ADMIN });

    expect(received).toEqual({ path: '3', body: { role: UserRoleUtil.ADMIN } });
    expect(result).toMatchObject({ success: true, data: { id: 3, role: UserRoleUtil.ADMIN } });
  });

  it('returns the 409 LAST_ADMIN envelope when the last admin would become a member', async () => {
    mockStore.users = mockStore.users.filter((user) => user.role !== UserRoleUtil.ADMIN);

    const result = await userService.updateUser(MOCK_USER_ID, { role: UserRoleUtil.MEMBER });

    expect(result).toMatchObject({ success: false, error: { statusCode: 409, code: 'LAST_ADMIN' } });
  });
});

describe('addTemporaryPassword', () => {
  it('posts to the user’s temporary-password path and returns the new password once', async () => {
    let receivedPath = '';
    server.use(
      http.post(`${TEST_BASE_API_URL}/users/:userId/temporary-password`, ({ request }) => {
        receivedPath = new URL(request.url).pathname;

        return HttpResponse.json({ user: { id: 4 }, temporaryPassword: 'abcde-fghjk-mnpqr-stuvw' });
      }),
    );

    const result = await userService.addTemporaryPassword(4, {});

    expect(receivedPath).toBe('/api/users/4/temporary-password');
    expect(result).toMatchObject({ success: true, data: { temporaryPassword: 'abcde-fghjk-mnpqr-stuvw' } });
  });

  it('returns the 400 USERNAME_REQUIRED envelope for a user with no username when none is sent', async () => {
    const result = await userService.addTemporaryPassword(MOCK_USER_ID, {});

    expect(result).toMatchObject({ success: false, error: { statusCode: 400, code: 'USERNAME_REQUIRED' } });
  });
});

describe('deleteUser', () => {
  it('deletes the user, who then leaves the list', async () => {
    const result = await userService.deleteUser(3);
    const list = await userService.getUsers({ pagination: { page: '1', size: '100' } });

    expect(result.success).toBe(true);
    expect(list.data.map((user) => user.id)).not.toContain(3);
  });

  it('keeps the user’s waiting submission with no sender and drops the rejected one when the user is deleted', async () => {
    const waiting = addMockSubmission({ name: 'Luke Waiting', submittedById: MOCK_MEMBER_ID });
    const rejected = addMockSubmission({
      name: 'Luke Rejected',
      submittedById: MOCK_MEMBER_ID,
      status: SubmissionStatusUtil.REJECTED,
    });

    await userService.deleteUser(MOCK_MEMBER_ID);

    const remaining = mockStore.funkos.filter((funko) => funko.id === waiting.id || funko.id === rejected.id);
    expect(remaining).toEqual([expect.objectContaining({ id: waiting.id, submittedById: null })]);
  });

  it('returns the 404 envelope for a user that does not exist', async () => {
    const result = await userService.deleteUser(999);

    expect(result).toMatchObject({ success: false, error: { statusCode: 404 } });
  });
});
