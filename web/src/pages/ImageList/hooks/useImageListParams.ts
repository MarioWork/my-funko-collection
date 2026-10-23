import { useLoaderData } from 'react-router';
import { ApiUrlParamsUtil, type LoaderDataUtil } from '@app-types/utility';
import type { FilterChip } from '@components/FilterChips';
import type { SortOption } from '@components/SortSelect';
import { useListParams } from '@hooks/useListParams';
import { ImageApiSearchFields } from '@services/imageService/imageService';
import type { loader } from '../imageListLoader';
import { HAS_FUNKO_OPTIONS, IMAGE_VIEW_PARAM, ImageViewUtil } from '../imageListUtils';

// The Images page's URL state, typed: the view, the search, the "being used" filter, the sort and its chip.
export function useImageListParams() {
  const data = useLoaderData<LoaderDataUtil<typeof loader>>();
  const { getParam, setParams } = useListParams();
  const query = getParam(ImageApiSearchFields.QUERY) ?? '';
  const hasFunko = getParam(ImageApiSearchFields.HAS_FUNKO);
  const hasFunkoLabel = HAS_FUNKO_OPTIONS.find((option) => option.value === hasFunko)?.label;

  const setHasFunko = (value: string | undefined) => setParams({ [ImageApiSearchFields.HAS_FUNKO]: value });
  const chips: FilterChip[] = hasFunkoLabel
    ? [{ key: ImageApiSearchFields.HAS_FUNKO, label: hasFunkoLabel, onRemove: () => setHasFunko(undefined) }]
    : [];

  return {
    data,
    query,
    hasFunko,
    chips,
    setQuery: (value: string) => setParams({ [ImageApiSearchFields.QUERY]: value }, { isTyping: true }),
    setHasFunko,
    // The default view stays out of the URL.
    setView: (view: ImageViewUtil) =>
      setParams({ [IMAGE_VIEW_PARAM]: view === ImageViewUtil.IMAGES ? undefined : view }),
    setSort: ({ field, direction }: SortOption) =>
      setParams({ [ApiUrlParamsUtil.sorting_fields]: field, [ApiUrlParamsUtil.sortingDirection]: direction }),
    clearFilters: () => setHasFunko(undefined),
  };
}
