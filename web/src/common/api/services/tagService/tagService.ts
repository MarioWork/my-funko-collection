import axios from 'axios';
import { axiosActions } from '@api/axiosActions';
import type { TagApiModel, TagId } from '@app-types/models';
import {
  ApiUrlParamsUtil,
  HttpVerbsUtil,
  SortingDirectionUtil,
  type JSONResponseUtil,
  type PaginationUtil,
  type ResponseWithPaginationUtil,
} from '@app-types/utility';
import type { CreateTag, UpdateTag } from './tagService.type';

const BASE_TAGS_URL = '/tags';

export default {
  getTags: async ({
    pagination,
    sortingField,
    direction,
    ...searchFields
  }: GetTagsFields): Promise<ResponseWithPaginationUtil<TagApiModel>> => {
    const response = await axios.get<ResponseWithPaginationUtil<TagApiModel>>(BASE_TAGS_URL, {
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

  addTag: async (fields: CreateTag): Promise<JSONResponseUtil<TagApiModel>> =>
    axiosActions<TagApiModel>({ url: BASE_TAGS_URL, method: HttpVerbsUtil.POST, data: fields }),

  updateTag: async (id: TagId, fields: UpdateTag): Promise<JSONResponseUtil<TagApiModel>> =>
    axiosActions<TagApiModel>({ url: `${BASE_TAGS_URL}/${id}`, method: HttpVerbsUtil.PATCH, data: fields }),

  deleteTag: async (id: TagId): Promise<JSONResponseUtil> =>
    axiosActions({ url: `${BASE_TAGS_URL}/${id}`, method: HttpVerbsUtil.DELETE }),
};

export const TagApiSortingFields = {
  NAME: 'NAME',
  CREATION_DATE: 'CREATION_DATE',
} as const;
export type TagApiSortingFields = (typeof TagApiSortingFields)[keyof typeof TagApiSortingFields];

export const TagApiSearchFields = {
  NAME: 'name',
} as const;
export type TagApiSearchFields = (typeof TagApiSearchFields)[keyof typeof TagApiSearchFields];

type SearchFields = { [key in TagApiSearchFields]?: string };

export type GetTagsFields = {
  pagination: PaginationUtil;
  direction?: SortingDirectionUtil;
  sortingField?: TagApiSortingFields;
} & SearchFields;

export const DEFAULT_TAG_SORT_FIELD = TagApiSortingFields.NAME;
export const DEFAULT_TAG_SORT_DIRECTION = SortingDirectionUtil.ASC;
