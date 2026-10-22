import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { timestamps } from './_columns.ts';

export const TAG_SORT_FIELDS = ['NAME', 'CREATION_DATE'] as const;
export type TagSortField = (typeof TAG_SORT_FIELDS)[number];

// A free label on a collection item. First use: the storage box ("Box 3").
export const tags = sqliteTable(
  'tags',
  {
    id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
    name: text().notNull(),
    notes: text(),
    ...timestamps,
  },
  (t) => [uniqueIndex('tags_name_uidx').on(t.name), index('tags_created_at_idx').on(t.createdAt)],
);

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
