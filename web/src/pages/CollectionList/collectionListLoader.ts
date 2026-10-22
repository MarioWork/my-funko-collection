import { DEFAULT_FIRST_PAGE } from '@app-types/utility';
import collectionService, { DEFAULT_COLLECTION_SORT_FIELD } from '@services/collectionService/collectionService';

const PAGE_SIZE = '100';

export async function loader() {
  const collectionsResponse = await collectionService.getCollections({
    pagination: { page: DEFAULT_FIRST_PAGE, size: PAGE_SIZE },
    sortingField: DEFAULT_COLLECTION_SORT_FIELD,
  });

  return { collections: collectionsResponse.data };
}
