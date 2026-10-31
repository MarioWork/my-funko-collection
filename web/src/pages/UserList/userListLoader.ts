import type { LoaderFunctionArgs } from 'react-router';
import { DEFAULT_FIRST_PAGE } from '@app-types/utility';
import userService, { DEFAULT_USER_SORT_DIRECTION, DEFAULT_USER_SORT_FIELD } from '@services/userService/userService';
import { assertAdmin } from '@utils/adminRouteUtils';
import { USER_PAGE_SIZE } from './userListUtils';

// Admins only. A handful of trusted users: one page of the API's largest size holds them all, sorted by username.
export async function loader({ context }: LoaderFunctionArgs) {
  assertAdmin(context);

  const fields = {
    pagination: { page: DEFAULT_FIRST_PAGE, size: USER_PAGE_SIZE },
    sortingField: DEFAULT_USER_SORT_FIELD,
    direction: DEFAULT_USER_SORT_DIRECTION,
  };

  const usersResponse = await userService.getUsers(fields);

  return { usersResponse };
}
