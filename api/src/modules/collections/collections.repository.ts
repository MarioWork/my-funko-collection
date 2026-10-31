import { containsText } from '../../lib/likePatterns.ts';
import { Prisma } from '../../generated/prisma/client.ts';
import { toOrderDirection, toSkipTake } from '../../lib/pagination.ts';
import { deletedIdOrUndefined, prisma, reloadIfUpdated, type DbExecutor } from '../../lib/prisma.ts';
import type {
  CollectionSortField,
  CreateCollection,
  ListCollectionsQuery,
  UpdateCollection,
} from './collections.schema.ts';

const COLLECTION_SELECT = {
  id: true,
  name: true,
  notes: true,
  isDefault: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.CollectionSelect;

const SORT_FIELD_MAP: Record<CollectionSortField, keyof Prisma.CollectionOrderByWithRelationInput> = {
  NAME: 'name',
  CREATION_DATE: 'createdAt',
};

type CollectionStats = { itemCount: number; totalQuantity: number; totalSpentCents: number };

type CollectionStatsRow = CollectionStats & { collectionId: number };

const EMPTY_STATS: CollectionStats = { itemCount: 0, totalQuantity: 0, totalSpentCents: 0 };

export type CollectionRow = Prisma.CollectionGetPayload<{ select: typeof COLLECTION_SELECT }> & CollectionStats;

// Prisma's aggregates cannot sum price × quantity, so the totals are one raw query for all the given collections.
// Postgres returns count/sum as bigint; `::int` turns them back into numbers (totals stay far below 2^31).
async function statsByCollectionIds(
  collectionIds: number[],
  executor: DbExecutor,
): Promise<Map<number, CollectionStats>> {
  if (collectionIds.length === 0) return new Map();

  const rows = await executor.$queryRaw<CollectionStatsRow[]>`
    select
      collection_id as "collectionId",
      count(*)::int as "itemCount",
      coalesce(sum(quantity), 0)::int as "totalQuantity",
      coalesce(sum(coalesce(purchase_price_cents, 0) * quantity), 0)::int as "totalSpentCents"
    from collection_items
    where collection_id in (${Prisma.join(collectionIds)})
    group by collection_id`;

  return new Map(rows.map(({ collectionId, ...stats }) => [collectionId, stats]));
}

async function withStats(
  collections: Prisma.CollectionGetPayload<{ select: typeof COLLECTION_SELECT }>[],
  executor: DbExecutor,
): Promise<CollectionRow[]> {
  const stats = await statsByCollectionIds(
    collections.map((collection) => collection.id),
    executor,
  );

  return collections.map((collection) => ({ ...collection, ...(stats.get(collection.id) ?? EMPTY_STATS) }));
}

async function findById(id: number, executor: DbExecutor = prisma): Promise<CollectionRow | undefined> {
  const collection = await executor.collection.findUnique({ where: { id }, select: COLLECTION_SELECT });

  if (!collection) return undefined;

  const [row] = await withStats([collection], executor);

  return row;
}

function buildListFilter({ name }: ListCollectionsQuery): Prisma.CollectionWhereInput {
  return name ? { name: containsText(name) } : {};
}

async function clearDefault(executor: DbExecutor): Promise<void> {
  await executor.collection.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
}

export const collectionsRepository = {
  findById,

  list: async (query: ListCollectionsQuery) => {
    const where = buildListFilter(query);
    const direction = toOrderDirection(query.direction);
    const sortField = SORT_FIELD_MAP[query.sorting_fields];

    const [collections, totalResultNumber] = await prisma.$transaction([
      prisma.collection.findMany({
        where,
        select: COLLECTION_SELECT,
        orderBy: [{ [sortField]: direction }, { id: 'asc' }],
        ...toSkipTake(query),
      }),
      prisma.collection.count({ where }),
    ]);

    return { data: await withStats(collections, prisma), totalResultNumber };
  },

  // Becoming the default clears the flag elsewhere first, inside one transaction, so the partial unique index holds.
  create: (data: CreateCollection): Promise<CollectionRow | undefined> =>
    prisma.$transaction(async (tx) => {
      if (data.isDefault) await clearDefault(tx);

      const created = await tx.collection.create({ data, select: COLLECTION_SELECT });

      return findById(created.id, tx);
    }),

  update: (id: number, data: UpdateCollection): Promise<CollectionRow | undefined> =>
    prisma.$transaction(async (tx) => {
      if (data.isDefault) await clearDefault(tx);

      const write = await tx.collection.updateMany({ where: { id }, data });

      return reloadIfUpdated(write, () => findById(id, tx));
    }),

  delete: async (id: number): Promise<{ id: number } | undefined> => {
    const write = await prisma.collection.deleteMany({ where: { id } });

    return deletedIdOrUndefined(id, write);
  },
};
