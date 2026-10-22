import axios from 'axios';
import { axiosActions } from '@api/axiosActions';
import type { FunkoApiModel, FunkoDetailApiModel, FunkoId } from '@app-types/models';
import {
  ApiUrlParamsUtil,
  HttpVerbsUtil,
  SortingDirectionUtil,
  type JSONResponseUtil,
  type PaginationUtil,
  type ResponseWithPaginationUtil,
} from '@app-types/utility';
import type { CreateFunko, DeleteFunkoOptions, UpdateFunko } from './funkoService.type';

const BASE_FUNKOS_URL = '/funkos';
const BY_BARCODE_SEGMENT = 'by-barcode';
const FORCE_PARAM = 'force';

export default {
  // The one search: `q` over every field, the named fields narrow one each. All ANDed by the API.
  getFunkos: async ({
    pagination,
    sortingField,
    direction,
    ...searchFields
  }: GetFunkosFields): Promise<ResponseWithPaginationUtil<FunkoApiModel>> => {
    const response = await axios.get<ResponseWithPaginationUtil<FunkoApiModel>>(BASE_FUNKOS_URL, {
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

  getFunko: async (id: FunkoId): Promise<FunkoDetailApiModel> => {
    const response = await axios.get<FunkoDetailApiModel>(`${BASE_FUNKOS_URL}/${id}`);

    return response.data;
  },

  getFunkoByBarcode: async (barcode: string): Promise<FunkoApiModel> => {
    const response = await axios.get<FunkoApiModel>(`${BASE_FUNKOS_URL}/${BY_BARCODE_SEGMENT}/${barcode}`);

    return response.data;
  },

  addFunko: async (fields: CreateFunko): Promise<JSONResponseUtil<FunkoApiModel>> =>
    axiosActions<FunkoApiModel>({ url: BASE_FUNKOS_URL, method: HttpVerbsUtil.POST, data: fields }),

  updateFunko: async (id: FunkoId, fields: UpdateFunko): Promise<JSONResponseUtil<FunkoApiModel>> =>
    axiosActions<FunkoApiModel>({ url: `${BASE_FUNKOS_URL}/${id}`, method: HttpVerbsUtil.PATCH, data: fields }),

  deleteFunko: async (id: FunkoId, { force = false }: DeleteFunkoOptions = {}): Promise<JSONResponseUtil> =>
    axiosActions({
      url: `${BASE_FUNKOS_URL}/${id}`,
      method: HttpVerbsUtil.DELETE,
      params: force ? { [FORCE_PARAM]: 'true' } : undefined,
    }),
};

export const FunkoApiSortingFields = {
  RELEVANCE: 'RELEVANCE',
  NAME: 'NAME',
  NUMBER: 'NUMBER',
  CREATION_DATE: 'CREATION_DATE',
  CATEGORY: 'CATEGORY',
} as const;
export type FunkoApiSortingFields = (typeof FunkoApiSortingFields)[keyof typeof FunkoApiSortingFields];

// Wire names of every filter `GET /funkos` accepts. Id lists travel as comma-separated strings.
export const FunkoApiSearchFields = {
  QUERY: 'q',
  NAME: 'name',
  NUMBER: 'number',
  BARCODE: 'barcode',
  EXCLUSIVE: 'exclusive',
  TYPE: 'type',
  IS_CHASE: 'isChase',
  CATEGORY_ID: 'categoryId',
  CATEGORY: 'category',
  TAG_ID: 'tagId',
  TAG: 'tag',
  COLLECTION_ID: 'collectionId',
  COLLECTION: 'collection',
  NOT_IN_COLLECTION_ID: 'notInCollectionId',
  HAS_IMAGES: 'hasImages',
} as const;
export type FunkoApiSearchFields = (typeof FunkoApiSearchFields)[keyof typeof FunkoApiSearchFields];

type SearchFields = { [key in FunkoApiSearchFields]?: string };

export type GetFunkosFields = {
  pagination: PaginationUtil;
  direction?: SortingDirectionUtil;
  sortingField?: FunkoApiSortingFields;
} & SearchFields;

export const DEFAULT_FUNKO_SORT_FIELD = FunkoApiSortingFields.NAME;
export const DEFAULT_FUNKO_SORT_DIRECTION = SortingDirectionUtil.ASC;
