import { getAllCategories, getAllCollections, getAllTags } from '@api/optionLists';
import type { LoaderFunctionArgs } from 'react-router';
import collectionItemService from '@services/collectionItemService/collectionItemService';
import collectionService from '@services/collectionService/collectionService';
import { readItemListState } from '@utils/itemListUtils';

// The collection, its items for the URL's filters and page, and the options the toolbar and menus need.
export async function loader({ request, params }: LoaderFunctionArgs) {
  const collectionId = Number(params.collectionId);
  const state = readItemListState(new URL(request.url).searchParams);

  const [collection, itemsResponse, categories, tags, collections] = await Promise.all([
    collectionService.getCollection(collectionId),
    collectionItemService.getCollectionItems(collectionId, state.fields),
    getAllCategories(),
    getAllTags(),
    getAllCollections(),
  ]);

  return {
    collection,
    itemsResponse,
    categories,
    tags,
    collections,
    sort: state.sort,
    page: state.page,
    pageSize: state.pageSize,
  };
}
