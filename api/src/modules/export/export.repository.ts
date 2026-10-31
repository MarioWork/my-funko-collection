import type { Prisma } from '../../generated/prisma/client.ts';
import { visibleTo } from '../../lib/catalogueVisibility.ts';
import { prisma } from '../../lib/prisma.ts';

const NAME_SELECT = { id: true, name: true } as const;

const FUNKO_SELECT = {
  id: true,
  name: true,
  number: true,
  type: true,
  categoryId: true,
  seriesId: true,
  isChase: true,
  exclusive: true,
  barcode: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.FunkoSelect;

const IMAGE_SELECT = {
  id: true,
  funkoId: true,
  fileKey: true,
  position: true,
} as const satisfies Prisma.FunkoImageSelect;

const COLLECTION_SELECT = {
  id: true,
  name: true,
  notes: true,
  isDefault: true,
} as const satisfies Prisma.CollectionSelect;

const TAG_SELECT = { id: true, name: true, notes: true } as const satisfies Prisma.TagSelect;

const ITEM_SELECT = {
  id: true,
  collectionId: true,
  funkoId: true,
  quantity: true,
  condition: true,
  purchasePriceCents: true,
  purchaseCurrency: true,
  purchasedAt: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.CollectionItemSelect;

const ITEM_TAG_SELECT = { collectionItemId: true, tagId: true } as const satisfies Prisma.CollectionItemTagSelect;

const BY_ID = { id: 'asc' } as const;

// Explicit columns, ordered by id so two exports of the same data are byte-identical. The catalogue (categories,
// series, funkos, images) is what `userId` sees of it (approved, plus what they sent in); collections, tags, items
// and the tags on them are only `userId`'s own.
export const exportRepository = {
  categories: (userId: number) =>
    prisma.category.findMany({ where: visibleTo(userId), select: NAME_SELECT, orderBy: BY_ID }),

  series: (userId: number) => prisma.series.findMany({ where: visibleTo(userId), select: NAME_SELECT, orderBy: BY_ID }),

  funkos: (userId: number) => prisma.funko.findMany({ where: visibleTo(userId), select: FUNKO_SELECT, orderBy: BY_ID }),

  images: (userId: number) =>
    prisma.funkoImage.findMany({
      where: { funko: visibleTo(userId) },
      select: IMAGE_SELECT,
      orderBy: [{ funkoId: 'asc' }, { position: 'asc' }],
    }),

  collections: (userId: number) =>
    prisma.collection.findMany({ where: { userId }, select: COLLECTION_SELECT, orderBy: BY_ID }),

  tags: (userId: number) => prisma.tag.findMany({ where: { userId }, select: TAG_SELECT, orderBy: BY_ID }),

  items: (userId: number) =>
    prisma.collectionItem.findMany({ where: { collection: { userId } }, select: ITEM_SELECT, orderBy: BY_ID }),

  itemTags: async (userId: number) => {
    const rows = await prisma.collectionItemTag.findMany({
      where: { item: { collection: { userId } } },
      select: ITEM_TAG_SELECT,
      orderBy: [{ collectionItemId: 'asc' }, { tagId: 'asc' }],
    });

    return rows.map(({ collectionItemId, tagId }) => ({ itemId: collectionItemId, tagId }));
  },
};
