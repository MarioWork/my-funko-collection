import { escapeLike, ilikeContains } from '../../lib/likePatterns.ts';
import { allOf, anyOf, inList, numberSortKey, sortDirection } from '../../lib/sqlFragments.ts';
import { Prisma } from '../../generated/prisma/client.ts';
import { toOrderDirection, toSkipTake } from '../../lib/pagination.ts';
import { deletedIdOrUndefined, ID_SELECT, prisma, reloadIfUpdated } from '../../lib/prisma.ts';
import { catalogueOf, scopeFilter, type SubmitterScope } from '../../lib/catalogueVisibility.ts';
import { z } from 'zod';
import {
  SUBMISSION_STATUSES,
  type ListReviewQuery,
  type ListSubmissionsQuery,
  type ReviewState,
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
import type { ItemCombiner, MergedItem } from './funkos.merge.ts';
import type { PickedFields } from './funkos.mergeChoices.ts';
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

const SUBMITTER_SELECT = {
  submittedBy: { select: { id: true, name: true } },
} as const satisfies Prisma.FunkoSelect;

// How a submission's review went (with the catalogue funko a merged one went into), and who sent it in (null for no
// sender: an admin's funko, or a deleted user's): what the submissions lists and the funko page add.
const REVIEW_SELECT = {
  reviewedAt: true,
  rejectionReason: true,
  changedByAdminAt: true,
  mergedInto: { select: { id: true, name: true } },
  ...SUBMITTER_SELECT,
} as const satisfies Prisma.FunkoSelect;

const SUBMISSION_SELECT = { ...FUNKO_SELECT, ...REVIEW_SELECT } as const satisfies Prisma.FunkoSelect;

// What the double check compares: the barcode, and the number with the category's name; plus chase and exclusive, so
// look-alikes (a regular and a chase of the same number and name) can be told apart.
const DOUBLE_CANDIDATE_SELECT = {
  id: true,
  name: true,
  number: true,
  isChase: true,
  exclusive: true,
  barcode: true,
  status: true,
  category: { select: { name: true } },
} as const satisfies Prisma.FunkoSelect;

// A category's or series' standing and name, to find the approved one of the same name when a submission is approved.
const REFERENCE_SELECT = { id: true, name: true, status: true } as const satisfies Prisma.CategorySelect;

// What a merge reads of each item it moves: where it is, and what a clash combines (its tags in the order it got them).
const MERGED_ITEM_SELECT = {
  id: true,
  collectionId: true,
  quantity: true,
  notes: true,
  createdAt: true,
  itemTags: { select: { tagId: true }, orderBy: [{ createdAt: 'asc' }, { tagId: 'asc' }] },
} as const satisfies Prisma.CollectionItemSelect;

type MergedItemRow = Prisma.CollectionItemGetPayload<{ select: typeof MERGED_ITEM_SELECT }>;

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
  seriesId: number;
  seriesName: string;
  status: SubmissionStatus;
  submittedById: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ReviewColumns = Prisma.FunkoGetPayload<{ select: typeof REVIEW_SELECT }>;

// A funko as the submissions lists show it: the funko, how its review went and who sent it in.
export type SubmissionRow = FunkoRow & ReviewColumns;

export type DoubleCandidateRow = Prisma.FunkoGetPayload<{ select: typeof DOUBLE_CANDIDATE_SELECT }>;

// What a submission's double check looks for.
export type DoubleProbe = { id: number; barcode: string | null; number: string; categoryName: string };

// The category and series an approved funko ends up with: its own, or the approved one of the same name.
export type CatalogueReferences = { categoryId: number; seriesId: number };

// What became of a merge: done, or refused because the submission is no longer waiting or the target is not (or no
// longer) in the catalogue. Nothing changes unless it is MERGED.
export type MergeOutcome = 'MERGED' | 'NOT_WAITING' | 'TARGET_NOT_IN_CATALOGUE';

// What a merge changes on the catalogue funko besides the items (issue #39): the fields it takes from the submission,
// the submission's images that move onto it (in this order, after its own), and its own images that go.
export type MergeChange = { fields: PickedFields; movedImageIds: number[]; removedImageIds: number[] };

// A change to a funko: the body, plus when an admin changed someone else's submission.
export type FunkoChange = UpdateFunko & { changedByAdminAt?: Date };

// A new row: what the body says, plus where it stands (an admin's is APPROVED, a member's a WAITING submission).
export type NewFunko = Omit<Prisma.FunkoUncheckedCreateInput, 'id' | 'createdAt' | 'updatedAt'>;

// The natural key the duplicate guard checks: the columns of `funkos_identity_uidx`.
export type FunkoIdentity = Pick<FunkoRow, 'categoryId' | 'number' | 'name' | 'isChase' | 'exclusive'>;

// How a forced delete went: the users whose items went with the funko, or refused (nothing changed) because users
// other than the deleter have it and no reason was given. Undefined when the funko was not there.
export type DeletedWithItems = { isRefused: false; holderIds: number[] } | { isRefused: true };

// Who deletes, and whether they gave a reason that lets the delete take the funko from other users.
export type ForcedDeleter = { userId: number; hasReason: boolean };

// The client a query runs on: the shared one, or a transaction's.
type QueryClient = Pick<typeof prisma, 'user'>;

// Users with the funko in at least one of their collections.
function holdsFunko(funkoId: number): Prisma.UserWhereInput {
  return { collections: { some: { items: { some: { funkoId } } } } };
}

async function findHolderIdsIn(client: QueryClient, funkoId: number): Promise<number[]> {
  const holders = await client.user.findMany({ where: holdsFunko(funkoId), select: ID_SELECT, orderBy: { id: 'asc' } });

  return holders.map((holder) => holder.id);
}

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
  seriesId: z.number(),
  seriesName: z.string(),
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
// category and `s` its series.
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

  return Prisma.join([
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
  return { ...funko, categoryName: category.name, seriesName: series.name };
}

function toSubmissionRow({
  category,
  series,
  ...funko
}: Prisma.FunkoGetPayload<{ select: typeof SUBMISSION_SELECT }>): SubmissionRow {
  return { ...funko, categoryName: category.name, seriesName: series.name };
}

type ReviewTab = { where: Prisma.FunkoWhereInput; orderBy: Prisma.FunkoOrderByWithRelationInput[] };

// The review list's tabs: what each holds and in which order.
const REVIEW_STATE_MAP: Record<ReviewState, ReviewTab> = {
  WAITING: { where: { status: 'WAITING' }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
  DONE: {
    where: { status: { not: 'WAITING' }, reviewedAt: { not: null } },
    orderBy: [{ reviewedAt: 'desc' }, { id: 'desc' }],
  },
};

// Approved and waiting funkos (never rejected or merged ones) with any of the probes' barcodes, or any of their
// numbers in a category of the same name (any case).
function doubleCandidatesFilter(probes: DoubleProbe[]): Prisma.FunkoWhereInput {
  const barcodes = probes.flatMap((probe) => (probe.barcode ? [probe.barcode] : []));
  const sameNumberAndCategory = probes.map((probe) => ({
    number: probe.number,
    category: { name: { equals: probe.categoryName, mode: 'insensitive' as const } },
  }));

  return {
    status: { in: ['APPROVED', 'WAITING'] },
    OR: [{ barcode: { in: barcodes } }, ...sameNumberAndCategory],
  };
}

type ReferenceRow = { id: number; name: string; status: SubmissionStatus };

type ApprovedTwinFinder = (name: string) => Promise<{ id: number } | null>;

// An approved reference stays; a waiting one gives way to the approved one of the same name, if there is one.
async function catalogueReferenceId(reference: ReferenceRow, findApprovedTwin: ApprovedTwinFinder): Promise<number> {
  if (reference.status === 'APPROVED') return reference.id;

  const twin = await findApprovedTwin(reference.name);

  return twin?.id ?? reference.id;
}

const findApprovedCategory: ApprovedTwinFinder = (name) =>
  prisma.category.findFirst({ where: { name, status: 'APPROVED' }, select: ID_SELECT });

const findApprovedSeries: ApprovedTwinFinder = (name) =>
  prisma.series.findFirst({ where: { name, status: 'APPROVED' }, select: ID_SELECT });

// The one that was left behind when a funko moved from `currentId` to `nextId`, if it moved.
function leftBehind(currentId: number | undefined, nextId: number): number | undefined {
  const hasMoved = currentId !== undefined && currentId !== nextId;

  return hasMoved ? currentId : undefined;
}

// Approving, all or nothing: the funko moves to `references`, the waiting category and series it keeps join the
// catalogue with it, and a waiting one it left for an approved twin goes once no funko uses it.
async function approveInTransaction(id: number, references: CatalogueReferences): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const current = await tx.funko.findUnique({ where: { id }, select: { categoryId: true, seriesId: true } });
    const leftCategoryId = leftBehind(current?.categoryId, references.categoryId);
    const leftSeriesId = leftBehind(current?.seriesId, references.seriesId);
    const unusedSubmission = { status: { not: 'APPROVED' as const }, funkos: { none: {} } };

    await tx.category.updateMany({
      where: { id: references.categoryId, status: 'WAITING' },
      data: { status: 'APPROVED' },
    });

    await tx.series.updateMany({
      where: { id: references.seriesId, status: 'WAITING' },
      data: { status: 'APPROVED' },
    });

    const write = await tx.funko.updateMany({
      where: { id, status: 'WAITING' },
      data: { ...references, status: 'APPROVED', reviewedAt: new Date() },
    });

    if (leftCategoryId !== undefined)
      await tx.category.deleteMany({ where: { id: leftCategoryId, ...unusedSubmission } });

    if (leftSeriesId !== undefined) await tx.series.deleteMany({ where: { id: leftSeriesId, ...unusedSubmission } });

    return write.count > 0;
  });
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

async function deleteOrphanInTransaction(id: number): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const funko = await tx.funko.findUnique({ where: { id }, select: { categoryId: true, seriesId: true } });
    const unusedOrphanReference = { status: { not: 'APPROVED' as const }, submittedById: null, funkos: { none: {} } };

    await tx.collectionItem.deleteMany({ where: { funkoId: id, funko: { status: 'WAITING', submittedById: null } } });

    const deleted = await tx.funko.deleteMany({ where: { id, status: 'WAITING', submittedById: null } });

    if (funko) await tx.category.deleteMany({ where: { id: funko.categoryId, ...unusedOrphanReference } });

    if (funko) await tx.series.deleteMany({ where: { id: funko.seriesId, ...unusedOrphanReference } });

    return deleted.count > 0;
  });
}

// The older of two items first: created first, the lower id on a tie.
function olderFirst(first: MergedItemRow, second: MergedItemRow): [MergedItemRow, MergedItemRow] {
  const isFirstOlder =
    first.createdAt.getTime() < second.createdAt.getTime() ||
    (first.createdAt.getTime() === second.createdAt.getTime() && first.id < second.id);

  return isFirstOlder ? [first, second] : [second, first];
}

function toMergedItem(row: MergedItemRow): MergedItem {
  return { quantity: row.quantity, notes: row.notes, tagIds: row.itemTags.map(({ tagId }) => tagId) };
}

// Two items of the same funko in one collection become the older one: it takes `combine`'s quantity, notes and tags,
// then the newer one goes. The newer one is deleted before the kept one moves, so the collection never holds the
// target funko twice (collection_items_collection_id_funko_id_uidx).
async function combineItems(
  tx: Prisma.TransactionClient,
  pair: { moving: MergedItemRow; staying: MergedItemRow },
  targetId: number,
  combine: ItemCombiner,
): Promise<void> {
  const [older, newer] = olderFirst(pair.moving, pair.staying);
  const { tagIds, ...combined } = combine(toMergedItem(older), toMergedItem(newer));

  await tx.collectionItem.delete({ where: { id: newer.id } });
  await tx.collectionItemTag.deleteMany({ where: { collectionItemId: older.id, tagId: { notIn: tagIds } } });
  await tx.collectionItemTag.createMany({
    data: tagIds.map((tagId) => ({ collectionItemId: older.id, tagId })),
    skipDuplicates: true,
  });
  await tx.collectionItem.update({ where: { id: older.id }, data: { ...combined, funkoId: targetId } });
}

// One of the submission's items moves onto the target funko, or combines with the target's item in its collection.
async function moveItem(
  tx: Prisma.TransactionClient,
  moving: MergedItemRow,
  targetId: number,
  combine: ItemCombiner,
): Promise<void> {
  const staying = await tx.collectionItem.findUnique({
    where: { collectionId_funkoId: { collectionId: moving.collectionId, funkoId: targetId } },
    select: MERGED_ITEM_SELECT,
  });

  if (!staying) {
    await tx.collectionItem.update({ where: { id: moving.id }, data: { funkoId: targetId } });

    return;
  }

  await combineItems(tx, { moving, staying }, targetId, combine);
}

// A picked waiting category or series of the submission joins the catalogue, as approval brings it in. An approved
// one (the submission's own, or the approved one of the same name the service resolved) is left as it is.
async function bringIntoCatalogue(tx: Prisma.TransactionClient, fields: PickedFields): Promise<void> {
  if (fields.categoryId !== undefined) {
    await tx.category.updateMany({ where: { id: fields.categoryId, status: 'WAITING' }, data: { status: 'APPROVED' } });
  }

  if (fields.seriesId !== undefined) {
    await tx.series.updateMany({ where: { id: fields.seriesId, status: 'WAITING' }, data: { status: 'APPROVED' } });
  }
}

// The target's unticked images go, then the picked images of the submission become the target's, after its own. Their
// files were copied into the target's folder under the same key before the transaction (the service's job).
async function moveImages(
  tx: Prisma.TransactionClient,
  pair: { id: number; targetId: number },
  change: MergeChange,
): Promise<void> {
  if (change.removedImageIds.length > 0) {
    await tx.funkoImage.deleteMany({ where: { id: { in: change.removedImageIds }, funkoId: pair.targetId } });
  }

  if (change.movedImageIds.length === 0) return;

  const totals = await tx.funkoImage.aggregate({ where: { funkoId: pair.targetId }, _max: { position: true } });
  const firstPosition = (totals._max.position ?? -1) + 1;

  for (const [index, imageId] of change.movedImageIds.entries()) {
    await tx.funkoImage.updateMany({
      where: { id: imageId, funkoId: pair.id },
      data: { funkoId: pair.targetId, position: firstPosition + index },
    });
  }
}

// The catalogue funko takes the picked fields (a waiting category or series picked joins the catalogue first) and
// images. A unique index the new values clash with throws 23505, and the whole merge rolls back.
async function changeTarget(
  tx: Prisma.TransactionClient,
  pair: { id: number; targetId: number },
  change: MergeChange,
): Promise<void> {
  const hasFields = Object.keys(change.fields).length > 0;

  await bringIntoCatalogue(tx, change.fields);

  if (hasFields) await tx.funko.update({ where: { id: pair.targetId }, data: change.fields, select: ID_SELECT });

  await moveImages(tx, pair, change);
}

// Merging, all or nothing: the target must still be in the catalogue, the submission still waiting; then the target
// takes the picked fields and images, every item of the submission (whoever's collection) moves onto the target, and
// it is marked merged into it. It keeps its own fields, category, series and the images not picked, as a record.
async function mergeInTransaction(
  id: number,
  targetId: number,
  change: MergeChange,
  combine: ItemCombiner,
): Promise<MergeOutcome> {
  return prisma.$transaction(async (tx) => {
    const target = await tx.funko.findFirst({ where: { id: targetId, status: 'APPROVED' }, select: ID_SELECT });

    if (!target) return 'TARGET_NOT_IN_CATALOGUE';

    const write = await tx.funko.updateMany({
      where: { id, status: 'WAITING' },
      data: { status: 'MERGED', mergedIntoId: targetId, reviewedAt: new Date() },
    });

    if (write.count === 0) return 'NOT_WAITING';

    await changeTarget(tx, { id, targetId }, change);

    const items = await tx.collectionItem.findMany({
      where: { funkoId: id },
      select: MERGED_ITEM_SELECT,
      orderBy: { id: 'asc' },
    });

    for (const item of items) await moveItem(tx, item, targetId, combine);

    return 'MERGED';
  });
}

export const funkosRepository = {
  findById: (id: number): Promise<FunkoRow | undefined> => findRow({ id }),

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

  // How the funko's review went and who sent it in.
  findReview: async (funkoId: number): Promise<ReviewColumns | undefined> =>
    (await prisma.funko.findUnique({ where: { id: funkoId }, select: REVIEW_SELECT })) ?? undefined,

  findSubmission: async (funkoId: number): Promise<SubmissionRow | undefined> => {
    const funko = await prisma.funko.findUnique({ where: { id: funkoId }, select: SUBMISSION_SELECT });

    return funko ? toSubmissionRow(funko) : undefined;
  },

  // What one user sent in, with an optional status.
  listSubmissions: async (
    userId: number,
    query: ListSubmissionsQuery,
  ): Promise<{ data: SubmissionRow[]; totalResultNumber: number }> => {
    const where: Prisma.FunkoWhereInput = { submittedById: userId, status: query.status };
    const sortField = SUBMISSION_SORT_MAP[query.sorting_fields];
    const direction = toOrderDirection(query.direction);

    const [rows, totalResultNumber] = await prisma.$transaction([
      prisma.funko.findMany({
        where,
        select: SUBMISSION_SELECT,
        orderBy: [{ [sortField]: direction }, { id: 'asc' }],
        ...toSkipTake(query),
      }),
      prisma.funko.count({ where }),
    ]);

    return { data: rows.map(toSubmissionRow), totalResultNumber };
  },

  // Every member's submissions, for the admins: the waiting ones, or the reviewed ones.
  listForReview: async (query: ListReviewQuery): Promise<{ data: SubmissionRow[]; totalResultNumber: number }> => {
    const { where, orderBy } = REVIEW_STATE_MAP[query.state];

    const [rows, totalResultNumber] = await prisma.$transaction([
      prisma.funko.findMany({ where, select: SUBMISSION_SELECT, orderBy, ...toSkipTake(query) }),
      prisma.funko.count({ where }),
    ]);

    return { data: rows.map(toSubmissionRow), totalResultNumber };
  },

  // Every approved or waiting funko that shares a barcode, or a number and category name, with one of the probes
  // (the probes themselves included: the caller leaves each one's own row out).
  findDoubleCandidates: async (probes: DoubleProbe[]): Promise<DoubleCandidateRow[]> => {
    if (probes.length === 0) return [];

    return prisma.funko.findMany({
      where: doubleCandidatesFilter(probes),
      select: DOUBLE_CANDIDATE_SELECT,
      orderBy: { id: 'asc' },
    });
  },

  // The category and series the funko would have in the catalogue: its own approved ones, or for a waiting one the
  // approved one of the same name (an admin may have added it meanwhile), else the waiting one itself.
  findCatalogueReferences: async (funkoId: number): Promise<CatalogueReferences | undefined> => {
    const funko = await prisma.funko.findUnique({
      where: { id: funkoId },
      select: { category: { select: REFERENCE_SELECT }, series: { select: REFERENCE_SELECT } },
    });

    if (!funko) return undefined;

    return {
      categoryId: await catalogueReferenceId(funko.category, findApprovedCategory),
      seriesId: await catalogueReferenceId(funko.series, findApprovedSeries),
    };
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
        join series s on s.id = f.series_id
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

  // Every user with the funko in a collection, for the delete guard: a funko in anyone's collection is protected.
  // Only ids: who they are is never told, only how many.
  findHolderIds: (funkoId: number): Promise<number[]> => findHolderIdsIn(prisma, funkoId),

  // How many users have the funko in a collection, for an admin about to delete it.
  countHolders: (funkoId: number): Promise<number> => prisma.user.count({ where: holdsFunko(funkoId) }),

  create: async (data: NewFunko): Promise<FunkoRow> => toRow(await prisma.funko.create({ data, select: FUNKO_SELECT })),

  update: async (id: number, data: FunkoChange): Promise<FunkoRow | undefined> => {
    const write = await prisma.funko.updateMany({ where: { id }, data });

    return reloadIfUpdated(write, () => findRow({ id }));
  },

  // Only a waiting funko is approved (false otherwise). A unique index the catalogue now holds the funko, category or
  // series against throws 23505, and nothing changes.
  approve: approveInTransaction,

  // Only a waiting funko is rejected; its waiting category and series stay its sender's.
  reject: async (id: number, rejectionReason: string): Promise<FunkoRow | undefined> => {
    const write = await prisma.funko.updateMany({
      where: { id, status: 'WAITING' },
      data: { status: 'REJECTED', rejectionReason, reviewedAt: new Date() },
    });

    return reloadIfUpdated(write, () => findRow({ id }));
  },

  // Only a waiting funko is merged, only into an approved one, which takes `change`; `combine` decides what a clash
  // in one collection becomes.
  merge: mergeInTransaction,

  // Rejecting an orphan submission deletes it, as the user-delete trigger deletes a removed user's rejected ones:
  // its items (there should be none), the funko, and the never-approved category and series of the removed user that
  // no funko uses any more. Only a waiting orphan goes (false otherwise). Its image files stay for images:prune.
  deleteOrphan: deleteOrphanInTransaction,

  // Only a rejected funko is sent again: it waits once more, without the reason, and as the sender sent it now.
  resend: async (id: number): Promise<FunkoRow | undefined> => {
    const write = await prisma.funko.updateMany({
      where: { id, status: 'REJECTED' },
      data: { status: 'WAITING', rejectionReason: null, changedByAdminAt: null },
    });

    return reloadIfUpdated(write, () => findRow({ id }));
  },
  delete: async (id: number): Promise<{ id: number } | undefined> => {
    const write = await prisma.funko.deleteMany({ where: { id } });

    return deletedIdOrUndefined(id, write);
  },

  // The forced delete: its collection items go first (their tags cascade), then the funko, all or nothing. The users
  // who have it are read in the same transaction, so a user who added it after the service's check is still
  // refused without a reason, and the ones told are the ones who lost it.
  deleteWithItems: (id: number, deleter: ForcedDeleter): Promise<DeletedWithItems | undefined> =>
    prisma.$transaction(async (tx) => {
      const holderIds = await findHolderIdsIn(tx, id);
      const isInOtherUsersCollections = holderIds.some((holderId) => holderId !== deleter.userId);

      if (isInOtherUsersCollections && !deleter.hasReason) return { isRefused: true };

      await tx.collectionItem.deleteMany({ where: { funkoId: id } });

      const deleted = await tx.funko.deleteMany({ where: { id } });

      if (deleted.count === 0) return undefined;

      return { isRefused: false, holderIds };
    }),
};
