import axios from 'axios';
import { axiosActions } from '@api/axiosActions';
import type { CollectionApiModel, CollectionId } from '@app-types/models';
import {
  ApiUrlParamsUtil,
  HttpVerbsUtil,
  SortingDirectionUtil,
  type JSONResponseUtil,
  type PaginationUtil,
  type ResponseWithPaginationUtil,
} from '@app-types/utility';
import type { CreateCollection, UpdateCollection } from './collectionService.type';

const BASE_COLLECTIONS_URL = '/collections';

export default {
  getCollections: async ({
    pagination,
    sortingField,
    direction,
    ...searchFields
  }: GetCollectionsFields): Promise<ResponseWithPaginationUtil<CollectionApiModel>> => {
    const response = await axios.get<ResponseWithPaginationUtil<CollectionApiModel>>(BASE_COLLECTIONS_URL, {
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

  getCollection: async (id: CollectionId): Promise<CollectionApiModel> => {
    const response = await axios.get<CollectionApiModel>(`${BASE_COLLECTIONS_URL}/${id}`);

    return response.data;
  },

  addCollection: async (fields: CreateCollection): Promise<JSONResponseUtil<CollectionApiModel>> =>
    axiosActions<CollectionApiModel>({ url: BASE_COLLECTIONS_URL, method: HttpVerbsUtil.POST, data: fields }),

  updateCollection: async (id: CollectionId, fields: UpdateCollection): Promise<JSONResponseUtil<CollectionApiModel>> =>
    axiosActions<CollectionApiModel>({
      url: `${BASE_COLLECTIONS_URL}/${id}`,
      method: HttpVerbsUtil.PATCH,
      data: fields,
    }),

  deleteCollection: async (id: CollectionId): Promise<JSONResponseUtil> =>
    axiosActions({ url: `${BASE_COLLECTIONS_URL}/${id}`, method: HttpVerbsUtil.DELETE }),
};

export const CollectionApiSortingFields = {
  NAME: 'NAME',
  CREATION_DATE: 'CREATION_DATE',
} as const;
export type CollectionApiSortingFields = (typeof CollectionApiSortingFields)[keyof typeof CollectionApiSortingFields];

export const CollectionApiSearchFields = {
  NAME: 'name',
} as const;
export type CollectionApiSearchFields = (typeof CollectionApiSearchFields)[keyof typeof CollectionApiSearchFields];

type SearchFields = { [key in CollectionApiSearchFields]?: string };

export type GetCollectionsFields = {
  pagination: PaginationUtil;
  direction?: SortingDirectionUtil;
  sortingField?: CollectionApiSortingFields;
} & SearchFields;

export const DEFAULT_COLLECTION_SORT_FIELD = CollectionApiSortingFields.NAME;
