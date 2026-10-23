import { and, asc, count, desc, eq, exists, gte, inArray, lte, sql, type SQL, type SQLWrapper } from 'drizzle-orm';
import { db, type DbExecutor } from '../../../db/client.ts';
import { likeContains } from '../../../db/like.ts';
import {
  collectionItems,
  type ItemCondition,
  type ItemSortField,
  type NewCollectionItem,
} from '../../../db/schema/collectionItems.ts';
import { collectionItemTags } from '../../../db/schema/collectionItemTags.ts';
import { collections } from '../../../db/schema/collections.ts';
import { funkos } from '../../../db/schema/funkos.ts';
import { tags } from '../../../db/schema/tags.ts';
import { toLimitOffset } from '../../../lib/pagination.ts';
import type { ListAllItemsQuery, UpdateCollectionItem } from './collectionItems.schema.ts';

const ITEM_COLUMNS = {
  id: collectionItems.id,
  collectionId: collectionItems.collectionId,
  collectionName: collections.name,
  funkoId: collectionItems.funkoId,
  quantity: collectionItems.quantity,
  condition: collectionItems.condition,
  purchasePriceCents: collectionItems.purchasePriceCents,
  purchaseCurrency: collectionItems.purchaseCurrency,
  purchasedAt: collectionItems.purchasedAt,
  notes: collectionItems.notes,
  createdAt: collectionItems.createdAt,
  updatedAt: collectionItems.updatedAt,
} as const;

const SORT_FIELD_MAP: Record<ItemSortField, SQLWrapper> = {
  NAME: funkos.name,
  NUMBER: sql`cast(${funkos.number} as integer)`,
  CREATION_DATE: collectionItems.createdAt,
  UPDATE_DATE: collectionItems.updatedAt,
  PURCHASE_DATE: collectionItems.purchasedAt,
  PURCHASE_PRICE: collectionItems.purchasePriceCents,
};

function hasAnyTag(tagIds: number[]): SQL {
  return exists(
    db
      .select({ one: sql`1` })
      .from(collectionItemTags)
      .where(
        and(eq(collectionItemTags.collectionItemId, collectionItems.id), inArray(collectionItemTags.tagId, tagIds)),
      ),
  );
}

function buildListFilter(query: ListAllItemsQuery): SQL | undefined {
  const collectionFilter = query.collectionId ? inArray(collectionItems.collectionId, query.collectionId) : undefined;
  const nameFilter = query.name ? likeContains(funkos.name, query.name) : undefined;
  const funkoFilter = query.funkoId ? inArray(collectionItems.funkoId, query.funkoId) : undefined;
  const tagFilter = query.tagId ? hasAnyTag(query.tagId) : undefined;
  const categoryFilter = query.categoryId ? inArray(funkos.categoryId, query.categoryId) : undefined;
  const seriesFilter = query.seriesId ? inArray(funkos.seriesId, query.seriesId) : undefined;
  const conditionFilter = query.condition ? eq(collectionItems.condition, query.condition) : undefined;
  const fromFilter = query.purchasedFrom ? gte(collectionItems.purchasedAt, query.purchasedFrom) : undefined;
  const toFilter = query.purchasedTo ? lte(collectionItems.purchasedAt, query.purchasedTo) : undefined;

  return and(
    collectionFilter,
    nameFilter,
    funkoFilter,
    tagFilter,
    categoryFilter,
    seriesFilter,
    conditionFilter,
    fromFilter,
    toFilter,
  );
}

function selectItems(executor: DbExecutor) {
  return executor
    .select(ITEM_COLUMNS)
    .from(collectionItems)
    .innerJoin(collections, eq(collections.id, collectionItems.collectionId))
    .innerJoin(funkos, eq(funkos.id, collectionItems.funkoId));
}

async function replaceTags(executor: DbExecutor, itemId: number, tagIds: number[]): Promise<void> {
  await executor.delete(collectionItemTags).where(eq(collectionItemTags.collectionItemId, itemId));

  if (tagIds.length === 0) return;

  await executor.insert(collectionItemTags).values(tagIds.map((tagId) => ({ collectionItemId: itemId, tagId })));
}

type ItemInsert = Omit<NewCollectionItem, 'id' | 'createdAt' | 'updatedAt'>;
type ItemUpdate = Omit<UpdateCollectionItem, 'tagIds'>;

export const collectionItemsRepository = {
  findById: (collectionId: number, itemId: number, executor: DbExecutor = db): Promise<ItemRow | undefined> =>
    selectItems(executor)
      .where(and(eq(collectionItems.collectionId, collectionId), eq(collectionItems.id, itemId)))
      .get(),

  findIdByFunko: (collectionId: number, funkoId: number, executor: DbExecutor = db) =>
    executor
      .select({ id: collectionItems.id })
      .from(collectionItems)
      .where(and(eq(collectionItems.collectionId, collectionId), eq(collectionItems.funkoId, funkoId)))
      .get(),

  list: async (query: ListAllItemsQuery) => {
    const filter = buildListFilter(query);
    const direction = query.direction === 'DESC' ? desc : asc;
    const sortColumn = SORT_FIELD_MAP[query.sorting_fields];
    const { limit, offset } = toLimitOffset(query);

    const [data, totals] = await Promise.all([
      selectItems(db).where(filter).orderBy(direction(sortColumn), asc(collectionItems.id)).limit(limit).offset(offset),
      db
        .select({ total: count() })
        .from(collectionItems)
        .innerJoin(funkos, eq(funkos.id, collectionItems.funkoId))
        .where(filter),
    ]);

    return { data, totalResultNumber: totals[0]?.total ?? 0 };
  },

  tagsByItemIds: async (itemIds: number[]): Promise<Map<number, TagRow[]>> => {
    if (itemIds.length === 0) return new Map();

    const rows = await db
      .select({ itemId: collectionItemTags.collectionItemId, id: tags.id, name: tags.name })
      .from(collectionItemTags)
      .innerJoin(tags, eq(tags.id, collectionItemTags.tagId))
      .where(inArray(collectionItemTags.collectionItemId, itemIds))
      .orderBy(asc(tags.name));
    const grouped = new Map<number, TagRow[]>();

    for (const row of rows) {
      const bucket = grouped.get(row.itemId) ?? [];

      bucket.push({ id: row.id, name: row.name });
      grouped.set(row.itemId, bucket);
    }

    return grouped;
  },

  countExistingTags: async (tagIds: number[], executor: DbExecutor = db): Promise<number> => {
    if (tagIds.length === 0) return 0;

    const row = await executor.select({ total: count() }).from(tags).where(inArray(tags.id, tagIds)).get();

    return row?.total ?? 0;
  },

  // Row and tags in one transaction: an item never appears with half its tags.
  create: (data: ItemInsert, tagIds: number[]): Promise<ItemRow | undefined> =>
    db.transaction(async (tx) => {
      const inserted = await tx.insert(collectionItems).values(data).returning({ id: collectionItems.id }).get();

      await replaceTags(tx, inserted.id, tagIds);

      return selectItems(tx).where(eq(collectionItems.id, inserted.id)).get();
    }),

  update: (itemId: number, data: ItemUpdate, tagIds: number[] | undefined): Promise<ItemRow | undefined> =>
    db.transaction(async (tx) => {
      const hasFieldChanges = Object.keys(data).length > 0;

      if (hasFieldChanges) {
        const updated = await tx
          .update(collectionItems)
          .set(data)
          .where(eq(collectionItems.id, itemId))
          .returning({ id: collectionItems.id })
          .get();

        if (!updated) return undefined;
      }

      if (tagIds) await replaceTags(tx, itemId, tagIds);

      return selectItems(tx).where(eq(collectionItems.id, itemId)).get();
    }),

  move: async (itemId: number, toCollectionId: number, executor: DbExecutor = db): Promise<ItemRow | undefined> => {
    const updated = await executor
      .update(collectionItems)
      .set({ collectionId: toCollectionId })
      .where(eq(collectionItems.id, itemId))
      .returning({ id: collectionItems.id })
      .get();

    if (!updated) return undefined;

    return selectItems(executor).where(eq(collectionItems.id, itemId)).get();
  },

  delete: (collectionId: number, itemId: number, executor: DbExecutor = db): Promise<{ id: number } | undefined> =>
    executor
      .delete(collectionItems)
      .where(and(eq(collectionItems.collectionId, collectionId), eq(collectionItems.id, itemId)))
      .returning({ id: collectionItems.id })
      .get(),
};

export type ItemRow = {
  id: number;
  collectionId: number;
  collectionName: string;
  funkoId: number;
  quantity: number;
  condition: ItemCondition | null;
  purchasePriceCents: number | null;
  purchaseCurrency: string;
  purchasedAt: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TagRow = { id: number; name: string };
