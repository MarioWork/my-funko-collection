import type { LoaderFunctionArgs } from 'react-router';
import { DEFAULT_FIRST_PAGE } from '@app-types/utility';
import collectionService, {
  CollectionApiSearchFields,
  DEFAULT_COLLECTION_SORT_FIELD,
} from '@services/collectionService/collectionService';

const PAGE_SIZE = '100';

// The collections, narrowed by the search box's name in the URL when there is one.
export async function loader({ request }: LoaderFunctionArgs) {
  const name = new URL(request.url).searchParams.get(CollectionApiSearchFields.NAME) ?? undefined;
  const collectionsResponse = await collectionService.getCollections({
    pagination: { page: DEFAULT_FIRST_PAGE, size: PAGE_SIZE },
    sortingField: DEFAULT_COLLECTION_SORT_FIELD,
    [CollectionApiSearchFields.NAME]: name,
  });

  return { collections: collectionsResponse.data };
}
