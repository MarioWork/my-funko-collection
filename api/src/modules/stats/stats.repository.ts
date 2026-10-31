import { prisma } from '../../lib/prisma.ts';

const CATEGORY_TOTALS_SELECT = { id: true, name: true, _count: { select: { funkos: true } } } as const;

type CollectionTotalsRow = {
  id: number;
  name: string;
  isDefault: boolean;
  itemCount: number;
  totalQuantity: number;
  totalSpentCents: number;
};

type CategoryTotalsRow = { id: number; name: string; funkoCount: number };

export const statsRepository = {
  counts: async () => {
    const [funkoCount, categoryCount, tagCount, imageTotals] = await prisma.$transaction([
      prisma.funko.count(),
      prisma.category.count(),
      prisma.tag.count(),
      prisma.funkoImage.aggregate({ _count: { _all: true }, _sum: { sizeBytes: true } }),
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
  perCollection: () =>
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
      group by c.id
      order by c.name`,

  perCategory: async (): Promise<CategoryTotalsRow[]> => {
    const categories = await prisma.category.findMany({
      select: CATEGORY_TOTALS_SELECT,
      orderBy: { name: 'asc' },
    });

    return categories.map(({ _count, ...category }) => ({ ...category, funkoCount: _count.funkos }));
  },
};
