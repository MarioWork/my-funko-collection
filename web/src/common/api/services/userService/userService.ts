import axios from 'axios';
import { axiosActions } from '@api/axiosActions';
import type { UserApiModel, UserId, UserWithTemporaryPasswordApiModel } from '@app-types/models';
import {
  ApiUrlParamsUtil,
  HttpVerbsUtil,
  SortingDirectionUtil,
  type JSONResponseUtil,
  type PaginationUtil,
  type ResponseWithPaginationUtil,
} from '@app-types/utility';
import type { CreateUser, CreateTemporaryPassword, UpdateUser } from './userService.type';

const BASE_USERS_URL = '/users';

// Admins only (the API answers 403 ADMIN_ONLY to a member). Every write also needs a sign-in from the last
// 10 minutes (403 REAUTH_REQUIRED otherwise). A role change, a new temporary password and a delete end every session
// of that user; the last admin can't be made a member or deleted (409 LAST_ADMIN).
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
  addUser: async (fields: CreateUser): Promise<JSONResponseUtil<UserWithTemporaryPasswordApiModel>> =>
    axiosActions<UserWithTemporaryPasswordApiModel>({ url: BASE_USERS_URL, method: HttpVerbsUtil.POST, data: fields }),

  updateUser: async (id: UserId, fields: UpdateUser): Promise<JSONResponseUtil<UserApiModel>> =>
    axiosActions<UserApiModel>({ url: `${BASE_USERS_URL}/${id}`, method: HttpVerbsUtil.PATCH, data: fields }),

  // For a user who forgot their password. The answer carries the new temporary password, the only time it is sent.
  addTemporaryPassword: async (
    id: UserId,
    fields: CreateTemporaryPassword,
  ): Promise<JSONResponseUtil<UserWithTemporaryPasswordApiModel>> =>
    axiosActions<UserWithTemporaryPasswordApiModel>({
      url: `${BASE_USERS_URL}/${id}/temporary-password`,
      method: HttpVerbsUtil.POST,
      data: fields,
    }),

  deleteUser: async (id: UserId): Promise<JSONResponseUtil> =>
    axiosActions({ url: `${BASE_USERS_URL}/${id}`, method: HttpVerbsUtil.DELETE }),
};

// The codes the user writes answer with that a page reacts to.
export const UserApiErrorCodes = {
  LAST_ADMIN: 'LAST_ADMIN',
  USERNAME_REQUIRED: 'USERNAME_REQUIRED',
} as const;
export type UserApiErrorCodes = (typeof UserApiErrorCodes)[keyof typeof UserApiErrorCodes];

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
