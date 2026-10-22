import { DEFAULT_FIRST_PAGE } from '@app-types/utility';
import collectionService, { DEFAULT_COLLECTION_SORT_FIELD } from '@services/collectionService/collectionService';
import tagService, { DEFAULT_TAG_SORT_FIELD } from '@services/tagService/tagService';
import { ITEM_OPTIONS_PAGE_SIZE } from '@utils/itemListUtils';

export async function loader() {
  const pagination = { page: DEFAULT_FIRST_PAGE, size: ITEM_OPTIONS_PAGE_SIZE };

  const [collectionsResponse, tagsResponse] = await Promise.all([
    collectionService.getCollections({ pagination, sortingField: DEFAULT_COLLECTION_SORT_FIELD }),
    tagService.getTags({ pagination, sortingField: DEFAULT_TAG_SORT_FIELD }),
  ]);

  return { collections: collectionsResponse.data, tags: tagsResponse.data };
}
