import { useLoaderData } from 'react-router';
import { ApiUrlParamsUtil, FUNKO_TYPE_LABELS, type FunkoTypeUtil, type LoaderDataUtil } from '@app-types/utility';
import type { FilterChip } from '@components/FilterChips';
import type { SortOption } from '@components/SortSelect';
import { useListParams } from '@hooks/useListParams';
import { FunkoApiSearchFields } from '@services/funkoService/funkoService';
import type { loader } from '../funkoListLoader';

const FILTER_FIELDS = [
  FunkoApiSearchFields.CATEGORY_ID,
  FunkoApiSearchFields.TYPE,
  FunkoApiSearchFields.IS_CHASE,
  FunkoApiSearchFields.COLLECTION_ID,
  FunkoApiSearchFields.NOT_IN_COLLECTION_ID,
  FunkoApiSearchFields.TAG_ID,
  FunkoApiSearchFields.HAS_IMAGES,
] as const;

type FilterField = (typeof FILTER_FIELDS)[number];

// The list's URL state, typed: the query, each filter, the sort, and the chips that describe the active filters.
export function useFunkoListParams() {
  const data = useLoaderData<LoaderDataUtil<typeof loader>>();
  const { getParam, setParams, clearParams } = useListParams();
  const nameOf = (rows: { id: number; name: string }[], id: string | undefined) =>
    rows.find((row) => String(row.id) === id)?.name ?? id ?? '';

  const query = getParam(FunkoApiSearchFields.QUERY) ?? '';
  const filters: Record<FilterField, string | undefined> = {
    [FunkoApiSearchFields.CATEGORY_ID]: getParam(FunkoApiSearchFields.CATEGORY_ID),
    [FunkoApiSearchFields.TYPE]: getParam(FunkoApiSearchFields.TYPE),
    [FunkoApiSearchFields.IS_CHASE]: getParam(FunkoApiSearchFields.IS_CHASE),
    [FunkoApiSearchFields.COLLECTION_ID]: getParam(FunkoApiSearchFields.COLLECTION_ID),
    [FunkoApiSearchFields.NOT_IN_COLLECTION_ID]: getParam(FunkoApiSearchFields.NOT_IN_COLLECTION_ID),
    [FunkoApiSearchFields.TAG_ID]: getParam(FunkoApiSearchFields.TAG_ID),
    [FunkoApiSearchFields.HAS_IMAGES]: getParam(FunkoApiSearchFields.HAS_IMAGES),
  };

  const chipLabels: Record<FilterField, (value: string) => string> = {
    [FunkoApiSearchFields.CATEGORY_ID]: (value) => `Category: ${nameOf(data.categories, value)}`,
    [FunkoApiSearchFields.TYPE]: (value) => `Type: ${FUNKO_TYPE_LABELS[value as FunkoTypeUtil] ?? value}`,
    [FunkoApiSearchFields.IS_CHASE]: (value) => (value === 'true' ? 'Chase only' : 'No chase'),
    [FunkoApiSearchFields.COLLECTION_ID]: (value) => `In: ${nameOf(data.collections, value)}`,
    [FunkoApiSearchFields.NOT_IN_COLLECTION_ID]: (value) => `Not in: ${nameOf(data.collections, value)}`,
    [FunkoApiSearchFields.TAG_ID]: (value) => `Tag: ${nameOf(data.tags, value)}`,
    [FunkoApiSearchFields.HAS_IMAGES]: (value) => (value === 'true' ? 'With photos' : 'Without photos'),
  };

  const chips: FilterChip[] = FILTER_FIELDS.flatMap((field) => {
    const value = filters[field];

    return value
      ? [{ key: field, label: chipLabels[field](value), onRemove: () => setParams({ [field]: undefined }) }]
      : [];
  });

  const setFilter = (field: FilterField, value: string | undefined) => setParams({ [field]: value });
  const setQuery = (value: string) => setParams({ [FunkoApiSearchFields.QUERY]: value });
  const setSort = ({ field, direction }: SortOption) =>
    setParams({ [ApiUrlParamsUtil.sorting_fields]: field, [ApiUrlParamsUtil.sortingDirection]: direction });
  const clearFilters = () => clearParams([...FILTER_FIELDS]);

  return { data, query, filters, chips, setQuery, setFilter, setSort, clearFilters };
}

export type FunkoFilterField = FilterField;
