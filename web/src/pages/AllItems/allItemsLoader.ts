import { getAllCategories, getAllCollections, getAllTags } from '@api/optionLists';
import type { LoaderFunctionArgs } from 'react-router';
import collectionItemService from '@services/collectionItemService/collectionItemService';
import { readItemListState } from '@utils/itemListUtils';

export async function loader({ request }: LoaderFunctionArgs) {
  const state = readItemListState(new URL(request.url).searchParams);

  const [itemsResponse, categories, tags, collections] = await Promise.all([
    collectionItemService.getItems(state.fields),
    getAllCategories(),
    getAllTags(),
    getAllCollections(),
  ]);

  return {
    itemsResponse,
    categories,
    tags,
    collections,
    sort: state.sort,
    page: state.page,
    pageSize: state.pageSize,
  };
}
