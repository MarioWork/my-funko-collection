import { DEFAULT_FIRST_PAGE, SortingDirectionUtil } from '@app-types/utility';
import funkoService, { FunkoApiSortingFields } from '@services/funkoService/funkoService';
import statsService from '@services/statsService/statsService';
import { RECENT_FUNKOS_PAGE_SIZE } from './homeUtils';

export async function loader() {
  const [stats, recentResponse] = await Promise.all([
    statsService.getStats(),
    funkoService.getFunkos({
      pagination: { page: DEFAULT_FIRST_PAGE, size: RECENT_FUNKOS_PAGE_SIZE },
      sortingField: FunkoApiSortingFields.CREATION_DATE,
      direction: SortingDirectionUtil.DESC,
    }),
  ]);

  return { stats, recentFunkos: recentResponse.data };
}
