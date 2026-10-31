import type { Prisma } from '../../generated/prisma/client.ts';
import { prisma } from '../../lib/prisma.ts';

type CollectionTotalsRow = {
  id: number;
  name: string;
  isDefault: boolean;
  itemCount: number;
  totalQuantity: number;
  totalSpentCents: number;
};

type CategoryTotalsRow = { id: number; name: string; funkoCount: number };

// The home page counts one user's data: their collections and the funkos in them, not the whole catalogue.
function ownFunkoFilter(userId: number): Prisma.FunkoWhereInput {
  return { collectionItems: { some: { collection: { userId } } } };
}

// A category with how many of the user's funkos it holds: a builder, since the count depends on the user.
function categoryTotalsSelect(userId: number) {
  return {
    id: true,
    name: true,
    _count: { select: { funkos: { where: ownFunkoFilter(userId) } } },
  } as const satisfies Prisma.CategorySelect;
}

export const statsRepository = {
  counts: async (userId: number) => {
    const ownFunko = ownFunkoFilter(userId);

    const [funkoCount, categoryCount, tagCount, imageTotals] = await prisma.$transaction([
      prisma.funko.count({ where: ownFunko }),
      prisma.category.count({ where: { funkos: { some: ownFunko } } }),
      prisma.tag.count({ where: { userId } }),
      prisma.funkoImage.aggregate({ where: { funko: ownFunko }, _count: { _all: true }, _sum: { sizeBytes: true } }),
    ]);

    return {
      funkoCount,
      categoryCount,
      tagCount,
      imageCount: imageTotals._count._all,
      imageBytes: imageTotals._sum.sizeBytes ?? 0,
    };
  },

  // Raw: Prisma's aggregates cannot sum price × quantity. Postgres returns count/sum as bigint, hence `::int`.
  perCollection: (userId: number) =>
    prisma.$queryRaw<CollectionTotalsRow[]>`
      select
        c.id,
        c.name,
        c.is_default as "isDefault",
        count(i.id)::int as "itemCount",
        coalesce(sum(i.quantity), 0)::int as "totalQuantity",
        coalesce(sum(coalesce(i.purchase_price_cents, 0) * i.quantity), 0)::int as "totalSpentCents"
      from collections c
      left join collection_items i on i.collection_id = c.id
      where c.user_id = ${userId}
      group by c.id
      order by c.name`,

  // Only the categories the user has a funko of, each with how many of their funkos it holds.
  perCategory: async (userId: number): Promise<CategoryTotalsRow[]> => {
    const categories = await prisma.category.findMany({
      where: { funkos: { some: ownFunkoFilter(userId) } },
      select: categoryTotalsSelect(userId),
      orderBy: { name: 'asc' },
    });

    return categories.map(({ _count, ...category }) => ({ ...category, funkoCount: _count.funkos }));
  },
};
