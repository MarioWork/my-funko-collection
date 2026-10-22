// Every `relations()` declaration lives here, in one place (node-ts-drizzle §6).
import { relations } from 'drizzle-orm';
import { categories } from './schema/categories.ts';
import { collectionItems } from './schema/collectionItems.ts';
import { collectionItemTags } from './schema/collectionItemTags.ts';
import { collections } from './schema/collections.ts';
import { funkoImages } from './schema/funkoImages.ts';
import { funkos } from './schema/funkos.ts';
import { tags } from './schema/tags.ts';

export const categoriesRelations = relations(categories, ({ many }) => ({
  funkos: many(funkos),
}));

export const funkosRelations = relations(funkos, ({ one, many }) => ({
  category: one(categories, { fields: [funkos.categoryId], references: [categories.id] }),
  images: many(funkoImages),
  collectionItems: many(collectionItems),
}));

export const funkoImagesRelations = relations(funkoImages, ({ one }) => ({
  funko: one(funkos, { fields: [funkoImages.funkoId], references: [funkos.id] }),
}));

export const collectionsRelations = relations(collections, ({ many }) => ({
  items: many(collectionItems),
}));

export const collectionItemsRelations = relations(collectionItems, ({ one, many }) => ({
  collection: one(collections, { fields: [collectionItems.collectionId], references: [collections.id] }),
  funko: one(funkos, { fields: [collectionItems.funkoId], references: [funkos.id] }),
  itemTags: many(collectionItemTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  itemTags: many(collectionItemTags),
}));

export const collectionItemTagsRelations = relations(collectionItemTags, ({ one }) => ({
  item: one(collectionItems, { fields: [collectionItemTags.collectionItemId], references: [collectionItems.id] }),
  tag: one(tags, { fields: [collectionItemTags.tagId], references: [tags.id] }),
}));
