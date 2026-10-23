import axios from 'axios';
import { axiosActions } from '@api/axiosActions';
import type { CategoryApiModel, CategoryId } from '@app-types/models';
import {
  ApiUrlParamsUtil,
  HttpVerbsUtil,
  SortingDirectionUtil,
  type JSONResponseUtil,
  type PaginationUtil,
  type ResponseWithPaginationUtil,
} from '@app-types/utility';
import type { CreateCategory, UpdateCategory } from './categoryService.type';

const BASE_CATEGORIES_URL = '/categories';

export default {
  getCategories: async ({
    pagination,
    sortingField,
    direction,
    ...searchFields
  }: GetCategoriesFields): Promise<ResponseWithPaginationUtil<CategoryApiModel>> => {
    const response = await axios.get<ResponseWithPaginationUtil<CategoryApiModel>>(BASE_CATEGORIES_URL, {
      params: {
        [ApiUrlParamsUtil.page]: pagination.page,
        [ApiUrlParamsUtil.pageSize]: pagination.size,
        [ApiUrlParamsUtil.sorting_fields]: sortingField,
        [ApiUrlParamsUtil.sortingDirection]: direction,
        ...searchFields,
      },
    });

    return response.data;
  },

  addCategory: async (fields: CreateCategory): Promise<JSONResponseUtil<CategoryApiModel>> =>
    axiosActions<CategoryApiModel>({ url: BASE_CATEGORIES_URL, method: HttpVerbsUtil.POST, data: fields }),

  updateCategory: async (id: CategoryId, fields: UpdateCategory): Promise<JSONResponseUtil<CategoryApiModel>> =>
    axiosActions<CategoryApiModel>({ url: `${BASE_CATEGORIES_URL}/${id}`, method: HttpVerbsUtil.PATCH, data: fields }),

  deleteCategory: async (id: CategoryId): Promise<JSONResponseUtil> =>
    axiosActions({ url: `${BASE_CATEGORIES_URL}/${id}`, method: HttpVerbsUtil.DELETE }),
};

export const CategoryApiSortingFields = {
  NAME: 'NAME',
  CREATION_DATE: 'CREATION_DATE',
} as const;
export type CategoryApiSortingFields = (typeof CategoryApiSortingFields)[keyof typeof CategoryApiSortingFields];

export const CategoryApiSearchFields = {
  NAME: 'name',
} as const;
export type CategoryApiSearchFields = (typeof CategoryApiSearchFields)[keyof typeof CategoryApiSearchFields];

type SearchFields = { [key in CategoryApiSearchFields]?: string };

export type GetCategoriesFields = {
  pagination: PaginationUtil;
  direction?: SortingDirectionUtil;
  sortingField?: CategoryApiSortingFields;
} & SearchFields;

export const DEFAULT_CATEGORY_SORT_FIELD = CategoryApiSortingFields.NAME;
export const DEFAULT_CATEGORY_SORT_DIRECTION = SortingDirectionUtil.ASC;
