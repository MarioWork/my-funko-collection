import type { CategoryApiModel, CollectionApiModel, SeriesApiModel, TagApiModel } from '@app-types/models';
import categoryService, { DEFAULT_CATEGORY_SORT_FIELD } from '@services/categoryService/categoryService';
import collectionService, {
  CollectionApiSearchFields,
  DEFAULT_COLLECTION_SORT_FIELD,
} from '@services/collectionService/collectionService';
import seriesService, { DEFAULT_SERIES_SORT_FIELD } from '@services/seriesService/seriesService';
import tagService, { DEFAULT_TAG_SORT_FIELD } from '@services/tagService/tagService';
import { fetchEveryPage } from './fetchEveryPage';

// The full lists behind dropdowns, filters and pickers, sorted by name: all of them, however many there are.

export const getAllCategories = (): Promise<CategoryApiModel[]> =>
  fetchEveryPage((pagination) =>
    categoryService.getCategories({ pagination, sortingField: DEFAULT_CATEGORY_SORT_FIELD }),
  );

export const getAllSeries = (): Promise<SeriesApiModel[]> =>
  fetchEveryPage((pagination) => seriesService.getSeriesList({ pagination, sortingField: DEFAULT_SERIES_SORT_FIELD }));

export const getAllTags = (): Promise<TagApiModel[]> =>
  fetchEveryPage((pagination) => tagService.getTags({ pagination, sortingField: DEFAULT_TAG_SORT_FIELD }));

// Optionally narrowed by name (the Collections page's search box).
export const getAllCollections = (name?: string): Promise<CollectionApiModel[]> =>
  fetchEveryPage((pagination) =>
    collectionService.getCollections({
      pagination,
      sortingField: DEFAULT_COLLECTION_SORT_FIELD,
      [CollectionApiSearchFields.NAME]: name,
    }),
  );
