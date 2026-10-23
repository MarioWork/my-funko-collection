import { ApiUrlParamsUtil, DEFAULT_FIRST_PAGE, SortingDirectionUtil } from '@app-types/utility';
import type { SortField } from '@components/SortSelect';
import { DATE_LABELS, ALPHABETICAL_LABELS, NUMERIC_LABELS } from '@utils/sortUtils';
import {
  ItemApiSearchFields,
  ItemApiSortingFields,
  type GetItemsFields,
} from '@services/collectionItemService/collectionItemService';

export const ITEM_PAGE_SIZE = '60';
export const ITEM_OPTIONS_PAGE_SIZE = '100';

const SORT_FIELDS = new Set<string>(Object.values(ItemApiSortingFields));
const DIRECTIONS = new Set<string>(Object.values(SortingDirectionUtil));

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
