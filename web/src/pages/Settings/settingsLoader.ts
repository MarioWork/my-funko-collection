import { getAllCollections, getAllTags } from '@api/optionLists';

export async function loader() {
  const [collections, tags] = await Promise.all([getAllCollections(), getAllTags()]);

  return { collections, tags };
}
