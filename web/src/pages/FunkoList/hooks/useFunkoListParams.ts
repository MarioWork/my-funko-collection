import { useLoaderData } from 'react-router';
import type { NamedApiModel } from '@app-types/models';
import { ApiUrlParamsUtil, FUNKO_TYPE_LABELS, type FunkoTypeUtil, type LoaderDataUtil } from '@app-types/utility';
import type { FilterChip } from '@components/FilterChips';
import type { SortOption } from '@components/SortSelect';
import { useListParams } from '@hooks/useListParams';
import { FunkoApiSearchFields } from '@services/funkoService/funkoService';
import type { loader } from '../funkoListLoader';
import { TRUE_VALUE } from '../funkoListUtils';

const FILTER_FIELDS = [
  FunkoApiSearchFields.CATEGORY_ID,
  FunkoApiSearchFields.SERIES_ID,
  FunkoApiSearchFields.HAS_SERIES,
  FunkoApiSearchFields.TYPE,
  FunkoApiSearchFields.IS_CHASE,
  FunkoApiSearchFields.COLLECTION_ID,
  FunkoApiSearchFields.HAS_COLLECTIONS,
  FunkoApiSearchFields.TAG_ID,
  FunkoApiSearchFields.HAS_TAGS,
  FunkoApiSearchFields.HAS_IMAGES,
] as const;

type FilterField = (typeof FILTER_FIELDS)[number];

type FilterUpdates = Partial<Record<FilterField, string | undefined>>;

// The list's URL state, typed: the query, each filter, the sort, and the chips that describe the active filters.
export function useFunkoListParams() {
  const data = useLoaderData<LoaderDataUtil<typeof loader>>();
  const { getParam, setParams, clearParams } = useListParams();
  const nameOf = (rows: NamedApiModel[], id: string | undefined) =>
    rows.find((row) => String(row.id) === id)?.name ?? id ?? '';

  const query = getParam(FunkoApiSearchFields.QUERY) ?? '';
  const filters: Record<FilterField, string | undefined> = {
    [FunkoApiSearchFields.CATEGORY_ID]: getParam(FunkoApiSearchFields.CATEGORY_ID),
    [FunkoApiSearchFields.SERIES_ID]: getParam(FunkoApiSearchFields.SERIES_ID),
    [FunkoApiSearchFields.TYPE]: getParam(FunkoApiSearchFields.TYPE),
    [FunkoApiSearchFields.IS_CHASE]: getParam(FunkoApiSearchFields.IS_CHASE),
    [FunkoApiSearchFields.HAS_SERIES]: getParam(FunkoApiSearchFields.HAS_SERIES),
    [FunkoApiSearchFields.COLLECTION_ID]: getParam(FunkoApiSearchFields.COLLECTION_ID),
    [FunkoApiSearchFields.HAS_COLLECTIONS]: getParam(FunkoApiSearchFields.HAS_COLLECTIONS),
    [FunkoApiSearchFields.TAG_ID]: getParam(FunkoApiSearchFields.TAG_ID),
    [FunkoApiSearchFields.HAS_TAGS]: getParam(FunkoApiSearchFields.HAS_TAGS),
    [FunkoApiSearchFields.HAS_IMAGES]: getParam(FunkoApiSearchFields.HAS_IMAGES),
  };

  const chipLabels: Record<FilterField, (value: string) => string> = {
    [FunkoApiSearchFields.CATEGORY_ID]: (value) => `Category: ${nameOf(data.categories, value)}`,
    [FunkoApiSearchFields.SERIES_ID]: (value) => `Series: ${nameOf(data.series, value)}`,
    [FunkoApiSearchFields.TYPE]: (value) => `Type: ${FUNKO_TYPE_LABELS[value as FunkoTypeUtil] ?? value}`,
    [FunkoApiSearchFields.IS_CHASE]: (value) => (value === TRUE_VALUE ? 'Chase only' : 'No chase'),
    [FunkoApiSearchFields.HAS_SERIES]: (value) => (value === TRUE_VALUE ? 'Has a series' : 'No series'),
    [FunkoApiSearchFields.COLLECTION_ID]: (value) => `In: ${nameOf(data.collections, value)}`,
    [FunkoApiSearchFields.HAS_COLLECTIONS]: (value) => (value === TRUE_VALUE ? 'In a collection' : 'No collections'),
    [FunkoApiSearchFields.TAG_ID]: (value) => `Tag: ${nameOf(data.tags, value)}`,
    [FunkoApiSearchFields.HAS_TAGS]: (value) => (value === TRUE_VALUE ? 'Has tags' : 'No tags'),
    [FunkoApiSearchFields.HAS_IMAGES]: (value) => (value === TRUE_VALUE ? 'Has images' : 'No images'),
  };

  const chips: FilterChip[] = FILTER_FIELDS.flatMap((field) => {
    const value = filters[field];

    return value
      ? [{ key: field, label: chipLabels[field](value), onRemove: () => setParams({ [field]: undefined }) }]
      : [];
  });

  const setFilter = (field: FilterField, value: string | undefined) => setParams({ [field]: value });
  // Several fields in one URL change: picking "None" in a select clears its id and sets its has… flag together.
  const setFilters = (updates: FilterUpdates) => setParams(updates);
  const setQuery = (value: string) => setParams({ [FunkoApiSearchFields.QUERY]: value }, { isTyping: true });
  const setSort = ({ field, direction }: SortOption) =>
    setParams({ [ApiUrlParamsUtil.sorting_fields]: field, [ApiUrlParamsUtil.sortingDirection]: direction });
  const clearFilters = () => clearParams([...FILTER_FIELDS]);

  return { data, query, filters, chips, setQuery, setFilter, setFilters, setSort, clearFilters };
}

export type FunkoFilterField = FilterField;
export type FunkoFilterUpdates = FilterUpdates;
