import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { timestamps } from './_columns.ts';

export const SERIES_SORT_FIELDS = ['NAME', 'CREATION_DATE'] as const;
export type SeriesSortField = (typeof SERIES_SORT_FIELDS)[number];

// The show, film or game a figure comes from: "Daredevil: Born Again", "The Mandalorian". Optional on a funko.
export const series = sqliteTable(
  'series',
  {
    id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
    name: text().notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex('series_name_uidx').on(t.name), index('series_created_at_idx').on(t.createdAt)],
);

export type Series = typeof series.$inferSelect;
export type NewSeries = typeof series.$inferInsert;
