import { DEFAULT_FIRST_PAGE } from '@app-types/utility';
import seriesService, { DEFAULT_SERIES_SORT_FIELD } from '@services/seriesService/seriesService';
import { ITEM_OPTIONS_PAGE_SIZE } from '@utils/itemListUtils';

export async function loader() {
  const seriesResponse = await seriesService.getSeriesList({
    pagination: { page: DEFAULT_FIRST_PAGE, size: ITEM_OPTIONS_PAGE_SIZE },
    sortingField: DEFAULT_SERIES_SORT_FIELD,
  });

  return { series: seriesResponse.data };
}
