import type { LoaderFunctionArgs } from 'react-router';
import { DEFAULT_FIRST_PAGE } from '@app-types/utility';
import categoryService, { DEFAULT_CATEGORY_SORT_FIELD } from '@services/categoryService/categoryService';
import collectionItemService, { ItemApiSearchFields } from '@services/collectionItemService/collectionItemService';
import collectionService, { DEFAULT_COLLECTION_SORT_FIELD } from '@services/collectionService/collectionService';
import funkoService from '@services/funkoService/funkoService';
import tagService, { DEFAULT_TAG_SORT_FIELD } from '@services/tagService/tagService';

const OPTIONS_PAGE_SIZE = '100';

// The funko with its photos, the form's options (categories, collections, tags) and the collections it is in now.
export async function loader({ params }: LoaderFunctionArgs) {
  const funkoId = Number(params.funkoId);
  const pagination = { page: DEFAULT_FIRST_PAGE, size: OPTIONS_PAGE_SIZE };

  const [funko, categoriesResponse, collectionsResponse, tagsResponse, itemsResponse] = await Promise.all([
    funkoService.getFunko(funkoId),
    categoryService.getCategories({ pagination, sortingField: DEFAULT_CATEGORY_SORT_FIELD }),
    collectionService.getCollections({ pagination, sortingField: DEFAULT_COLLECTION_SORT_FIELD }),
    tagService.getTags({ pagination, sortingField: DEFAULT_TAG_SORT_FIELD }),
    collectionItemService.getItems({ pagination, [ItemApiSearchFields.FUNKO_ID]: String(funkoId) }),
  ]);

  return {
    funko,
    categories: categoriesResponse.data,
    collections: collectionsResponse.data,
    tags: tagsResponse.data,
    items: itemsResponse.data,
  };
}
