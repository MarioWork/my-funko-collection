import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { timestamps } from './_columns.ts';

export const CATEGORY_SORT_FIELDS = ['NAME', 'CREATION_DATE'] as const;
export type CategorySortField = (typeof CATEGORY_SORT_FIELDS)[number];

// A Funko line as printed on the box: "Pop! Marvel", "Pop! Television", "Star Wars".
export const categories = sqliteTable(
  'categories',
  {
    id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
    name: text().notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex('categories_name_uidx').on(t.name), index('categories_created_at_idx').on(t.createdAt)],
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
