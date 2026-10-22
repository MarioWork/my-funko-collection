import type { LoaderFunctionArgs } from 'react-router';
import { DEFAULT_FIRST_PAGE } from '@app-types/utility';
import categoryService, { DEFAULT_CATEGORY_SORT_FIELD } from '@services/categoryService/categoryService';
import collectionItemService from '@services/collectionItemService/collectionItemService';
import collectionService, { DEFAULT_COLLECTION_SORT_FIELD } from '@services/collectionService/collectionService';
import tagService, { DEFAULT_TAG_SORT_FIELD } from '@services/tagService/tagService';
import { ITEM_OPTIONS_PAGE_SIZE, readItemListState } from '@utils/itemListUtils';

export async function loader({ request }: LoaderFunctionArgs) {
  const state = readItemListState(new URL(request.url).searchParams);
  const pagination = { page: DEFAULT_FIRST_PAGE, size: ITEM_OPTIONS_PAGE_SIZE };

  const [itemsResponse, categoriesResponse, tagsResponse, collectionsResponse] = await Promise.all([
    collectionItemService.getItems(state.fields),
    categoryService.getCategories({ pagination, sortingField: DEFAULT_CATEGORY_SORT_FIELD }),
    tagService.getTags({ pagination, sortingField: DEFAULT_TAG_SORT_FIELD }),
    collectionService.getCollections({ pagination, sortingField: DEFAULT_COLLECTION_SORT_FIELD }),
  ]);

  return {
    itemsResponse,
    categories: categoriesResponse.data,
    tags: tagsResponse.data,
    collections: collectionsResponse.data,
    sort: state.sort,
    page: state.page,
    pageSize: state.pageSize,
  };
}
