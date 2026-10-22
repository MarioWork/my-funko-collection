import axios from 'axios';
import { axiosActions } from '@api/axiosActions';
import type { CollectionId, CollectionItemApiModel, CollectionItemId } from '@app-types/models';
import {
  ApiUrlParamsUtil,
  HttpVerbsUtil,
  SortingDirectionUtil,
  type JSONResponseUtil,
  type PaginationUtil,
  type ResponseWithPaginationUtil,
} from '@app-types/utility';
import type { CreateCollectionItem, MoveCollectionItem, UpdateCollectionItem } from './collectionItemService.type';

const BASE_COLLECTIONS_URL = '/collections';
const BASE_ITEMS_URL = '/items';
const ITEMS_SEGMENT = 'items';
const MOVE_SEGMENT = 'move';

function listParams({ pagination, sortingField, direction, ...searchFields }: GetItemsFields) {
  return {
    [ApiUrlParamsUtil.page]: pagination.page,
    [ApiUrlParamsUtil.pageSize]: pagination.size,
    [ApiUrlParamsUtil.sorting_fields]: sortingField,
    [ApiUrlParamsUtil.sortingDirection]: direction,
    ...searchFields,
  };
}

function itemsUrl(collectionId: CollectionId): string {
  return `${BASE_COLLECTIONS_URL}/${collectionId}/${ITEMS_SEGMENT}`;
}

export default {
  getCollectionItems: async (
    collectionId: CollectionId,
    fields: GetItemsFields,
  ): Promise<ResponseWithPaginationUtil<CollectionItemApiModel>> => {
    const response = await axios.get<ResponseWithPaginationUtil<CollectionItemApiModel>>(itemsUrl(collectionId), {
      params: listParams(fields),
    });

    return response.data;
  },

  // Across every collection; `collectionId` is then an ordinary filter.
  getItems: async (fields: GetItemsFields): Promise<ResponseWithPaginationUtil<CollectionItemApiModel>> => {
    const response = await axios.get<ResponseWithPaginationUtil<CollectionItemApiModel>>(BASE_ITEMS_URL, {
      params: listParams(fields),
    });

    return response.data;
  },

  getCollectionItem: async (collectionId: CollectionId, itemId: CollectionItemId): Promise<CollectionItemApiModel> => {
    const response = await axios.get<CollectionItemApiModel>(`${itemsUrl(collectionId)}/${itemId}`);

    return response.data;
  },

  addCollectionItem: async (
    collectionId: CollectionId,
    fields: CreateCollectionItem,
  ): Promise<JSONResponseUtil<CollectionItemApiModel>> =>
    axiosActions<CollectionItemApiModel>({ url: itemsUrl(collectionId), method: HttpVerbsUtil.POST, data: fields }),

  updateCollectionItem: async (
    collectionId: CollectionId,
    itemId: CollectionItemId,
    fields: UpdateCollectionItem,
  ): Promise<JSONResponseUtil<CollectionItemApiModel>> =>
    axiosActions<CollectionItemApiModel>({
      url: `${itemsUrl(collectionId)}/${itemId}`,
      method: HttpVerbsUtil.PATCH,
      data: fields,
    }),

  moveCollectionItem: async (
    collectionId: CollectionId,
    itemId: CollectionItemId,
    fields: MoveCollectionItem,
  ): Promise<JSONResponseUtil<CollectionItemApiModel>> =>
    axiosActions<CollectionItemApiModel>({
      url: `${itemsUrl(collectionId)}/${itemId}/${MOVE_SEGMENT}`,
      method: HttpVerbsUtil.POST,
      data: fields,
    }),

  deleteCollectionItem: async (collectionId: CollectionId, itemId: CollectionItemId): Promise<JSONResponseUtil> =>
    axiosActions({ url: `${itemsUrl(collectionId)}/${itemId}`, method: HttpVerbsUtil.DELETE }),
};

export const ItemApiSortingFields = {
  NAME: 'NAME',
  NUMBER: 'NUMBER',
  CREATION_DATE: 'CREATION_DATE',
  UPDATE_DATE: 'UPDATE_DATE',
  PURCHASE_DATE: 'PURCHASE_DATE',
  PURCHASE_PRICE: 'PURCHASE_PRICE',
} as const;
export type ItemApiSortingFields = (typeof ItemApiSortingFields)[keyof typeof ItemApiSortingFields];

export const ItemApiSearchFields = {
  NAME: 'name',
  FUNKO_ID: 'funkoId',
  TAG_ID: 'tagId',
  CATEGORY_ID: 'categoryId',
  CONDITION: 'condition',
  PURCHASED_FROM: 'purchasedFrom',
  PURCHASED_TO: 'purchasedTo',
  COLLECTION_ID: 'collectionId',
} as const;
export type ItemApiSearchFields = (typeof ItemApiSearchFields)[keyof typeof ItemApiSearchFields];

type SearchFields = { [key in ItemApiSearchFields]?: string };

export type GetItemsFields = {
  pagination: PaginationUtil;
  direction?: SortingDirectionUtil;
  sortingField?: ItemApiSortingFields;
} & SearchFields;

export const DEFAULT_ITEM_SORT_FIELD = ItemApiSortingFields.CREATION_DATE;
export const DEFAULT_ITEM_SORT_DIRECTION = SortingDirectionUtil.DESC;
