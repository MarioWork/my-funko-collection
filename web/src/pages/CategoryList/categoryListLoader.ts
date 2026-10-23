import { getAllCategories } from '@api/optionLists';

export async function loader() {
  return { categories: await getAllCategories() };
}
