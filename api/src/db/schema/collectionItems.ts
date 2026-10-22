import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { timestamps } from './_columns.ts';
import { collections } from './collections.ts';
import { funkos } from './funkos.ts';

export const ITEM_CONDITIONS = ['MINT_IN_BOX', 'BOX_DAMAGED', 'OUT_OF_BOX'] as const;
export type ItemCondition = (typeof ITEM_CONDITIONS)[number];

export const ITEM_SORT_FIELDS = [
  'NAME',
  'NUMBER',
  'CREATION_DATE',
  'UPDATE_DATE',
  'PURCHASE_DATE',
  'PURCHASE_PRICE',
] as const;
export type ItemSortField = (typeof ITEM_SORT_FIELDS)[number];

export const DEFAULT_CURRENCY = 'EUR';

const ITEM_CONDITIONS_SQL_LIST = sql.raw(ITEM_CONDITIONS.map((condition) => `'${condition}'`).join(', '));

// One funko inside one collection. Doubles are `quantity`, not a second row.
export const collectionItems = sqliteTable(
  'collection_items',
  {
    id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
    collectionId: integer({ mode: 'number' })
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    funkoId: integer({ mode: 'number' })
      .notNull()
      .references(() => funkos.id, { onDelete: 'restrict' }),
    quantity: integer({ mode: 'number' }).notNull().default(1),
    // Nullable: a wishlist row has no box yet.
    condition: text({ enum: ITEM_CONDITIONS }),
    // Cents, never a float. SQLite has no decimal type.
    purchasePriceCents: integer({ mode: 'number' }),
    purchaseCurrency: text().notNull().default(DEFAULT_CURRENCY),
    // ISO date `YYYY-MM-DD`; a calendar day, not an instant, so text is right.
    purchasedAt: text(),
    notes: text(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('collection_items_collection_id_funko_id_uidx').on(t.collectionId, t.funkoId),
    index('collection_items_funko_id_idx').on(t.funkoId),
    index('collection_items_created_at_idx').on(t.createdAt),
    check('collection_items_quantity_chk', sql`${t.quantity} > 0`),
    check(
      'collection_items_condition_chk',
      sql`${t.condition} is null or ${t.condition} in (${ITEM_CONDITIONS_SQL_LIST})`,
    ),
    check('collection_items_purchase_price_chk', sql`${t.purchasePriceCents} is null or ${t.purchasePriceCents} >= 0`),
  ],
);

export type CollectionItem = typeof collectionItems.$inferSelect;
export type NewCollectionItem = typeof collectionItems.$inferInsert;
