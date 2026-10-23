import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  inArray,
  isNotNull,
  isNull,
  notExists,
  or,
  sql,
  type SQL,
  type SQLWrapper,
} from 'drizzle-orm';
import { db, type DbExecutor } from '../../db/client.ts';
import { likeContains } from '../../db/like.ts';
import { categories } from '../../db/schema/categories.ts';
import { collectionItems } from '../../db/schema/collectionItems.ts';
import { collectionItemTags } from '../../db/schema/collectionItemTags.ts';
import { collections } from '../../db/schema/collections.ts';
import { funkoImages } from '../../db/schema/funkoImages.ts';
import { funkos, type FunkoSortField, type FunkoType } from '../../db/schema/funkos.ts';
import { series } from '../../db/schema/series.ts';
import { tags } from '../../db/schema/tags.ts';
import { toLimitOffset } from '../../lib/pagination.ts';
import type { CreateFunko, ListFunkosQuery, UpdateFunko } from './funkos.schema.ts';

const FUNKO_COLUMNS = {
  id: funkos.id,
  name: funkos.name,
  number: funkos.number,
  type: funkos.type,
  isChase: funkos.isChase,
  exclusive: funkos.exclusive,
  barcode: funkos.barcode,
  categoryId: funkos.categoryId,
  categoryName: categories.name,
  seriesId: funkos.seriesId,
  seriesName: series.name,
  createdAt: funkos.createdAt,
  updatedAt: funkos.updatedAt,
} as const;

const PRIMARY_IMAGE_COLUMNS = {
  funkoId: funkoImages.funkoId,
  fileKey: funkoImages.fileKey,
  placeholder: funkoImages.placeholder,
  width: funkoImages.width,
  height: funkoImages.height,
} as const;

const ONLY_DIGITS = /^\d+$/;
const LEADING_HASH = /^#/;
const WORD_SEPARATOR = /\s+/;

// Numbers are text ("01", "SE"); sorting by their integer value keeps 2 before 10, and the text breaks ties.
const numberAsInteger = sql<number>`cast(${funkos.number} as integer)`;

const SORT_FIELD_MAP: Record<Exclude<FunkoSortField, 'RELEVANCE'>, SQLWrapper> = {
  NAME: funkos.name,
  NUMBER: numberAsInteger,
  CREATION_DATE: funkos.createdAt,
  CATEGORY: categories.name,
  SERIES: series.name,
};

// Funkos without a series sort after the ones with one, in either direction.
const seriesMissingLast = sql`${series.name} is null`;

function categoryNameMatches(text: string): SQL {
  return exists(
    db
      .select({ one: sql`1` })
      .from(categories)
      .where(and(eq(categories.id, funkos.categoryId), likeContains(categories.name, text))),
  );
}

function seriesNameMatches(text: string): SQL {
  return exists(
    db
      .select({ one: sql`1` })
      .from(series)
      .where(and(eq(series.id, funkos.seriesId), likeContains(series.name, text))),
  );
}

function tagMatches(condition: SQL): SQL {
  return exists(
    db
      .select({ one: sql`1` })
      .from(collectionItemTags)
      .innerJoin(collectionItems, eq(collectionItems.id, collectionItemTags.collectionItemId))
      .innerJoin(tags, eq(tags.id, collectionItemTags.tagId))
      .where(and(eq(collectionItems.funkoId, funkos.id), condition)),
  );
}

function collectionMatches(condition: SQL): SQL {
  return exists(
    db
      .select({ one: sql`1` })
      .from(collectionItems)
      .innerJoin(collections, eq(collections.id, collectionItems.collectionId))
      .where(and(eq(collectionItems.funkoId, funkos.id), condition)),
  );
}

function inAnyCollection(collectionIds: number[]): SQL {
  return exists(
    db
      .select({ one: sql`1` })
      .from(collectionItems)
      .where(and(eq(collectionItems.funkoId, funkos.id), inArray(collectionItems.collectionId, collectionIds))),
  );
}

// One free-text word must hit at least one field.
function wordFilter(word: string): SQL | undefined {
  const isNumeric = ONLY_DIGITS.test(word);
  const numberWord = word.replace(LEADING_HASH, '');
  const idMatch = isNumeric ? eq(funkos.id, Number(word)) : undefined;
  const numberMatch = numberWord.length > 0 ? likeContains(funkos.number, numberWord) : undefined;

  return or(
    idMatch,
    likeContains(funkos.name, word),
    numberMatch,
    likeContains(funkos.barcode, word),
    likeContains(funkos.exclusive, word),
    categoryNameMatches(word),
    seriesNameMatches(word),
    tagMatches(likeContains(tags.name, word)),
    collectionMatches(likeContains(collections.name, word)),
  );
}

export function splitSearchWords(query: string | undefined): string[] {
  if (!query) return [];

  return query.split(WORD_SEPARATOR).filter((word) => word.length > 0);
}

// Each named param narrows one field; every word of `q` must match somewhere. All of it is ANDed.
function buildListFilter(query: ListFunkosQuery): SQL | undefined {
  const words = splitSearchWords(query.q);
  const wordFilters = words.map(wordFilter);

  const nameFilter = query.name ? likeContains(funkos.name, query.name) : undefined;
  const numberFilter = query.number ? eq(funkos.number, query.number.replace(LEADING_HASH, '')) : undefined;
  const barcodeFilter = query.barcode ? eq(funkos.barcode, query.barcode) : undefined;
  const exclusiveFilter = query.exclusive ? likeContains(funkos.exclusive, query.exclusive) : undefined;
  const typeFilter = query.type ? eq(funkos.type, query.type) : undefined;
  const chaseFilter = query.isChase === undefined ? undefined : eq(funkos.isChase, query.isChase);
  const categoryIdFilter = query.categoryId ? inArray(funkos.categoryId, query.categoryId) : undefined;
  const categoryNameFilter = query.category ? categoryNameMatches(query.category) : undefined;
  const seriesIdFilter = query.seriesId ? inArray(funkos.seriesId, query.seriesId) : undefined;
  const seriesNameFilter = query.series ? seriesNameMatches(query.series) : undefined;
  const tagIdFilter = query.tagId ? tagMatches(inArray(collectionItemTags.tagId, query.tagId)) : undefined;
  const tagNameFilter = query.tag ? tagMatches(likeContains(tags.name, query.tag)) : undefined;
  const collectionIdFilter = query.collectionId ? inAnyCollection(query.collectionId) : undefined;
  const collectionNameFilter = query.collection
    ? collectionMatches(likeContains(collections.name, query.collection))
    : undefined;
  const notInCollectionFilter = query.notInCollectionId
    ? notExists(
        db
          .select({ one: sql`1` })
          .from(collectionItems)
          .where(
            and(eq(collectionItems.funkoId, funkos.id), inArray(collectionItems.collectionId, query.notInCollectionId)),
          ),
      )
    : undefined;
  const hasCollectionsFilter =
    query.hasCollections === undefined ? undefined : hasCollectionsFilterFor(query.hasCollections);
  const hasSeriesFilter = query.hasSeries === undefined ? undefined : hasSeriesFilterFor(query.hasSeries);
  const hasTagsFilter = query.hasTags === undefined ? undefined : hasTagsFilterFor(query.hasTags);
  const hasImagesFilter = query.hasImages === undefined ? undefined : hasImagesFilterFor(query.hasImages);

  return and(
    ...wordFilters,
    nameFilter,
    numberFilter,
    barcodeFilter,
    exclusiveFilter,
    typeFilter,
    chaseFilter,
    categoryIdFilter,
    categoryNameFilter,
    seriesIdFilter,
    seriesNameFilter,
    tagIdFilter,
    tagNameFilter,
    collectionIdFilter,
    collectionNameFilter,
    notInCollectionFilter,
    hasCollectionsFilter,
    hasSeriesFilter,
    hasTagsFilter,
    hasImagesFilter,
  );
}

function hasCollectionsFilterFor(hasCollections: boolean): SQL {
  const itemsSubquery = db
    .select({ one: sql`1` })
    .from(collectionItems)
    .where(eq(collectionItems.funkoId, funkos.id));

  return hasCollections ? exists(itemsSubquery) : notExists(itemsSubquery);
}

function hasSeriesFilterFor(hasSeries: boolean): SQL {
  return hasSeries ? isNotNull(funkos.seriesId) : isNull(funkos.seriesId);
}

// A tag sits on an item, so "has tags" means any of the funko's items carries one.
function hasTagsFilterFor(hasTags: boolean): SQL {
  const tagsSubquery = db
    .select({ one: sql`1` })
    .from(collectionItemTags)
    .innerJoin(collectionItems, eq(collectionItems.id, collectionItemTags.collectionItemId))
    .where(eq(collectionItems.funkoId, funkos.id));

  return hasTags ? exists(tagsSubquery) : notExists(tagsSubquery);
}

function hasImagesFilterFor(hasImages: boolean): SQL {
  const imagesSubquery = db
    .select({ one: sql`1` })
    .from(funkoImages)
    .where(eq(funkoImages.funkoId, funkos.id));

  return hasImages ? exists(imagesSubquery) : notExists(imagesSubquery);
}

// Exact name first, then a name that starts with the query, then everything else.
function relevanceOrder(query: string): SQL {
  const lowered = query.toLowerCase();
  const prefix = `${lowered}%`;

  return sql`case when lower(${funkos.name}) = ${lowered} then 0 when lower(${funkos.name}) like ${prefix} then 1 else 2 end`;
}

function buildOrderBy(query: ListFunkosQuery): SQL[] {
  const direction = query.direction === 'DESC' ? desc : asc;
  const hasSearch = splitSearchWords(query.q).length > 0;
  const sortField = query.sorting_fields ?? (hasSearch ? 'RELEVANCE' : 'NAME');

  if (sortField === 'RELEVANCE') {
    const relevance = hasSearch ? [direction(relevanceOrder(query.q ?? ''))] : [];

    return [...relevance, asc(funkos.name), asc(funkos.id)];
  }

  const missingSeriesLast = sortField === 'SERIES' ? [asc(seriesMissingLast)] : [];

  return [...missingSeriesLast, direction(SORT_FIELD_MAP[sortField]), asc(funkos.number), asc(funkos.id)];
}

function selectFunkos(executor: DbExecutor) {
  return executor
    .select(FUNKO_COLUMNS)
    .from(funkos)
    .innerJoin(categories, eq(categories.id, funkos.categoryId))
    .leftJoin(series, eq(series.id, funkos.seriesId));
}

async function groupByFunkoId<Row extends { funkoId: number }>(
  rowsPromise: Promise<Row[]>,
): Promise<Map<number, Row[]>> {
  const grouped = new Map<number, Row[]>();

  for (const row of await rowsPromise) {
    const bucket = grouped.get(row.funkoId) ?? [];

    bucket.push(row);
    grouped.set(row.funkoId, bucket);
  }

  return grouped;
}

export type FunkoIdentity = { categoryId: number; number: string; name: string; isChase: boolean; exclusive: string };

export const funkosRepository = {
  findById: (id: number, executor: DbExecutor = db): Promise<FunkoRow | undefined> =>
    selectFunkos(executor).where(eq(funkos.id, id)).get(),

  findManyByIds: (ids: number[], executor: DbExecutor = db): Promise<FunkoRow[]> =>
    ids.length === 0 ? Promise.resolve([]) : selectFunkos(executor).where(inArray(funkos.id, ids)),

  findByBarcode: (barcode: string, executor: DbExecutor = db): Promise<FunkoRow | undefined> =>
    selectFunkos(executor).where(eq(funkos.barcode, barcode)).get(),

  findIdByBarcode: (barcode: string, executor: DbExecutor = db) =>
    executor.select({ id: funkos.id }).from(funkos).where(eq(funkos.barcode, barcode)).get(),

  findIdByIdentity: (identity: FunkoIdentity, executor: DbExecutor = db) =>
    executor
      .select({ id: funkos.id })
      .from(funkos)
      .where(
        and(
          eq(funkos.categoryId, identity.categoryId),
          eq(funkos.number, identity.number),
          eq(funkos.name, identity.name),
          eq(funkos.isChase, identity.isChase),
          eq(funkos.exclusive, identity.exclusive),
        ),
      )
      .get(),

  list: async (query: ListFunkosQuery) => {
    const filter = buildListFilter(query);
    const { limit, offset } = toLimitOffset(query);

    const [data, totals] = await Promise.all([
      selectFunkos(db)
        .where(filter)
        .orderBy(...buildOrderBy(query))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(funkos).where(filter),
    ]);

    return { data, totalResultNumber: totals[0]?.total ?? 0 };
  },

  // The lowest-positioned image of each funko in the page, one query for the whole page.
  primaryImagesByFunkoIds: async (funkoIds: number[]): Promise<Map<number, PrimaryImageRow>> => {
    if (funkoIds.length === 0) return new Map();

    const grouped = await groupByFunkoId(
      db
        .select(PRIMARY_IMAGE_COLUMNS)
        .from(funkoImages)
        .where(inArray(funkoImages.funkoId, funkoIds))
        .orderBy(asc(funkoImages.position), asc(funkoImages.id)),
    );

    return new Map([...grouped].flatMap(([funkoId, rows]) => (rows[0] ? [[funkoId, rows[0]]] : [])));
  },

  collectionsByFunkoIds: (funkoIds: number[]): Promise<Map<number, CollectionSummaryRow[]>> =>
    funkoIds.length === 0
      ? Promise.resolve(new Map<number, CollectionSummaryRow[]>())
      : groupByFunkoId<CollectionSummaryRow>(
          db
            .select({ funkoId: collectionItems.funkoId, id: collections.id, name: collections.name })
            .from(collectionItems)
            .innerJoin(collections, eq(collections.id, collectionItems.collectionId))
            .where(inArray(collectionItems.funkoId, funkoIds))
            .orderBy(asc(collections.name)),
        ),

  tagNamesByFunkoIds: (funkoIds: number[]): Promise<Map<number, TagNameRow[]>> =>
    funkoIds.length === 0
      ? Promise.resolve(new Map<number, TagNameRow[]>())
      : groupByFunkoId<TagNameRow>(
          db
            .select({ funkoId: collectionItems.funkoId, name: tags.name })
            .from(collectionItemTags)
            .innerJoin(collectionItems, eq(collectionItems.id, collectionItemTags.collectionItemId))
            .innerJoin(tags, eq(tags.id, collectionItemTags.tagId))
            .where(inArray(collectionItems.funkoId, funkoIds)),
        ),

  create: async (data: CreateFunko, executor: DbExecutor = db): Promise<FunkoRow | undefined> => {
    const inserted = await executor.insert(funkos).values(data).returning({ id: funkos.id }).get();

    return selectFunkos(executor).where(eq(funkos.id, inserted.id)).get();
  },

  update: async (id: number, data: UpdateFunko, executor: DbExecutor = db): Promise<FunkoRow | undefined> => {
    const updated = await executor.update(funkos).set(data).where(eq(funkos.id, id)).returning({ id: funkos.id }).get();

    if (!updated) return undefined;

    return selectFunkos(executor).where(eq(funkos.id, id)).get();
  },

  delete: (id: number, executor: DbExecutor = db): Promise<{ id: number } | undefined> =>
    executor.delete(funkos).where(eq(funkos.id, id)).returning({ id: funkos.id }).get(),

  // The forced delete: its collection items go first (their tags cascade), then the funko, all or nothing.
  deleteWithItems: (id: number): Promise<{ id: number } | undefined> =>
    db.transaction(async (tx) => {
      await tx.delete(collectionItems).where(eq(collectionItems.funkoId, id));

      return tx.delete(funkos).where(eq(funkos.id, id)).returning({ id: funkos.id }).get();
    }),
};

export type FunkoRow = {
  id: number;
  name: string;
  number: string;
  type: FunkoType;
  isChase: boolean;
  exclusive: string;
  barcode: string | null;
  categoryId: number;
  categoryName: string;
  seriesId: number | null;
  seriesName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PrimaryImageRow = { funkoId: number; fileKey: string; placeholder: string; width: number; height: number };
export type CollectionSummaryRow = { funkoId: number; id: number; name: string };
export type TagNameRow = { funkoId: number; name: string };
