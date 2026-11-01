// The all-fields search of GET /funkos, on the mock store. Mirrors api/src/modules/funkos/funkos.repository.ts.
import { FunkoMatchFieldUtil } from '@app-types/utility';
import { FunkoApiSearchFields } from '@services/funkoService/funkoService';
import { idList, isTrueParam } from '@mocks/mockListUtils';
import { catalogueFunkos } from '@mocks/mockCatalogueUtils';
import { mockStore } from '@mocks/mockStore';
import type { MockFunkoRow } from '@mocks/mockStore.type';

const LEADING_HASH = /^#/;
const WHITESPACE = /\s+/;
const EXACT_NAME_RANK = 0;
const NAME_PREFIX_RANK = 1;
const OTHER_RANK = 2;

function contains(haystack: string | null, needle: string): boolean {
  return haystack !== null && haystack.toLowerCase().includes(needle.toLowerCase());
}

function itemsOf(funkoId: number) {
  return mockStore.items.filter((item) => item.funkoId === funkoId);
}

function categoryName(row: MockFunkoRow): string {
  return mockStore.categories.find((category) => category.id === row.categoryId)?.name ?? '';
}

function seriesName(row: MockFunkoRow): string {
  return mockStore.series.find((series) => series.id === row.seriesId)?.name ?? '';
}

function tagNames(row: MockFunkoRow): string[] {
  const tagIds = new Set(itemsOf(row.id).flatMap((item) => item.tagIds));

  return mockStore.tags.filter((tag) => tagIds.has(tag.id)).map((tag) => tag.name);
}

function collectionNames(row: MockFunkoRow): string[] {
  const collectionIds = new Set(itemsOf(row.id).map((item) => item.collectionId));

  return mockStore.collections
    .filter((collection) => collectionIds.has(collection.id))
    .map((collection) => collection.name);
}

export function matchedFields(row: MockFunkoRow, words: string[]): FunkoMatchFieldUtil[] {
  const matched = new Set<FunkoMatchFieldUtil>();

  for (const word of words) {
    const numberWord = word.replace(LEADING_HASH, '');

    if (String(row.id) === word) matched.add(FunkoMatchFieldUtil.ID);
    if (contains(row.name, word)) matched.add(FunkoMatchFieldUtil.NAME);
    if (numberWord && contains(row.number, numberWord)) matched.add(FunkoMatchFieldUtil.NUMBER);
    if (contains(row.barcode, word)) matched.add(FunkoMatchFieldUtil.BARCODE);
    if (contains(row.exclusive, word)) matched.add(FunkoMatchFieldUtil.EXCLUSIVE);
    if (contains(categoryName(row), word)) matched.add(FunkoMatchFieldUtil.CATEGORY);
    if (contains(seriesName(row), word)) matched.add(FunkoMatchFieldUtil.SERIES);
    if (tagNames(row).some((name) => contains(name, word))) matched.add(FunkoMatchFieldUtil.TAG);
    if (collectionNames(row).some((name) => contains(name, word))) matched.add(FunkoMatchFieldUtil.COLLECTION);
  }

  return [...matched];
}

// Exact name first, then a name that starts with the query, then the rest (the API's relevance order).
export function relevance(name: string, query: string): number {
  const lowered = name.toLowerCase();
  const wanted = query.toLowerCase();

  if (lowered === wanted) return EXACT_NAME_RANK;
  if (lowered.startsWith(wanted)) return NAME_PREFIX_RANK;

  return OTHER_RANK;
}

export function splitWords(query: string | null): string[] {
  return (query ?? '').split(WHITESPACE).filter(Boolean);
}

// Every word must hit somewhere; every named param narrows one field. All ANDed.
export function filterFunkos(params: URLSearchParams): MockFunkoRow[] {
  const words = splitWords(params.get(FunkoApiSearchFields.QUERY));
  const name = params.get(FunkoApiSearchFields.NAME);
  const number = params.get(FunkoApiSearchFields.NUMBER)?.replace(LEADING_HASH, '');
  const barcode = params.get(FunkoApiSearchFields.BARCODE);
  const exclusive = params.get(FunkoApiSearchFields.EXCLUSIVE);
  const type = params.get(FunkoApiSearchFields.TYPE);
  const isChase = params.get(FunkoApiSearchFields.IS_CHASE);
  const categoryIds = idList(params.get(FunkoApiSearchFields.CATEGORY_ID));
  const category = params.get(FunkoApiSearchFields.CATEGORY);
  const seriesIds = idList(params.get(FunkoApiSearchFields.SERIES_ID));
  const series = params.get(FunkoApiSearchFields.SERIES);
  const tagIds = idList(params.get(FunkoApiSearchFields.TAG_ID));
  const tag = params.get(FunkoApiSearchFields.TAG);
  const collectionIds = idList(params.get(FunkoApiSearchFields.COLLECTION_ID));
  const collection = params.get(FunkoApiSearchFields.COLLECTION);
  const notInCollectionIds = idList(params.get(FunkoApiSearchFields.NOT_IN_COLLECTION_ID));
  const hasCollections = params.get(FunkoApiSearchFields.HAS_COLLECTIONS);
  const hasTags = params.get(FunkoApiSearchFields.HAS_TAGS);
  const hasImages = params.get(FunkoApiSearchFields.HAS_IMAGES);

  return catalogueFunkos().filter((row) => {
    const items = itemsOf(row.id);
    const rowTagIds = new Set(items.flatMap((item) => item.tagIds));
    const rowCollectionIds = new Set(items.map((item) => item.collectionId));
    const imageCount = mockStore.images.filter((image) => image.funkoId === row.id).length;

    const checks = [
      words.every((word) => matchedFields(row, [word]).length > 0),
      !name || contains(row.name, name),
      !number || row.number === number,
      !barcode || row.barcode === barcode,
      !exclusive || contains(row.exclusive, exclusive),
      !type || row.type === type,
      isChase === null || row.isChase === isTrueParam(isChase),
      !categoryIds || categoryIds.includes(row.categoryId),
      !category || contains(categoryName(row), category),
      !seriesIds || seriesIds.includes(row.seriesId),
      !series || contains(seriesName(row), series),
      !tagIds || tagIds.some((tagId) => rowTagIds.has(tagId)),
      !tag || tagNames(row).some((tagName) => contains(tagName, tag)),
      !collectionIds || collectionIds.some((collectionId) => rowCollectionIds.has(collectionId)),
      !collection || collectionNames(row).some((collectionName) => contains(collectionName, collection)),
      !notInCollectionIds || !notInCollectionIds.some((collectionId) => rowCollectionIds.has(collectionId)),
      hasCollections === null || rowCollectionIds.size > 0 === isTrueParam(hasCollections),
      hasTags === null || rowTagIds.size > 0 === isTrueParam(hasTags),
      hasImages === null || imageCount > 0 === isTrueParam(hasImages),
    ];

    return checks.every(Boolean);
  });
}
