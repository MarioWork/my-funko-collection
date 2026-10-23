import { useLoaderData } from 'react-router';
import { ApiUrlParamsUtil, type LoaderDataUtil } from '@app-types/utility';
import type { FilterChip } from '@components/FilterChips';
import type { SortOption } from '@components/SortSelect';
import { useListParams } from '@hooks/useListParams';
import { ImageApiSearchFields } from '@services/imageService/imageService';
import type { loader } from '../imageListLoader';
import { useLocalStorage } from '@hooks/useLocalStorage';
import { DEFAULT_IMAGE_VIEW, IMAGE_VIEW_STORAGE_KEY, type ImageViewUtil } from '@utils/layoutUtils';
import { HAS_FUNKO_OPTIONS, IMAGE_VIEW_PARAM } from '../imageListUtils';

// The Images page's URL state, typed: the view, the search, the "being used" filter, the sort and its chip.
export function useImageListParams() {
  const data = useLoaderData<LoaderDataUtil<typeof loader>>();
  const { getParam, setParams } = useListParams();
  const [, setStoredView] = useLocalStorage<ImageViewUtil>(IMAGE_VIEW_STORAGE_KEY, DEFAULT_IMAGE_VIEW);
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
    // Picking a view saves it as this device's default (like the other lists' layouts) and puts it in the URL.
    setView: (view: ImageViewUtil) => {
      setStoredView(view);
      setParams({ [IMAGE_VIEW_PARAM]: view });
    },
    setSort: ({ field, direction }: SortOption) =>
      setParams({ [ApiUrlParamsUtil.sorting_fields]: field, [ApiUrlParamsUtil.sortingDirection]: direction }),
    clearFilters: () => setHasFunko(undefined),
  };
}
