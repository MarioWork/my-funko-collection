import { getAllCollections } from '@api/optionLists';
import type { LoaderFunctionArgs } from 'react-router';
import { DEFAULT_FIRST_PAGE } from '@app-types/utility';
import collectionItemService, { ItemApiSearchFields } from '@services/collectionItemService/collectionItemService';
import funkoService from '@services/funkoService/funkoService';
import { FUNKO_ITEMS_PAGE_SIZE } from './funkoDetailUtils';

// The funko with its images, every collection (for the Lists menu) and this funko's items (per-collection blocks).
export async function loader({ params }: LoaderFunctionArgs) {
  const funkoId = Number(params.funkoId);
  const pagination = { page: DEFAULT_FIRST_PAGE, size: FUNKO_ITEMS_PAGE_SIZE };

  const [funko, collections, itemsResponse] = await Promise.all([
    funkoService.getFunko(funkoId),
    getAllCollections(),
    collectionItemService.getItems({ pagination, [ItemApiSearchFields.FUNKO_ID]: String(funkoId) }),
  ]);

  return { funko, collections, items: itemsResponse.data };
}
