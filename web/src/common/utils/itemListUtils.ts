import { ApiUrlParamsUtil, DEFAULT_FIRST_PAGE, SortingDirectionUtil } from '@app-types/utility';
import type { SortField, SortOption } from '@components/SortSelect';
import { readSearchFields, readSortDirection, readSortField } from '@utils/listParamsUtils';
import { DATE_LABELS, ALPHABETICAL_LABELS, NUMERIC_LABELS } from '@utils/sortUtils';
import {
  DEFAULT_ITEM_SORT_DIRECTION,
  DEFAULT_ITEM_SORT_FIELD,
  ItemApiSearchFields,
  ItemApiSortingFields,
  type GetItemsFields,
} from '@services/collectionItemService/collectionItemService';

const ITEM_PAGE_SIZE = '60';

const SORT_FIELDS = Object.values(ItemApiSortingFields);
const SEARCH_FIELDS = Object.values(ItemApiSearchFields);

export const ITEM_SORT_FIELDS: SortField[] = [
  {
    field: ItemApiSortingFields.CREATION_DATE,
    label: 'Date added',
    defaultDirection: SortingDirectionUtil.DESC,
    directionLabels: DATE_LABELS,
  },
  {
    field: ItemApiSortingFields.NAME,
    label: 'Name',
    defaultDirection: SortingDirectionUtil.ASC,
    directionLabels: ALPHABETICAL_LABELS,
  },
  {
    field: ItemApiSortingFields.NUMBER,
    label: 'Number',
    defaultDirection: SortingDirectionUtil.ASC,
    directionLabels: NUMERIC_LABELS,
  },
  {
    field: ItemApiSortingFields.PURCHASE_DATE,
    label: 'Date bought',
    defaultDirection: SortingDirectionUtil.DESC,
    directionLabels: DATE_LABELS,
  },
  {
    field: ItemApiSortingFields.PURCHASE_PRICE,
    label: 'Price',
    defaultDirection: SortingDirectionUtil.DESC,
    directionLabels: NUMERIC_LABELS,
  },
];

export type ItemListState = {
  fields: GetItemsFields;
  sort: SortOption;
  page: number;
  pageSize: number;
};

// The items list state from the URL, shared by a collection's page and the all-items page.
export function readItemListState(searchParams: URLSearchParams): ItemListState {
  const sortParam = searchParams.get(ApiUrlParamsUtil.sorting_fields) ?? '';
  const directionParam = searchParams.get(ApiUrlParamsUtil.sortingDirection) ?? '';
  const sortingField = readSortField(sortParam, SORT_FIELDS) ?? DEFAULT_ITEM_SORT_FIELD;
  const direction = readSortDirection(directionParam) ?? DEFAULT_ITEM_SORT_DIRECTION;
  const page = searchParams.get(ApiUrlParamsUtil.page) ?? DEFAULT_FIRST_PAGE;
  const searchFields = readSearchFields(searchParams, SEARCH_FIELDS);

  return {
    fields: { pagination: { page, size: ITEM_PAGE_SIZE }, sortingField, direction, ...searchFields },
    sort: { field: sortingField, direction },
    page: Number(page),
    pageSize: Number(ITEM_PAGE_SIZE),
  };
}
