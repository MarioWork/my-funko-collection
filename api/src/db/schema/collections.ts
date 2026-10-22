import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { timestamps } from './_columns.ts';

export const COLLECTION_SORT_FIELDS = ['NAME', 'CREATION_DATE'] as const;
export type CollectionSortField = (typeof COLLECTION_SORT_FIELDS)[number];

// One of the user's own lists: "Owned", "Wishlist", "For sale". Exactly one is the default.
export const collections = sqliteTable(
  'collections',
  {
    id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
    name: text().notNull(),
    notes: text(),
    isDefault: integer({ mode: 'boolean' }).notNull().default(false),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('collections_name_uidx').on(t.name),
    uniqueIndex('collections_is_default_uidx')
      .on(t.isDefault)
      .where(sql`${t.isDefault} = 1`),
    index('collections_created_at_idx').on(t.createdAt),
  ],
);

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
