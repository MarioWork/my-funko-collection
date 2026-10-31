import { visibleTo } from '../../lib/catalogueVisibility.ts';
import { containsText } from '../../lib/likePatterns.ts';
import type { Prisma } from '../../generated/prisma/client.ts';
import { toOrderDirection, toSkipTake } from '../../lib/pagination.ts';
import { deletedIdOrUndefined, ID_SELECT, prisma, reloadIfUpdated } from '../../lib/prisma.ts';
import type { CategorySortField, ListCategoriesQuery, UpdateCategory } from './categories.schema.ts';

// The funko count comes along, so a category with no funkos still lists with 0. It counts only the funkos `userId`
// sees: another member's waiting submission never shows, not even as a number.
function categorySelect(userId: number) {
  return {
    id: true,
    name: true,
    status: true,
    submittedById: true,
    createdAt: true,
    updatedAt: true,
    _count: { select: { funkos: { where: visibleTo(userId) } } },
  } as const satisfies Prisma.CategorySelect;
}

const SORT_FIELD_MAP: Record<CategorySortField, keyof Prisma.CategoryOrderByWithRelationInput> = {
  NAME: 'name',
  CREATION_DATE: 'createdAt',
};

type SelectedCategory = Prisma.CategoryGetPayload<{ select: ReturnType<typeof categorySelect> }>;

export type CategoryRow = Omit<SelectedCategory, '_count'> & { funkoCount: number };

export type NewCategory = Pick<Prisma.CategoryUncheckedCreateInput, 'name' | 'status' | 'submittedById'>;

// Where a name must be unique: the approved catalogue (null), or one member's waiting categories.
export type NameScope = { submittedById: number | null };

function toRow({ _count, ...category }: SelectedCategory): CategoryRow {
  return { ...category, funkoCount: _count.funkos };
}

function buildListFilter(userId: number, { name }: ListCategoriesQuery): Prisma.CategoryWhereInput {
  return { AND: [visibleTo(userId), name ? { name: containsText(name) } : {}] };
}

function nameScopeFilter({ submittedById }: NameScope): Prisma.CategoryWhereInput {
  if (submittedById === null) return { status: 'APPROVED' };

  return { status: 'WAITING', submittedById };
}

// `userId` only decides which funkos the count includes; who may see the row is the service's call.
async function findById(userId: number, id: number): Promise<CategoryRow | undefined> {
  const category = await prisma.category.findUnique({ where: { id }, select: categorySelect(userId) });

  return category ? toRow(category) : undefined;
}

export const categoriesRepository = {
  findById,

  findAccess: async (id: number) =>
    (await prisma.category.findUnique({ where: { id }, select: { status: true, submittedById: true } })) ?? undefined,

  findIdByName: async (name: string, scope: NameScope) =>
    (await prisma.category.findFirst({ where: { name, ...nameScopeFilter(scope) }, select: ID_SELECT })) ?? undefined,

  list: async (userId: number, query: ListCategoriesQuery) => {
    const where = buildListFilter(userId, query);
    const direction = toOrderDirection(query.direction);
    const sortField = SORT_FIELD_MAP[query.sorting_fields];

    const [rows, totalResultNumber] = await prisma.$transaction([
      prisma.category.findMany({
        where,
        select: categorySelect(userId),
        orderBy: [{ [sortField]: direction }, { id: 'asc' }],
        ...toSkipTake(query),
      }),
      prisma.category.count({ where }),
    ]);

    return { data: rows.map(toRow), totalResultNumber };
  },

  create: async (userId: number, data: NewCategory): Promise<CategoryRow> =>
    toRow(await prisma.category.create({ data, select: categorySelect(userId) })),

  update: async (userId: number, id: number, data: UpdateCategory): Promise<CategoryRow | undefined> => {
    const write = await prisma.category.updateMany({ where: { id }, data });

    return reloadIfUpdated(write, () => findById(userId, id));
  },

  delete: async (id: number): Promise<{ id: number } | undefined> => {
    const write = await prisma.category.deleteMany({ where: { id } });

    return deletedIdOrUndefined(id, write);
  },
};
