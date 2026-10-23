import type { LoaderFunctionArgs } from 'react-router';
import { getAllTags } from '@api/optionLists';
import collectionItemService from '@services/collectionItemService/collectionItemService';

export async function loader({ params }: LoaderFunctionArgs) {
  const [item, tags] = await Promise.all([
    collectionItemService.getCollectionItem(Number(params.collectionId), Number(params.itemId)),
    getAllTags(),
  ]);

  return { item, tags };
}
