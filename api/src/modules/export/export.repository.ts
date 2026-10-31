import type { Prisma } from '../../generated/prisma/client.ts';
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

// Whole tables, explicit columns, ordered by id so two exports of the same data are byte-identical.
export const exportRepository = {
  categories: () => prisma.category.findMany({ select: NAME_SELECT, orderBy: BY_ID }),

  series: () => prisma.series.findMany({ select: NAME_SELECT, orderBy: BY_ID }),

  funkos: () => prisma.funko.findMany({ select: FUNKO_SELECT, orderBy: BY_ID }),

  images: () =>
    prisma.funkoImage.findMany({ select: IMAGE_SELECT, orderBy: [{ funkoId: 'asc' }, { position: 'asc' }] }),

  collections: () => prisma.collection.findMany({ select: COLLECTION_SELECT, orderBy: BY_ID }),

  tags: () => prisma.tag.findMany({ select: TAG_SELECT, orderBy: BY_ID }),

  items: () => prisma.collectionItem.findMany({ select: ITEM_SELECT, orderBy: BY_ID }),

  itemTags: async () => {
    const rows = await prisma.collectionItemTag.findMany({
      select: ITEM_TAG_SELECT,
      orderBy: [{ collectionItemId: 'asc' }, { tagId: 'asc' }],
    });

    return rows.map(({ collectionItemId, tagId }) => ({ itemId: collectionItemId, tagId }));
  },
};
