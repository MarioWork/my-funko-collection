// The search bar's dropdown. Composes the other modules' services; it owns no table.
import { DEFAULT_PAGE } from '../../lib/pagination.ts';
import { getCategories } from '../categories/categories.service.ts';
import { getCollections } from '../collections/collections.service.ts';
import type { FunkoResponse, FunkoSummary } from '../funkos/funkos.type.ts';
import { getFunkos } from '../funkos/funkos.service.ts';
import { getSeriesList } from '../series/series.service.ts';
import { getTags } from '../tags/tags.service.ts';
import { SUGGEST_FUNKO_LIMIT, SUGGEST_OTHER_LIMIT, type SuggestQuery, type SuggestResponse } from './suggest.schema.ts';

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

const NAME_SORT = { page: DEFAULT_PAGE, size: SUGGEST_OTHER_LIMIT, direction: 'ASC', sorting_fields: 'NAME' } as const;

export async function getSuggestions({ q }: SuggestQuery): Promise<SuggestResponse> {
  const [funkoPage, categoryPage, seriesPage, collectionPage, tagPage] = await Promise.all([
    getFunkos({ q, page: DEFAULT_PAGE, size: SUGGEST_FUNKO_LIMIT, direction: 'ASC' }),
    getCategories({ ...NAME_SORT, name: q }),
    getSeriesList({ ...NAME_SORT, name: q }),
    getCollections({ ...NAME_SORT, name: q }),
    getTags({ ...NAME_SORT, name: q }),
  ]);

  return {
    funkos: funkoPage.data.map(toSummary),
    categories: categoryPage.data.map(({ id, name }) => ({ id, name })),
    series: seriesPage.data.map(({ id, name }) => ({ id, name })),
    collections: collectionPage.data.map(({ id, name }) => ({ id, name })),
    tags: tagPage.data.map(({ id, name }) => ({ id, name })),
  };
}
