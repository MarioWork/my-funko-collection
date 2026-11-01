// The search bar's dropdown. Composes the other modules' services; it owns no table.
import { DEFAULT_PAGE } from '../../lib/pagination.ts';
import { getCategories } from '../categories/categories.service.ts';
import { getCollections } from '../collections/collections.service.ts';
import type { FunkoResponse, FunkoSummary } from '../funkos/funkos.type.ts';
import { getFunkos } from '../funkos/basics/basics.service.ts';
import { getSeriesList } from '../series/series.service.ts';
import { getTags } from '../tags/tags.service.ts';
import { SUGGEST_FUNKO_LIMIT, SUGGEST_OTHER_LIMIT, type SuggestQuery, type SuggestResponse } from './suggest.schema.ts';

const NAME_SORT = { page: DEFAULT_PAGE, size: SUGGEST_OTHER_LIMIT, direction: 'ASC', sorting_fields: 'NAME' } as const;

function toSummary(funko: FunkoResponse): FunkoSummary {
  return {
    id: funko.id,
    name: funko.name,
    number: funko.number,
    type: funko.type,
    isChase: funko.isChase,
    exclusive: funko.exclusive,
    barcode: funko.barcode,
    category: funko.category,
    series: funko.series,
    primaryImage: funko.primaryImage,
  };
}

// Funkos, categories and series come from the shared catalogue (approved, plus what the user sent in themselves);
// collections and tags are the signed-in user's own.
export async function getSuggestions(userId: number, { q }: SuggestQuery): Promise<SuggestResponse> {
  const [funkoPage, categoryPage, seriesPage, collectionPage, tagPage] = await Promise.all([
    getFunkos(userId, { q, page: DEFAULT_PAGE, size: SUGGEST_FUNKO_LIMIT, direction: 'ASC' }),
    getCategories(userId, { ...NAME_SORT, name: q }),
    getSeriesList(userId, { ...NAME_SORT, name: q }),
    getCollections(userId, { ...NAME_SORT, name: q }),
    getTags(userId, { ...NAME_SORT, name: q }),
  ]);

  return {
    funkos: funkoPage.data.map(toSummary),
    categories: categoryPage.data.map(({ id, name }) => ({ id, name })),
    series: seriesPage.data.map(({ id, name }) => ({ id, name })),
    collections: collectionPage.data.map(({ id, name }) => ({ id, name })),
    tags: tagPage.data.map(({ id, name }) => ({ id, name })),
  };
}
