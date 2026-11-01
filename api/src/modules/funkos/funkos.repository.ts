import { escapeLike, ilikeContains } from '../../lib/likePatterns.ts';
import { allOf, anyOf, inList, numberSortKey, sortDirection } from '../../lib/sqlFragments.ts';
import { Prisma } from '../../generated/prisma/client.ts';
import { toOrderDirection, toSkipTake } from '../../lib/pagination.ts';
import { deletedIdOrUndefined, ID_SELECT, prisma, reloadIfUpdated } from '../../lib/prisma.ts';
import { catalogueOf, scopeFilter, type SubmitterScope } from '../../lib/catalogueVisibility.ts';
import { z } from 'zod';
import {
  SUBMISSION_STATUSES,
  type ListSubmissionsQuery,
  type SubmissionSortField,
  type SubmissionStatus,
} from '../submissions/submissions.type.ts';
import {
  FUNKO_MATCH_FIELDS,
  type FunkoMatchField,
  type FunkoSortField,
  type ListFunkosQuery,
  type UpdateFunko,
} from './funkos.schema.ts';
import { FUNKO_TYPES, type FunkoType } from './funkos.type.ts';

const FUNKO_SELECT = {
  id: true,
  name: true,
  number: true,
  type: true,
  isChase: true,
  exclusive: true,
  barcode: true,
  categoryId: true,
  category: { select: { name: true } },
  seriesId: true,
  series: { select: { name: true } },
  status: true,
  submittedById: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.FunkoSelect;

const PRIMARY_IMAGE_SELECT = {
  funkoId: true,
  fileKey: true,
  placeholder: true,
  width: true,
  height: true,
} as const satisfies Prisma.FunkoImageSelect;

const FUNKO_COLLECTION_SELECT = {
  funkoId: true,
  collection: { select: { id: true, name: true } },
} as const satisfies Prisma.CollectionItemSelect;

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
  status: SubmissionStatus;
  submittedById: number | null;
  createdAt: Date;
  updatedAt: Date;
};

// A new row: what the body says, plus where it stands (an admin's is APPROVED, a member's a WAITING submission).
export type NewFunko = Omit<Prisma.FunkoUncheckedCreateInput, 'id' | 'createdAt' | 'updatedAt'>;

// The natural key the duplicate guard checks: the columns of `funkos_identity_uidx`.
export type FunkoIdentity = Pick<FunkoRow, 'categoryId' | 'number' | 'name' | 'isChase' | 'exclusive'>;

// A list row also says which fields the search words hit (null when there was no search), so the UI can say
// "matched by tag". The words' SQL conditions decide it, the same ones that filter the list.
export type ListedFunkoRow = FunkoRow & { matchedOn: FunkoMatchField[] | null };

// `$queryRaw`'s type is only an assertion: the rows are parsed, so a column that drifts from it fails right here,
// with the column's name, instead of later in the response schema.
const ListedFunkoRowSchema = z.object({
  id: z.number(),
  name: z.string(),
  number: z.string(),
  type: z.enum(FUNKO_TYPES),
  isChase: z.boolean(),
  exclusive: z.string(),
  barcode: z.string().nullable(),
  categoryId: z.number(),
  categoryName: z.string(),
  seriesId: z.number().nullable(),
  seriesName: z.string().nullable(),
  status: z.enum(SUBMISSION_STATUSES),
  submittedById: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  matchedOn: z.array(z.enum(FUNKO_MATCH_FIELDS)).nullable(),
}) satisfies z.ZodType<ListedFunkoRow>;

const CountRowSchema = z.object({ total: z.number() });

export type PrimaryImageRow = Prisma.FunkoImageGetPayload<{ select: typeof PRIMARY_IMAGE_SELECT }>;
export type CollectionSummaryRow = { funkoId: number; id: number; name: string };

const ONLY_DIGITS = /^\d+$/;
const LEADING_HASH = /^#/;
const WORD_SEPARATOR = /\s+/;

// The list is raw SQL: Prisma cannot sort by relevance or by a number's numeric value. `f` is the funko, `c` its
// category and `s` its series (left joined: a funko may have none).
const SORT_FIELD_MAP: Record<Exclude<FunkoSortField, 'RELEVANCE'>, Prisma.Sql> = {
  NAME: Prisma.sql`f.name`,
  NUMBER: numberSortKey(Prisma.sql`f.number`),
  CREATION_DATE: Prisma.sql`f.created_at`,
  CATEGORY: Prisma.sql`c.name`,
  SERIES: Prisma.sql`s.name`,
};

function categoryNameMatches(text: string): Prisma.Sql {
  return Prisma.sql`exists (
    select 1 from categories mc where mc.id = f.category_id and ${ilikeContains(Prisma.sql`mc.name`, text)}
  )`;
}

function seriesNameMatches(text: string): Prisma.Sql {
  return Prisma.sql`exists (
    select 1 from series ms where ms.id = f.series_id and ${ilikeContains(Prisma.sql`ms.name`, text)}
  )`;
}

// The catalogue is shared, collections are not: every filter that looks at items sees only the signed-in user's.
// This is the `from` of those subqueries: their items `mi`, each with its collection `mc`.
function ownItems(userId: number): Prisma.Sql {
  return Prisma.sql`collection_items mi join collections mc on mc.id = mi.collection_id and mc.user_id = ${userId}`;
}

// `condition` may use `mt` (the tag) and `mit` (the item-tag link).
function tagMatches(userId: number, condition: Prisma.Sql): Prisma.Sql {
  return Prisma.sql`exists (
    select 1
    from ${ownItems(userId)}
    join collection_item_tags mit on mit.collection_item_id = mi.id
    join tags mt on mt.id = mit.tag_id
    where mi.funko_id = f.id and ${condition}
  )`;
}

// `condition` may use `mc` (the collection) and `mi` (the item).
function collectionMatches(userId: number, condition: Prisma.Sql): Prisma.Sql {
  return Prisma.sql`exists (select 1 from ${ownItems(userId)} where mi.funko_id = f.id and ${condition})`;
}

function inAnyCollection(userId: number, collectionIds: number[]): Prisma.Sql {
  return collectionMatches(userId, inList(Prisma.sql`mi.collection_id`, collectionIds));
}

type FieldConditions = Record<FunkoMatchField, Prisma.Sql | undefined>;

// What one free-text word means for each field: the single place a search field is defined.
function wordConditions(userId: number, word: string): FieldConditions {
  const isNumeric = ONLY_DIGITS.test(word);
  const numberWord = word.replace(LEADING_HASH, '');

  return {
    ID: isNumeric ? Prisma.sql`f.id = ${Number(word)}` : undefined,
    NAME: ilikeContains(Prisma.sql`f.name`, word),
    NUMBER: numberWord.length > 0 ? ilikeContains(Prisma.sql`f.number`, numberWord) : undefined,
    BARCODE: ilikeContains(Prisma.sql`f.barcode`, word),
    EXCLUSIVE: ilikeContains(Prisma.sql`f.exclusive`, word),
    CATEGORY: categoryNameMatches(word),
    SERIES: seriesNameMatches(word),
    TAG: tagMatches(userId, ilikeContains(Prisma.sql`mt.name`, word)),
    COLLECTION: collectionMatches(userId, ilikeContains(Prisma.sql`mc.name`, word)),
  };
}

// One free-text word must hit at least one field.
function wordFilter(userId: number, word: string): Prisma.Sql {
  return anyOf(Object.values(wordConditions(userId, word)));
}

// The fields any of the words hit, in FUNKO_MATCH_FIELDS order; null when there are no words.
function matchedOnColumn(userId: number, words: string[]): Prisma.Sql {
  if (words.length === 0) return Prisma.sql`null::text[]`;

  const conditionsPerWord = words.map((word) => wordConditions(userId, word));
  const fieldCases = FUNKO_MATCH_FIELDS.map((field) => {
    const anyWordHits = anyOf(conditionsPerWord.map((conditions) => conditions[field]));

    return Prisma.sql`case when ${anyWordHits} then ${field}::text end`;
  });

  return Prisma.sql`array_remove(array[${Prisma.join(fieldCases)}]::text[], null)`;
}

function splitSearchWords(query: string | undefined): string[] {
  if (!query) return [];

  return query.split(WORD_SEPARATOR).filter((word) => word.length > 0);
}

function existsOrNot(isPresent: boolean, subquery: Prisma.Sql): Prisma.Sql {
  return isPresent ? Prisma.sql`exists (${subquery})` : Prisma.sql`not exists (${subquery})`;
}

function hasCollectionsFilterFor(userId: number, hasCollections: boolean): Prisma.Sql {
  return existsOrNot(hasCollections, Prisma.sql`select 1 from ${ownItems(userId)} where mi.funko_id = f.id`);
}

function hasSeriesFilterFor(hasSeries: boolean): Prisma.Sql {
  return hasSeries ? Prisma.sql`f.series_id is not null` : Prisma.sql`f.series_id is null`;
}

// A tag sits on an item, so "has tags" means any of the funko's items carries one.
function hasTagsFilterFor(userId: number, hasTags: boolean): Prisma.Sql {
  return existsOrNot(
    hasTags,
    Prisma.sql`select 1
      from ${ownItems(userId)}
      join collection_item_tags mit on mit.collection_item_id = mi.id
      where mi.funko_id = f.id`,
  );
}

function hasImagesFilterFor(hasImages: boolean): Prisma.Sql {
  return existsOrNot(hasImages, Prisma.sql`select 1 from funko_images mf where mf.funko_id = f.id`);
}

function notInCollections(userId: number, collectionIds: number[]): Prisma.Sql {
  return Prisma.sql`not ${inAnyCollection(userId, collectionIds)}`;
}

// The catalogue `userId` browses: every approved funko, and their own waiting submissions (catalogueOf() in
// lib/catalogueVisibility.ts, in SQL). Another member's waiting submission never lists, not even for an admin
// (they review them elsewhere).
function catalogueFilter(userId: number): Prisma.Sql {
  return Prisma.sql`(
    f.status = 'APPROVED'::submission_status
    or (f.status = 'WAITING'::submission_status and f.submitted_by_id = ${userId})
  )`;
}

// Each named param narrows one field; every word of `q` must match somewhere. All of it is ANDed. The collection
// and tag filters look only at `userId`'s own items.
function buildListFilter(userId: number, query: ListFunkosQuery): Prisma.Sql {
  const wordFilters = splitSearchWords(query.q).map((word) => wordFilter(userId, word));

  return allOf([
    catalogueFilter(userId),
    ...wordFilters,
    query.name ? ilikeContains(Prisma.sql`f.name`, query.name) : undefined,
    query.number ? Prisma.sql`f.number = ${query.number.replace(LEADING_HASH, '')}` : undefined,
    query.barcode ? Prisma.sql`f.barcode = ${query.barcode}` : undefined,
    query.exclusive ? ilikeContains(Prisma.sql`f.exclusive`, query.exclusive) : undefined,
    query.type ? Prisma.sql`f.type = ${query.type}::funko_type` : undefined,
    query.isChase === undefined ? undefined : Prisma.sql`f.is_chase = ${query.isChase}`,
    query.categoryId ? inList(Prisma.sql`f.category_id`, query.categoryId) : undefined,
    query.category ? categoryNameMatches(query.category) : undefined,
    query.seriesId ? inList(Prisma.sql`f.series_id`, query.seriesId) : undefined,
    query.series ? seriesNameMatches(query.series) : undefined,
    query.tagId ? tagMatches(userId, inList(Prisma.sql`mit.tag_id`, query.tagId)) : undefined,
    query.tag ? tagMatches(userId, ilikeContains(Prisma.sql`mt.name`, query.tag)) : undefined,
    query.collectionId ? inAnyCollection(userId, query.collectionId) : undefined,
    query.collection ? collectionMatches(userId, ilikeContains(Prisma.sql`mc.name`, query.collection)) : undefined,
    query.notInCollectionId ? notInCollections(userId, query.notInCollectionId) : undefined,
    query.hasCollections === undefined ? undefined : hasCollectionsFilterFor(userId, query.hasCollections),
    query.hasSeries === undefined ? undefined : hasSeriesFilterFor(query.hasSeries),
    query.hasTags === undefined ? undefined : hasTagsFilterFor(userId, query.hasTags),
    query.hasImages === undefined ? undefined : hasImagesFilterFor(query.hasImages),
  ]);
}

// Exact name first, then a name that starts with the query, then everything else.
function relevanceOrder(query: string): Prisma.Sql {
  const lowered = query.toLowerCase();
  const prefix = `${escapeLike(lowered)}%`;

  return Prisma.sql`case when lower(f.name) = ${lowered} then 0 when lower(f.name) like ${prefix} then 1 else 2 end`;
}

function buildOrderBy(query: ListFunkosQuery): Prisma.Sql {
  const direction = sortDirection(query.direction);
  const hasSearch = splitSearchWords(query.q).length > 0;
  const sortField = query.sorting_fields ?? (hasSearch ? 'RELEVANCE' : 'NAME');

  if (sortField === 'RELEVANCE') {
    const relevance = hasSearch ? [Prisma.sql`${relevanceOrder(query.q ?? '')} ${direction}`] : [];

    return Prisma.join([...relevance, Prisma.sql`f.name asc`, Prisma.sql`f.id asc`]);
  }

  // Funkos without a series sort after the ones with one, in either direction.
  const missingSeriesLast = sortField === 'SERIES' ? [Prisma.sql`(s.name is null) asc`] : [];

  return Prisma.join([
    ...missingSeriesLast,
    Prisma.sql`${SORT_FIELD_MAP[sortField]} ${direction}`,
    Prisma.sql`f.number asc`,
    Prisma.sql`f.id asc`,
  ]);
}

const SUBMISSION_SORT_MAP: Record<SubmissionSortField, keyof Prisma.FunkoOrderByWithRelationInput> = {
  NAME: 'name',
  CREATION_DATE: 'createdAt',
};

function toRow({ category, series, ...funko }: Prisma.FunkoGetPayload<{ select: typeof FUNKO_SELECT }>): FunkoRow {
  return { ...funko, categoryName: category.name, seriesName: series?.name ?? null };
}

async function findRow(where: Prisma.FunkoWhereInput): Promise<FunkoRow | undefined> {
  const funko = await prisma.funko.findFirst({ where, select: FUNKO_SELECT, orderBy: { id: 'asc' } });

  return funko ? toRow(funko) : undefined;
}

function groupByFunkoId<Row extends { funkoId: number }>(rows: Row[]): Map<number, Row[]> {
  const grouped = new Map<number, Row[]>();

  for (const row of rows) {
    const bucket = grouped.get(row.funkoId) ?? [];

    bucket.push(row);
    grouped.set(row.funkoId, bucket);
  }

  return grouped;
}

export const funkosRepository = {
  findById: (id: number): Promise<FunkoRow | undefined> => findRow({ id }),

  // Who sent the funko in, or null for no sender (an admin's funko, or a deleted user's).
  findSubmitter: async (funkoId: number): Promise<{ id: number; name: string } | null> => {
    const funko = await prisma.funko.findUnique({
      where: { id: funkoId },
      select: { submittedBy: { select: { id: true, name: true } } },
    });

    return funko?.submittedBy ?? null;
  },

  findManyByIds: async (ids: number[]): Promise<FunkoRow[]> => {
    if (ids.length === 0) return [];

    const funkos = await prisma.funko.findMany({ where: { id: { in: ids } }, select: FUNKO_SELECT });

    return funkos.map(toRow);
  },

  // The catalogue's funko with this barcode first, else `userId`'s own submission of it.
  findByBarcode: async (userId: number, barcode: string): Promise<FunkoRow | undefined> =>
    (await findRow({ barcode, status: 'APPROVED' })) ?? findRow({ barcode, ...catalogueOf(userId) }),

  findIdByBarcode: async (barcode: string, scope: SubmitterScope) =>
    (await prisma.funko.findFirst({ where: { barcode, ...scopeFilter(scope) }, select: ID_SELECT })) ?? undefined,

  findIdByIdentity: async (identity: FunkoIdentity, scope: SubmitterScope) =>
    (await prisma.funko.findFirst({ where: { ...identity, ...scopeFilter(scope) }, select: ID_SELECT })) ?? undefined,

  // What one user sent in, with an optional status.
  listSubmissions: async (
    userId: number,
    query: ListSubmissionsQuery,
  ): Promise<{ data: FunkoRow[]; totalResultNumber: number }> => {
    const where: Prisma.FunkoWhereInput = { submittedById: userId, status: query.status };
    const sortField = SUBMISSION_SORT_MAP[query.sorting_fields];
    const direction = toOrderDirection(query.direction);

    const [rows, totalResultNumber] = await prisma.$transaction([
      prisma.funko.findMany({
        where,
        select: FUNKO_SELECT,
        orderBy: [{ [sortField]: direction }, { id: 'asc' }],
        ...toSkipTake(query),
      }),
      prisma.funko.count({ where }),
    ]);

    return { data: rows.map(toRow), totalResultNumber };
  },

  list: async (
    userId: number,
    query: ListFunkosQuery,
  ): Promise<{ data: ListedFunkoRow[]; totalResultNumber: number }> => {
    const filter = buildListFilter(userId, query);
    const { skip, take } = toSkipTake(query);

    const [rows, totals] = await prisma.$transaction([
      prisma.$queryRaw<unknown[]>`
        select
          f.id,
          f.name,
          f.number,
          f.type::text as type,
          f.is_chase as "isChase",
          f.exclusive,
          f.barcode,
          f.category_id as "categoryId",
          c.name as "categoryName",
          f.series_id as "seriesId",
          s.name as "seriesName",
          f.status::text as status,
          f.submitted_by_id as "submittedById",
          f.created_at as "createdAt",
          f.updated_at as "updatedAt",
          ${matchedOnColumn(userId, splitSearchWords(query.q))} as "matchedOn"
        from funkos f
        join categories c on c.id = f.category_id
        left join series s on s.id = f.series_id
        where ${filter}
        order by ${buildOrderBy(query)}
        limit ${take} offset ${skip}`,
      prisma.$queryRaw<unknown[]>`select count(*)::int as total from funkos f where ${filter}`,
    ]);
    const [total] = z.array(CountRowSchema).parse(totals);

    return { data: z.array(ListedFunkoRowSchema).parse(rows), totalResultNumber: total?.total ?? 0 };
  },

  // The lowest-positioned image of each funko in the page, one query for the whole page.
  primaryImagesByFunkoIds: async (funkoIds: number[]): Promise<Map<number, PrimaryImageRow>> => {
    if (funkoIds.length === 0) return new Map();

    const images = await prisma.funkoImage.findMany({
      where: { funkoId: { in: funkoIds } },
      select: PRIMARY_IMAGE_SELECT,
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
    });
    const grouped = groupByFunkoId(images);

    return new Map([...grouped].flatMap(([funkoId, rows]) => (rows[0] ? [[funkoId, rows[0]]] : [])));
  },

  // Which of the user's own collections each funko is in; other users' collections never show.
  collectionsByFunkoIds: async (userId: number, funkoIds: number[]): Promise<Map<number, CollectionSummaryRow[]>> => {
    if (funkoIds.length === 0) return new Map();

    const items = await prisma.collectionItem.findMany({
      where: { funkoId: { in: funkoIds }, collection: { userId } },
      select: FUNKO_COLLECTION_SELECT,
      orderBy: { collection: { name: 'asc' } },
    });

    return groupByFunkoId(items.map(({ funkoId, collection }) => ({ funkoId, ...collection })));
  },

  // Every user's items of the funko, for the delete guard: a funko in anyone's collection is protected.
  countItems: (funkoId: number): Promise<number> => prisma.collectionItem.count({ where: { funkoId } }),

  // The funko's items in collections that are not `userId`'s: told apart in the 409, never named.
  countOtherUsersItems: (userId: number, funkoId: number): Promise<number> =>
    prisma.collectionItem.count({ where: { funkoId, collection: { userId: { not: userId } } } }),

  create: async (data: NewFunko): Promise<FunkoRow> => toRow(await prisma.funko.create({ data, select: FUNKO_SELECT })),

  update: async (id: number, data: UpdateFunko): Promise<FunkoRow | undefined> => {
    const write = await prisma.funko.updateMany({ where: { id }, data });

    return reloadIfUpdated(write, () => findRow({ id }));
  },

  delete: async (id: number): Promise<{ id: number } | undefined> => {
    const write = await prisma.funko.deleteMany({ where: { id } });

    return deletedIdOrUndefined(id, write);
  },

  // The forced delete: its collection items go first (their tags cascade), then the funko, all or nothing.
  deleteWithItems: async (id: number): Promise<{ id: number } | undefined> => {
    const [, deleted] = await prisma.$transaction([
      prisma.collectionItem.deleteMany({ where: { funkoId: id } }),
      prisma.funko.deleteMany({ where: { id } }),
    ]);

    return deletedIdOrUndefined(id, deleted);
  },
};
