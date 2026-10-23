import type { CategoryApiModel, CollectionApiModel, NamedApiModel, TagApiModel } from '@app-types/models';
import { ApiUrlParamsUtil, ITEM_CONDITION_LABELS, type ItemConditionUtil } from '@app-types/utility';
import type { FilterChip } from '@components/FilterChips';
import type { SortOption } from '@components/SortSelect';
import { ItemApiSearchFields } from '@services/collectionItemService/collectionItemService';
import { formatIsoDate } from '@utils/dateUtils';
import { useListParams } from './useListParams';

type Options = {
  categories: CategoryApiModel[];
  tags: TagApiModel[];
  collections: CollectionApiModel[];
  hasCollectionFilter: boolean;
};

export const ITEM_FILTER_FIELDS = [
  ItemApiSearchFields.COLLECTION_ID,
  ItemApiSearchFields.TAG_ID,
  ItemApiSearchFields.CATEGORY_ID,
  ItemApiSearchFields.CONDITION,
  ItemApiSearchFields.PURCHASED_FROM,
  ItemApiSearchFields.PURCHASED_TO,
] as const;

export type ItemFilterField = (typeof ITEM_FILTER_FIELDS)[number];

// The items list's URL state: search text, filters (with chip labels), sort.
export function useItemListParams({ categories, tags, collections, hasCollectionFilter }: Options) {
  const { getParam, setParams, clearParams } = useListParams();
  const nameOf = (rows: NamedApiModel[], id: string) => rows.find((row) => String(row.id) === id)?.name ?? id;
  const activeFields = ITEM_FILTER_FIELDS.filter(
    (field) => hasCollectionFilter || field !== ItemApiSearchFields.COLLECTION_ID,
  );

  const query = getParam(ItemApiSearchFields.NAME) ?? '';
  const filters = Object.fromEntries(activeFields.map((field) => [field, getParam(field)])) as Record<
    ItemFilterField,
    string | undefined
  >;

  const chipLabels: Record<ItemFilterField, (value: string) => string> = {
    [ItemApiSearchFields.COLLECTION_ID]: (value) => `Collection: ${nameOf(collections, value)}`,
    [ItemApiSearchFields.TAG_ID]: (value) => `Tag: ${nameOf(tags, value)}`,
    [ItemApiSearchFields.CATEGORY_ID]: (value) => `Category: ${nameOf(categories, value)}`,
    [ItemApiSearchFields.CONDITION]: (value) =>
      `Condition: ${ITEM_CONDITION_LABELS[value as ItemConditionUtil] ?? value}`,
    [ItemApiSearchFields.PURCHASED_FROM]: (value) => `Bought from ${formatIsoDate(value)}`,
    [ItemApiSearchFields.PURCHASED_TO]: (value) => `Bought until ${formatIsoDate(value)}`,
  };

  const chips: FilterChip[] = activeFields.flatMap((field) => {
    const value = filters[field];

    return value
      ? [{ key: field, label: chipLabels[field](value), onRemove: () => setParams({ [field]: undefined }) }]
      : [];
  });

  return {
    query,
    filters,
    chips,
    setQuery: (value: string) => setParams({ [ItemApiSearchFields.NAME]: value }, { isTyping: true }),
    setFilter: (field: ItemFilterField, value: string | undefined) => setParams({ [field]: value }),
    setSort: ({ field, direction }: SortOption) =>
      setParams({ [ApiUrlParamsUtil.sorting_fields]: field, [ApiUrlParamsUtil.sortingDirection]: direction }),
    clearFilters: () => clearParams([...activeFields]),
  };
}
