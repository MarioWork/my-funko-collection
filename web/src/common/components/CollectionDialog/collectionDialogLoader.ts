import type { LoaderFunctionArgs } from 'react-router';
import collectionService from '@services/collectionService/collectionService';

// Edit loads the collection; add has nothing to load (no id in the URL).
export async function loader({ params }: LoaderFunctionArgs) {
  if (!params.collectionId) return { collection: null };

  const collection = await collectionService.getCollection(Number(params.collectionId));

  return { collection };
}
