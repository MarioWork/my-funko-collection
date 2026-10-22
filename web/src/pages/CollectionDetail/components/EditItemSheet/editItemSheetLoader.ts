import type { LoaderFunctionArgs } from 'react-router';
import { DEFAULT_FIRST_PAGE } from '@app-types/utility';
import collectionItemService from '@services/collectionItemService/collectionItemService';
import tagService, { DEFAULT_TAG_SORT_FIELD } from '@services/tagService/tagService';
import { ITEM_OPTIONS_PAGE_SIZE } from '@utils/itemListUtils';

export async function loader({ params }: LoaderFunctionArgs) {
  const [item, tagsResponse] = await Promise.all([
    collectionItemService.getCollectionItem(Number(params.collectionId), Number(params.itemId)),
    tagService.getTags({
      pagination: { page: DEFAULT_FIRST_PAGE, size: ITEM_OPTIONS_PAGE_SIZE },
      sortingField: DEFAULT_TAG_SORT_FIELD,
    }),
  ]);

  return { item, tags: tagsResponse.data };
}
