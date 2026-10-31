import { ilikeContains } from '../../../lib/likePatterns.ts';
import { allOf, inList, numberSortKey, sortDirection } from '../../../lib/sqlFragments.ts';
import { Prisma } from '../../../generated/prisma/client.ts';
import { toSkipTake } from '../../../lib/pagination.ts';
import { deletedIdOrUndefined, ID_SELECT, prisma, reloadIfUpdated, type DbExecutor } from '../../../lib/prisma.ts';
import type { ItemSortField, ListAllItemsQuery, UpdateCollectionItem } from './collectionItems.schema.ts';
import type { ItemCondition } from './collectionItems.type.ts';

const ITEM_SELECT = {
  id: true,
  collectionId: true,
  collection: { select: { name: true } },
  funkoId: true,
  quantity: true,
  condition: true,
  purchasePriceCents: true,
  purchaseCurrency: true,
  purchasedAt: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.CollectionItemSelect;

const ITEM_TAG_SELECT = {
  collectionItemId: true,
  tag: { select: { id: true, name: true } },
} as const satisfies Prisma.CollectionItemTagSelect;

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

type ItemInsert = Omit<Prisma.CollectionItemUncheckedCreateInput, 'id' | 'createdAt' | 'updatedAt' | 'itemTags'>;
type ItemUpdate = Omit<UpdateCollectionItem, 'tagIds'>;

type CountRow = { total: number };

// The list is raw SQL: Prisma cannot sort by a funko number's numeric value. `i` is the item, `f` its funko.
const SORT_FIELD_MAP: Record<ItemSortField, Prisma.Sql> = {
  NAME: Prisma.sql`f.name`,
  NUMBER: numberSortKey(Prisma.sql`f.number`),
  CREATION_DATE: Prisma.sql`i.created_at`,
  UPDATE_DATE: Prisma.sql`i.updated_at`,
  PURCHASE_DATE: Prisma.sql`i.purchased_at`,
  PURCHASE_PRICE: Prisma.sql`i.purchase_price_cents`,
};

function hasAnyTag(tagIds: number[]): Prisma.Sql {
  return Prisma.sql`exists (
    select 1 from collection_item_tags t where t.collection_item_id = i.id and ${inList(Prisma.sql`t.tag_id`, tagIds)}
  )`;
}

// `c` is the item's collection: only the user's own collections count.
function buildListFilter(userId: number, query: ListAllItemsQuery): Prisma.Sql {
  return allOf([
    Prisma.sql`c.user_id = ${userId}`,
    query.collectionId ? inList(Prisma.sql`i.collection_id`, query.collectionId) : undefined,
    query.name ? ilikeContains(Prisma.sql`f.name`, query.name) : undefined,
    query.funkoId ? inList(Prisma.sql`i.funko_id`, query.funkoId) : undefined,
    query.tagId ? hasAnyTag(query.tagId) : undefined,
    query.categoryId ? inList(Prisma.sql`f.category_id`, query.categoryId) : undefined,
    query.seriesId ? inList(Prisma.sql`f.series_id`, query.seriesId) : undefined,
    query.condition ? Prisma.sql`i.condition = ${query.condition}::item_condition` : undefined,
    query.purchasedFrom ? Prisma.sql`i.purchased_at >= ${query.purchasedFrom}` : undefined,
    query.purchasedTo ? Prisma.sql`i.purchased_at <= ${query.purchasedTo}` : undefined,
  ]);
}

function toRow({ collection, ...item }: Prisma.CollectionItemGetPayload<{ select: typeof ITEM_SELECT }>): ItemRow {
  return { ...item, collectionName: collection.name };
}

async function findRow(where: Prisma.CollectionItemWhereInput, executor: DbExecutor): Promise<ItemRow | undefined> {
  const item = await executor.collectionItem.findFirst({ where, select: ITEM_SELECT });

  return item ? toRow(item) : undefined;
}

async function replaceTags(executor: DbExecutor, itemId: number, tagIds: number[]): Promise<void> {
  await executor.collectionItemTag.deleteMany({ where: { collectionItemId: itemId } });

  if (tagIds.length === 0) return;

  await executor.collectionItemTag.createMany({ data: tagIds.map((tagId) => ({ collectionItemId: itemId, tagId })) });
}

export const collectionItemsRepository = {
  // The owner is part of every lookup by id: an item in another user's collection is not found.
  findById: (userId: number, collectionId: number, itemId: number): Promise<ItemRow | undefined> =>
    findRow({ collectionId, id: itemId, collection: { userId } }, prisma),

  findIdByFunko: async (collectionId: number, funkoId: number) =>
    (await prisma.collectionItem.findUnique({
      where: { collectionId_funkoId: { collectionId, funkoId } },
      select: ID_SELECT,
    })) ?? undefined,

  list: async (userId: number, query: ListAllItemsQuery) => {
    const filter = buildListFilter(userId, query);
    const sortColumn = SORT_FIELD_MAP[query.sorting_fields];
    const { skip, take } = toSkipTake(query);

    const [data, totals] = await prisma.$transaction([
      prisma.$queryRaw<ItemRow[]>`
        select
          i.id,
          i.collection_id as "collectionId",
          c.name as "collectionName",
          i.funko_id as "funkoId",
          i.quantity,
          i.condition::text as condition,
          i.purchase_price_cents as "purchasePriceCents",
          i.purchase_currency as "purchaseCurrency",
          i.purchased_at as "purchasedAt",
          i.notes,
          i.created_at as "createdAt",
          i.updated_at as "updatedAt"
        from collection_items i
        join collections c on c.id = i.collection_id
        join funkos f on f.id = i.funko_id
        where ${filter}
        order by ${sortColumn} ${sortDirection(query.direction)}, i.id asc
        limit ${take} offset ${skip}`,
      prisma.$queryRaw<CountRow[]>`
        select count(*)::int as total
        from collection_items i
        join collections c on c.id = i.collection_id
        join funkos f on f.id = i.funko_id
        where ${filter}`,
    ]);

    return { data, totalResultNumber: totals[0]?.total ?? 0 };
  },

  tagsByItemIds: async (itemIds: number[]): Promise<Map<number, TagRow[]>> => {
    if (itemIds.length === 0) return new Map();

    const rows = await prisma.collectionItemTag.findMany({
      where: { collectionItemId: { in: itemIds } },
      select: ITEM_TAG_SELECT,
      orderBy: { tag: { name: 'asc' } },
    });
    const grouped = new Map<number, TagRow[]>();

    for (const row of rows) {
      const bucket = grouped.get(row.collectionItemId) ?? [];

      bucket.push(row.tag);
      grouped.set(row.collectionItemId, bucket);
    }

    return grouped;
  },

  countExistingTags: (tagIds: number[]): Promise<number> =>
    tagIds.length === 0 ? Promise.resolve(0) : prisma.tag.count({ where: { id: { in: tagIds } } }),

  // Row and tags in one transaction: an item never appears with half its tags.
  create: (data: ItemInsert, tagIds: number[]): Promise<ItemRow | undefined> =>
    prisma.$transaction(async (tx) => {
      const created = await tx.collectionItem.create({ data, select: ID_SELECT });

      await replaceTags(tx, created.id, tagIds);

      return findRow({ id: created.id }, tx);
    }),

  update: (itemId: number, data: ItemUpdate, tagIds: number[] | undefined): Promise<ItemRow | undefined> =>
    prisma.$transaction(async (tx) => {
      const hasFieldChanges = Object.keys(data).length > 0;

      if (hasFieldChanges) {
        const { count } = await tx.collectionItem.updateMany({ where: { id: itemId }, data });

        if (count === 0) return undefined;
      }

      if (tagIds) await replaceTags(tx, itemId, tagIds);

      return findRow({ id: itemId }, tx);
    }),

  move: async (itemId: number, toCollectionId: number): Promise<ItemRow | undefined> => {
    const write = await prisma.collectionItem.updateMany({
      where: { id: itemId },
      data: { collectionId: toCollectionId },
    });

    return reloadIfUpdated(write, () => findRow({ id: itemId }, prisma));
  },

  delete: async (userId: number, collectionId: number, itemId: number): Promise<{ id: number } | undefined> => {
    const write = await prisma.collectionItem.deleteMany({
      where: { collectionId, id: itemId, collection: { userId } },
    });

    return deletedIdOrUndefined(itemId, write);
  },
};
