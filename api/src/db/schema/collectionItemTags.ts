import { index, integer, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core';
import { collectionItems } from './collectionItems.ts';
import { tags } from './tags.ts';

// Junction: many tags per item, many items per tag.
export const collectionItemTags = sqliteTable(
  'collection_item_tags',
  {
    collectionItemId: integer({ mode: 'number' })
      .notNull()
      .references(() => collectionItems.id, { onDelete: 'cascade' }),
    tagId: integer({ mode: 'number' })
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [
    primaryKey({ name: 'collection_item_tags_pk', columns: [t.collectionItemId, t.tagId] }),
    index('collection_item_tags_tag_id_idx').on(t.tagId),
  ],
);

export type CollectionItemTag = typeof collectionItemTags.$inferSelect;
