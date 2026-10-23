import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { timestamps } from './_columns.ts';
import { funkos } from './funkos.ts';

// One uploaded photo. The three WebP variants on disk share `fileKey`: `<key>.webp`, `<key>.md.webp`, `<key>.sm.webp`.
export const funkoImages = sqliteTable(
  'funko_images',
  {
    id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
    funkoId: integer({ mode: 'number' })
      .notNull()
      .references(() => funkos.id, { onDelete: 'cascade' }),
    fileKey: text().notNull(),
    // Dimensions of the large variant.
    width: integer({ mode: 'number' }).notNull(),
    height: integer({ mode: 'number' }).notNull(),
    // Sum of the three files.
    sizeBytes: integer({ mode: 'number' }).notNull(),
    // sha256 of the uploaded bytes, hex: the same photo twice on one funko is refused.
    contentHash: text().notNull(),
    // A tiny base64 WebP data URI shown while the real file loads.
    placeholder: text().notNull(),
    position: integer({ mode: 'number' }).notNull().default(0),
    ...timestamps,
  },
  (t) => [
    index('funko_images_funko_id_position_idx').on(t.funkoId, t.position),
    uniqueIndex('funko_images_funko_id_content_hash_uidx').on(t.funkoId, t.contentHash),
    uniqueIndex('funko_images_file_key_uidx').on(t.fileKey),
  ],
);

export type FunkoImage = typeof funkoImages.$inferSelect;
export type NewFunkoImage = typeof funkoImages.$inferInsert;
