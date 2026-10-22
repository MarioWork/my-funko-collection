import { asc, count, eq, sql } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { categories } from '../../db/schema/categories.ts';
import { collectionItems } from '../../db/schema/collectionItems.ts';
import { collections } from '../../db/schema/collections.ts';
import { funkoImages } from '../../db/schema/funkoImages.ts';
import { funkos } from '../../db/schema/funkos.ts';
import { tags } from '../../db/schema/tags.ts';

export const statsRepository = {
  counts: async () => {
    const [funkoCount, categoryCount, tagCount, imageTotals] = await Promise.all([
      db.$count(funkos),
      db.$count(categories),
      db.$count(tags),
      db
        .select({ imageCount: count(), imageBytes: sql<number>`coalesce(sum(${funkoImages.sizeBytes}), 0)` })
        .from(funkoImages)
        .get(),
    ]);

    return {
      funkoCount,
      categoryCount,
      tagCount,
      imageCount: imageTotals?.imageCount ?? 0,
      imageBytes: imageTotals?.imageBytes ?? 0,
    };
  },

  perCollection: () =>
    db
      .select({
        id: collections.id,
        name: collections.name,
        isDefault: collections.isDefault,
        itemCount: count(collectionItems.id),
        totalQuantity: sql<number>`coalesce(sum(${collectionItems.quantity}), 0)`,
        totalSpentCents: sql<number>`coalesce(sum(coalesce(${collectionItems.purchasePriceCents}, 0) * ${collectionItems.quantity}), 0)`,
      })
      .from(collections)
      .leftJoin(collectionItems, eq(collectionItems.collectionId, collections.id))
      .groupBy(collections.id)
      .orderBy(asc(collections.name)),

  perCategory: () =>
    db
      .select({ id: categories.id, name: categories.name, funkoCount: count(funkos.id) })
      .from(categories)
      .leftJoin(funkos, eq(funkos.categoryId, categories.id))
      .groupBy(categories.id)
      .orderBy(asc(categories.name)),
};
