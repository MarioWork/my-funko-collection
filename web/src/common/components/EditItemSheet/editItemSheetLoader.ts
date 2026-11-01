import type { LoaderFunctionArgs } from 'react-router';
import { getAllTags } from '@api/optionLists';
import collectionItemService from '@services/collectionItemService/collectionItemService';
import { assertCanWrite } from '@utils/readOnlyRouteUtils';

// The item and the tag options. Not for a read-only user.
export async function loader({ params, context }: LoaderFunctionArgs) {
  assertCanWrite(context);

  const [item, tags] = await Promise.all([
    collectionItemService.getCollectionItem(Number(params.collectionId), Number(params.itemId)),
    getAllTags(),
  ]);

  return { item, tags };
}
