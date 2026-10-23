import { DEFAULT_FIRST_PAGE } from '@app-types/utility';
import categoryService, { DEFAULT_CATEGORY_SORT_FIELD } from '@services/categoryService/categoryService';
import seriesService, { DEFAULT_SERIES_SORT_FIELD } from '@services/seriesService/seriesService';
import collectionService, { DEFAULT_COLLECTION_SORT_FIELD } from '@services/collectionService/collectionService';
import tagService, { DEFAULT_TAG_SORT_FIELD } from '@services/tagService/tagService';

const OPTIONS_PAGE_SIZE = '100';

// The pickers' options: categories for the form, collections and tags for the destination header.
export async function loader() {
  const pagination = { page: DEFAULT_FIRST_PAGE, size: OPTIONS_PAGE_SIZE };

  const [categoriesResponse, seriesResponse, collectionsResponse, tagsResponse] = await Promise.all([
    categoryService.getCategories({ pagination, sortingField: DEFAULT_CATEGORY_SORT_FIELD }),
    seriesService.getSeriesList({ pagination, sortingField: DEFAULT_SERIES_SORT_FIELD }),
    collectionService.getCollections({ pagination, sortingField: DEFAULT_COLLECTION_SORT_FIELD }),
    tagService.getTags({ pagination, sortingField: DEFAULT_TAG_SORT_FIELD }),
  ]);

  return {
    categories: categoriesResponse.data,
    series: seriesResponse.data,
    collections: collectionsResponse.data,
    tags: tagsResponse.data,
  };
}
