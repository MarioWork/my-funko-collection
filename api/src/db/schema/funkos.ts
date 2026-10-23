import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { timestamps } from './_columns.ts';
import { categories } from './categories.ts';
import { series } from './series.ts';

export const FUNKO_TYPES = [
  'POP',
  'POP_DELUXE',
  'POP_RIDES',
  'POP_MOMENT',
  'POP_TOWN',
  'POP_ALBUM',
  'POP_JUMBO',
  'POP_KEYCHAIN',
  'SODA',
  'BITTY_POP',
  'MYSTERY_MINI',
  'OTHER',
] as const;
export type FunkoType = (typeof FUNKO_TYPES)[number];

export const FUNKO_SORT_FIELDS = ['RELEVANCE', 'NAME', 'NUMBER', 'CREATION_DATE', 'CATEGORY', 'SERIES'] as const;
export type FunkoSortField = (typeof FUNKO_SORT_FIELDS)[number];

const FUNKO_TYPES_SQL_LIST = sql.raw(FUNKO_TYPES.map((type) => `'${type}'`).join(', '));

// One figure in the catalog. Numbers repeat across lines, and the same number exists as a normal, a chase and a
// sticker exclusive, so the natural key is (category, number, name, isChase, exclusive).
export const funkos = sqliteTable(
  'funkos',
  {
    id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
    name: text().notNull(),
    // Text on purpose: boxes carry "01", "1300" and "SE".
    number: text().notNull(),
    type: text({ enum: FUNKO_TYPES }).notNull().default('POP'),
    categoryId: integer({ mode: 'number' })
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    // Optional: the series it belongs to. Deleting the series clears it here.
    seriesId: integer({ mode: 'number' }).references(() => series.id, { onDelete: 'set null' }),
    isChase: integer({ mode: 'boolean' }).notNull().default(false),
    // "SDCC 2024", "Hot Topic"; empty string means a regular release (not null, so it can be part of a unique index).
    exclusive: text().notNull().default(''),
    // The UPC/EAN printed on the box, when known.
    barcode: text(),
    ...timestamps,
  },
  (t) => [
    index('funkos_category_id_idx').on(t.categoryId),
    index('funkos_series_id_idx').on(t.seriesId),
    index('funkos_name_idx').on(t.name),
    index('funkos_created_at_idx').on(t.createdAt),
    uniqueIndex('funkos_identity_uidx').on(t.categoryId, t.number, t.name, t.isChase, t.exclusive),
    uniqueIndex('funkos_barcode_uidx')
      .on(t.barcode)
      .where(sql`${t.barcode} is not null`),
    check('funkos_type_chk', sql`${t.type} in (${FUNKO_TYPES_SQL_LIST})`),
  ],
);

export type Funko = typeof funkos.$inferSelect;
export type NewFunko = typeof funkos.$inferInsert;
