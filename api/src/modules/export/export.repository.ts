import { asc } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { categories } from '../../db/schema/categories.ts';
import { collectionItems } from '../../db/schema/collectionItems.ts';
import { collectionItemTags } from '../../db/schema/collectionItemTags.ts';
import { collections } from '../../db/schema/collections.ts';
import { funkoImages } from '../../db/schema/funkoImages.ts';
import { funkos } from '../../db/schema/funkos.ts';
import { series } from '../../db/schema/series.ts';
import { tags } from '../../db/schema/tags.ts';

// Whole tables, explicit columns, ordered by id so two exports of the same data are byte-identical.
export const exportRepository = {
  categories: () =>
    db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.id)),

  series: () => db.select({ id: series.id, name: series.name }).from(series).orderBy(asc(series.id)),

  funkos: () =>
    db
      .select({
        id: funkos.id,
        name: funkos.name,
        number: funkos.number,
        type: funkos.type,
        categoryId: funkos.categoryId,
        seriesId: funkos.seriesId,
        isChase: funkos.isChase,
        exclusive: funkos.exclusive,
        barcode: funkos.barcode,
        createdAt: funkos.createdAt,
        updatedAt: funkos.updatedAt,
      })
      .from(funkos)
      .orderBy(asc(funkos.id)),

  images: () =>
    db
      .select({
        id: funkoImages.id,
        funkoId: funkoImages.funkoId,
        fileKey: funkoImages.fileKey,
        position: funkoImages.position,
      })
      .from(funkoImages)
      .orderBy(asc(funkoImages.funkoId), asc(funkoImages.position)),

  collections: () =>
    db
      .select({
        id: collections.id,
        name: collections.name,
        notes: collections.notes,
        isDefault: collections.isDefault,
      })
      .from(collections)
      .orderBy(asc(collections.id)),

  tags: () => db.select({ id: tags.id, name: tags.name, notes: tags.notes }).from(tags).orderBy(asc(tags.id)),

  items: () =>
    db
      .select({
        id: collectionItems.id,
        collectionId: collectionItems.collectionId,
        funkoId: collectionItems.funkoId,
        quantity: collectionItems.quantity,
        condition: collectionItems.condition,
        purchasePriceCents: collectionItems.purchasePriceCents,
        purchaseCurrency: collectionItems.purchaseCurrency,
        purchasedAt: collectionItems.purchasedAt,
        notes: collectionItems.notes,
        createdAt: collectionItems.createdAt,
        updatedAt: collectionItems.updatedAt,
      })
      .from(collectionItems)
      .orderBy(asc(collectionItems.id)),

  itemTags: () =>
    db
      .select({ itemId: collectionItemTags.collectionItemId, tagId: collectionItemTags.tagId })
      .from(collectionItemTags)
      .orderBy(asc(collectionItemTags.collectionItemId), asc(collectionItemTags.tagId)),
};
