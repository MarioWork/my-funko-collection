import { containsText } from '../../lib/likePatterns.ts';
import type { Prisma } from '../../generated/prisma/client.ts';
import { toOrderDirection, toSkipTake } from '../../lib/pagination.ts';
import { deletedIdOrUndefined, prisma, reloadIfUpdated } from '../../lib/prisma.ts';
import type { CategorySortField, CreateCategory, ListCategoriesQuery, UpdateCategory } from './categories.schema.ts';

// The funko count comes along, so a category with no funkos still lists with 0.
const CATEGORY_SELECT = {
  id: true,
  name: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { funkos: true } },
} as const satisfies Prisma.CategorySelect;

const SORT_FIELD_MAP: Record<CategorySortField, keyof Prisma.CategoryOrderByWithRelationInput> = {
  NAME: 'name',
  CREATION_DATE: 'createdAt',
};

type SelectedCategory = Prisma.CategoryGetPayload<{ select: typeof CATEGORY_SELECT }>;

export type CategoryRow = Omit<SelectedCategory, '_count'> & { funkoCount: number };

function toRow({ _count, ...category }: SelectedCategory): CategoryRow {
  return { ...category, funkoCount: _count.funkos };
}

function buildListFilter({ name }: ListCategoriesQuery): Prisma.CategoryWhereInput {
  return name ? { name: containsText(name) } : {};
}

async function findById(id: number): Promise<CategoryRow | undefined> {
  const category = await prisma.category.findUnique({ where: { id }, select: CATEGORY_SELECT });

  return category ? toRow(category) : undefined;
}

export const categoriesRepository = {
  findById,

  list: async (query: ListCategoriesQuery) => {
    const where = buildListFilter(query);
    const direction = toOrderDirection(query.direction);
    const sortField = SORT_FIELD_MAP[query.sorting_fields];

    const [rows, totalResultNumber] = await prisma.$transaction([
      prisma.category.findMany({
        where,
        select: CATEGORY_SELECT,
        orderBy: [{ [sortField]: direction }, { id: 'asc' }],
        ...toSkipTake(query),
      }),
      prisma.category.count({ where }),
    ]);

    return { data: rows.map(toRow), totalResultNumber };
  },

  create: async (data: CreateCategory): Promise<CategoryRow> =>
    toRow(await prisma.category.create({ data, select: CATEGORY_SELECT })),

  update: async (id: number, data: UpdateCategory): Promise<CategoryRow | undefined> => {
    const write = await prisma.category.updateMany({ where: { id }, data });

    return reloadIfUpdated(write, () => findById(id));
  },

  delete: async (id: number): Promise<{ id: number } | undefined> => {
    const write = await prisma.category.deleteMany({ where: { id } });

    return deletedIdOrUndefined(id, write);
  },
};
