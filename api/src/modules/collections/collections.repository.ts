import { and, asc, count, desc, eq, sql, type SQL } from 'drizzle-orm';
import { db, type DbExecutor } from '../../db/client.ts';
import { likeContains } from '../../db/like.ts';
import { collectionItems } from '../../db/schema/collectionItems.ts';
import { collections, type CollectionSortField } from '../../db/schema/collections.ts';
import { toLimitOffset } from '../../lib/pagination.ts';
import type { CreateCollection, ListCollectionsQuery, UpdateCollection } from './collections.schema.ts';

const COLLECTION_COLUMNS = {
  id: collections.id,
  name: collections.name,
  notes: collections.notes,
  isDefault: collections.isDefault,
  createdAt: collections.createdAt,
  updatedAt: collections.updatedAt,
} as const;

const STAT_COLUMNS = {
  itemCount: count(collectionItems.id),
  totalQuantity: sql<number>`coalesce(sum(${collectionItems.quantity}), 0)`,
  totalSpentCents: sql<number>`coalesce(sum(coalesce(${collectionItems.purchasePriceCents}, 0) * ${collectionItems.quantity}), 0)`,
} as const;

const SORT_FIELD_MAP: Record<CollectionSortField, typeof collections.name | typeof collections.createdAt> = {
  NAME: collections.name,
  CREATION_DATE: collections.createdAt,
};

function buildListFilter({ name }: ListCollectionsQuery): SQL | undefined {
  const nameFilter = name ? likeContains(collections.name, name) : undefined;

  return and(nameFilter);
}

function selectWithStats(executor: DbExecutor) {
  return executor
    .select({ ...COLLECTION_COLUMNS, ...STAT_COLUMNS })
    .from(collections)
    .leftJoin(collectionItems, eq(collectionItems.collectionId, collections.id))
    .groupBy(collections.id);
}

async function clearDefault(executor: DbExecutor): Promise<void> {
  await executor.update(collections).set({ isDefault: false }).where(eq(collections.isDefault, true));
}

export const collectionsRepository = {
  findById: (id: number, executor: DbExecutor = db): Promise<CollectionRow | undefined> =>
    selectWithStats(executor).where(eq(collections.id, id)).get(),

  list: async (query: ListCollectionsQuery) => {
    const filter = buildListFilter(query);
    const direction = query.direction === 'DESC' ? desc : asc;
    const sortColumn = SORT_FIELD_MAP[query.sorting_fields];
    const { limit, offset } = toLimitOffset(query);

    const [data, totalResultNumber] = await Promise.all([
      selectWithStats(db).where(filter).orderBy(direction(sortColumn), asc(collections.id)).limit(limit).offset(offset),
      db.$count(collections, filter),
    ]);

    return { data, totalResultNumber };
  },

  // Becoming the default clears the flag elsewhere first, inside one transaction, so the partial unique index holds.
  create: (data: CreateCollection): Promise<CollectionRow | undefined> =>
    db.transaction(async (tx) => {
      if (data.isDefault) await clearDefault(tx);

      const inserted = await tx.insert(collections).values(data).returning({ id: collections.id }).get();

      return selectWithStats(tx).where(eq(collections.id, inserted.id)).get();
    }),

  update: (id: number, data: UpdateCollection): Promise<CollectionRow | undefined> =>
    db.transaction(async (tx) => {
      if (data.isDefault) await clearDefault(tx);

      const updated = await tx
        .update(collections)
        .set(data)
        .where(eq(collections.id, id))
        .returning({ id: collections.id })
        .get();

      if (!updated) return undefined;

      return selectWithStats(tx).where(eq(collections.id, id)).get();
    }),

  delete: (id: number, executor: DbExecutor = db): Promise<{ id: number } | undefined> =>
    executor.delete(collections).where(eq(collections.id, id)).returning({ id: collections.id }).get(),
};

export type CollectionRow = {
  id: number;
  name: string;
  notes: string | null;
  isDefault: boolean;
  itemCount: number;
  totalQuantity: number;
  totalSpentCents: number;
  createdAt: Date;
  updatedAt: Date;
};
