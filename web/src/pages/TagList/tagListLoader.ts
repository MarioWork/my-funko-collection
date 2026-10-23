import { getAllTags } from '@api/optionLists';

export async function loader() {
  return { tags: await getAllTags() };
}
