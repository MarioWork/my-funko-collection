import type { LoaderFunctionArgs } from 'react-router';
import collectionService from '@services/collectionService/collectionService';
import { assertCanWrite } from '@utils/readOnlyRouteUtils';

// Edit loads the collection; add has nothing to load (no id in the URL). Not for a read-only user.
export async function loader({ params, context }: LoaderFunctionArgs) {
  assertCanWrite(context);

  if (!params.collectionId) return { collection: null };

  const collection = await collectionService.getCollection(Number(params.collectionId));

  return { collection };
}
