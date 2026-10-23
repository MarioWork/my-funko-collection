import { getAllSeries } from '@api/optionLists';

export async function loader() {
  return { series: await getAllSeries() };
}
