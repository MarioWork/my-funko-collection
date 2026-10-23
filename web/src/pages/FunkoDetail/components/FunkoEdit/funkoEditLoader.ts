import { getAllCategories, getAllCollections, getAllSeries, getAllTags } from '@api/optionLists';
import type { LoaderFunctionArgs } from 'react-router';
import { DEFAULT_FIRST_PAGE } from '@app-types/utility';
import collectionItemService, { ItemApiSearchFields } from '@services/collectionItemService/collectionItemService';
import funkoService from '@services/funkoService/funkoService';

const OPTIONS_PAGE_SIZE = '100';

// The funko with its photos, the form's options (categories, collections, tags) and the collections it is in now.
export async function loader({ params }: LoaderFunctionArgs) {
  const funkoId = Number(params.funkoId);
  const pagination = { page: DEFAULT_FIRST_PAGE, size: OPTIONS_PAGE_SIZE };

  const [funko, categories, series, collections, tags, itemsResponse] = await Promise.all([
    funkoService.getFunko(funkoId),
    getAllCategories(),
    getAllSeries(),
    getAllCollections(),
    getAllTags(),
    collectionItemService.getItems({ pagination, [ItemApiSearchFields.FUNKO_ID]: String(funkoId) }),
  ]);

  return {
    funko,
    categories,
    series,
    collections,
    tags,
    items: itemsResponse.data,
  };
}
