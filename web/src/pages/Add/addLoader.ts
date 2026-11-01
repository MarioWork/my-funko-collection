import type { LoaderFunctionArgs } from 'react-router';
import { getAllCategories, getAllCollections, getAllSeries, getAllTags } from '@api/optionLists';
import { assertCanWrite } from '@utils/readOnlyRouteUtils';

// The pickers' options: categories for the form, collections and tags for the destination header. Every step of
// Add ends in a write, so a read-only user gets the "read-only" error page.
export async function loader({ context }: LoaderFunctionArgs) {
  assertCanWrite(context);

  const [categories, series, collections, tags] = await Promise.all([
    getAllCategories(),
    getAllSeries(),
    getAllCollections(),
    getAllTags(),
  ]);

  return {
    categories,
    series,
    collections,
    tags,
  };
}
