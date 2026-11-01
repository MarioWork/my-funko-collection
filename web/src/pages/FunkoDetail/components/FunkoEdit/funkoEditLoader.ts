import { getAllCategories, getAllCollections, getAllSeries, getAllTags } from '@api/optionLists';
import type { LoaderFunctionArgs } from 'react-router';
import { DEFAULT_FIRST_PAGE } from '@app-types/utility';
import collectionItemService, { ItemApiSearchFields } from '@services/collectionItemService/collectionItemService';
import funkoService from '@services/funkoService/funkoService';
import { assertCanWrite } from '@utils/readOnlyRouteUtils';
import { assertCanEditFunko } from './funkoEditUtils';
import { FUNKO_ITEMS_PAGE_SIZE } from '../../funkoDetailUtils';

// The funko with its photos, the form's options (categories, collections, tags) and the collections it is in now.
// An admin edits any funko; a member only their own waiting submission; a read-only user none.
export async function loader({ params, context }: LoaderFunctionArgs) {
  assertCanWrite(context);

  const funkoId = Number(params.funkoId);
  const pagination = { page: DEFAULT_FIRST_PAGE, size: FUNKO_ITEMS_PAGE_SIZE };

  const [funko, categories, series, collections, tags, itemsResponse] = await Promise.all([
    funkoService.getFunko(funkoId),
    getAllCategories(),
    getAllSeries(),
    getAllCollections(),
    getAllTags(),
    collectionItemService.getItems({ pagination, [ItemApiSearchFields.FUNKO_ID]: String(funkoId) }),
  ]);

  assertCanEditFunko(context, funko);

  return {
    funko,
    categories,
    series,
    collections,
    tags,
    items: itemsResponse.data,
  };
}
