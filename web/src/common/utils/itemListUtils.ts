import { ApiUrlParamsUtil, DEFAULT_FIRST_PAGE, SortingDirectionUtil } from '@app-types/utility';
import type { SortOption } from '@components/SortSelect';
import {
  ItemApiSearchFields,
  ItemApiSortingFields,
  type GetItemsFields,
} from '@services/collectionItemService/collectionItemService';

export const ITEM_PAGE_SIZE = '60';
export const ITEM_OPTIONS_PAGE_SIZE = '100';

const SORT_FIELDS = new Set<string>(Object.values(ItemApiSortingFields));
const DIRECTIONS = new Set<string>(Object.values(SortingDirectionUtil));

export const ITEM_SORT_OPTIONS: SortOption[] = [
  { field: ItemApiSortingFields.CREATION_DATE, direction: SortingDirectionUtil.DESC, label: 'Newest first' },
  { field: ItemApiSortingFields.CREATION_DATE, direction: SortingDirectionUtil.ASC, label: 'Oldest first' },
  { field: ItemApiSortingFields.NAME, direction: SortingDirectionUtil.ASC, label: 'Name A–Z' },
  { field: ItemApiSortingFields.NAME, direction: SortingDirectionUtil.DESC, label: 'Name Z–A' },
  { field: ItemApiSortingFields.NUMBER, direction: SortingDirectionUtil.ASC, label: 'Number, low first' },
  { field: ItemApiSortingFields.PURCHASE_DATE, direction: SortingDirectionUtil.DESC, label: 'Bought last' },
  { field: ItemApiSortingFields.PURCHASE_PRICE, direction: SortingDirectionUtil.DESC, label: 'Price, high first' },
  { field: ItemApiSortingFields.PURCHASE_PRICE, direction: SortingDirectionUtil.ASC, label: 'Price, low first' },
];

export type ItemListState = {
  fields: GetItemsFields;
  sort: { field: ItemApiSortingFields; direction: SortingDirectionUtil };
  page: number;
  pageSize: number;
};

// The items list state from the URL, shared by a collection's page and the all-items page.
export function readItemListState(searchParams: URLSearchParams): ItemListState {
  const sortParam = searchParams.get(ApiUrlParamsUtil.sorting_fields) ?? '';
  const directionParam = searchParams.get(ApiUrlParamsUtil.sortingDirection) ?? '';
  const sortingField = SORT_FIELDS.has(sortParam)
    ? (sortParam as ItemApiSortingFields)
    : ItemApiSortingFields.CREATION_DATE;
  const direction = DIRECTIONS.has(directionParam)
    ? (directionParam as SortingDirectionUtil)
    : SortingDirectionUtil.DESC;
  const page = searchParams.get(ApiUrlParamsUtil.page) ?? DEFAULT_FIRST_PAGE;
  const searchFields: Partial<Record<ItemApiSearchFields, string>> = {};

  for (const field of Object.values(ItemApiSearchFields)) {
    const value = searchParams.get(field);

    if (value) searchFields[field] = value;
  }

  return {
    fields: { pagination: { page, size: ITEM_PAGE_SIZE }, sortingField, direction, ...searchFields },
    sort: { field: sortingField, direction },
    page: Number(page),
    pageSize: Number(ITEM_PAGE_SIZE),
  };
}
