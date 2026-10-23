import { getAllCategories, getAllCollections, getAllSeries, getAllTags } from '@api/optionLists';

// The pickers' options: categories for the form, collections and tags for the destination header.
export async function loader() {
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
