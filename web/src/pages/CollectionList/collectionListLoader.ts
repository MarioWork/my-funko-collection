import type { LoaderFunctionArgs } from 'react-router';
import { getAllCollections } from '@api/optionLists';
import { CollectionApiSearchFields } from '@services/collectionService/collectionService';

// The collections, narrowed by the search box's name in the URL when there is one.
export async function loader({ request }: LoaderFunctionArgs) {
  const name = new URL(request.url).searchParams.get(CollectionApiSearchFields.NAME) ?? undefined;

  return { collections: await getAllCollections(name) };
}
