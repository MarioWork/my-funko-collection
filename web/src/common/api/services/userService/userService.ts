import axios from 'axios';
import { axiosActions } from '@api/axiosActions';
import type { CreatedUserApiModel, UserApiModel } from '@app-types/models';
import {
  ApiUrlParamsUtil,
  HttpVerbsUtil,
  SortingDirectionUtil,
  type JSONResponseUtil,
  type PaginationUtil,
  type ResponseWithPaginationUtil,
} from '@app-types/utility';
import type { CreateUser } from './userService.type';

const BASE_USERS_URL = '/users';

// Admins only (the API answers 403 ADMIN_ONLY to a member). Creating a user also needs a sign-in from the last
// 10 minutes (403 REAUTH_REQUIRED otherwise).
export default {
  getUsers: async ({
    pagination,
    sortingField,
    direction,
  }: GetUsersFields): Promise<ResponseWithPaginationUtil<UserApiModel>> => {
    const response = await axios.get<ResponseWithPaginationUtil<UserApiModel>>(BASE_USERS_URL, {
      params: {
        [ApiUrlParamsUtil.page]: pagination.page,
        [ApiUrlParamsUtil.pageSize]: pagination.size,
        [ApiUrlParamsUtil.sorting_fields]: sortingField,
        [ApiUrlParamsUtil.sortingDirection]: direction,
      },
    });

    return response.data;
  },

  // The answer carries the app-made temporary password, the only time it is ever sent.
  addUser: async (fields: CreateUser): Promise<JSONResponseUtil<CreatedUserApiModel>> =>
    axiosActions<CreatedUserApiModel>({ url: BASE_USERS_URL, method: HttpVerbsUtil.POST, data: fields }),
};

export const UserApiSortingFields = {
  USERNAME: 'USERNAME',
  NAME: 'NAME',
  CREATION_DATE: 'CREATION_DATE',
} as const;
export type UserApiSortingFields = (typeof UserApiSortingFields)[keyof typeof UserApiSortingFields];

export type GetUsersFields = {
  pagination: PaginationUtil;
  direction?: SortingDirectionUtil;
  sortingField?: UserApiSortingFields;
};

export const DEFAULT_USER_SORT_FIELD = UserApiSortingFields.USERNAME;
export const DEFAULT_USER_SORT_DIRECTION = SortingDirectionUtil.ASC;
