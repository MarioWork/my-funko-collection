import { and, asc, count, desc, eq, type SQL } from 'drizzle-orm';
import { db, type DbExecutor } from '../../db/client.ts';
import { likeContains } from '../../db/like.ts';
import { categories, type CategorySortField } from '../../db/schema/categories.ts';
import { funkos } from '../../db/schema/funkos.ts';
import { toLimitOffset } from '../../lib/pagination.ts';
import type { CreateCategory, ListCategoriesQuery, UpdateCategory } from './categories.schema.ts';

const CATEGORY_COLUMNS = {
  id: categories.id,
  name: categories.name,
  createdAt: categories.createdAt,
  updatedAt: categories.updatedAt,
} as const;

const SORT_FIELD_MAP: Record<CategorySortField, typeof categories.name | typeof categories.createdAt> = {
  NAME: categories.name,
  CREATION_DATE: categories.createdAt,
};

function buildListFilter({ name }: ListCategoriesQuery): SQL | undefined {
  const nameFilter = name ? likeContains(categories.name, name) : undefined;

  return and(nameFilter);
}

// The count comes from a left join + group by, so a category with no funkos still lists with 0.
function selectWithCount(executor: DbExecutor) {
  return executor
    .select({ ...CATEGORY_COLUMNS, funkoCount: count(funkos.id) })
    .from(categories)
    .leftJoin(funkos, eq(funkos.categoryId, categories.id))
    .groupBy(categories.id);
}

export const categoriesRepository = {
  findById: (id: number, executor: DbExecutor = db): Promise<CategoryRow | undefined> =>
    selectWithCount(executor).where(eq(categories.id, id)).get(),

  list: async (query: ListCategoriesQuery) => {
    const filter = buildListFilter(query);
    const direction = query.direction === 'DESC' ? desc : asc;
    const sortColumn = SORT_FIELD_MAP[query.sorting_fields];
    const { limit, offset } = toLimitOffset(query);

    const [data, totalResultNumber] = await Promise.all([
      selectWithCount(db).where(filter).orderBy(direction(sortColumn), asc(categories.id)).limit(limit).offset(offset),
      db.$count(categories, filter),
    ]);

    return { data, totalResultNumber };
  },

  create: async (data: CreateCategory, executor: DbExecutor = db): Promise<CategoryRow> => {
    const inserted = await executor.insert(categories).values(data).returning(CATEGORY_COLUMNS).get();

    return { ...inserted, funkoCount: 0 };
  },

  update: async (id: number, data: UpdateCategory, executor: DbExecutor = db): Promise<CategoryRow | undefined> => {
    const updated = await executor
      .update(categories)
      .set(data)
      .where(eq(categories.id, id))
      .returning({ id: categories.id })
      .get();

    if (!updated) return undefined;

    return selectWithCount(executor).where(eq(categories.id, id)).get();
  },

  delete: (id: number, executor: DbExecutor = db): Promise<{ id: number } | undefined> =>
    executor.delete(categories).where(eq(categories.id, id)).returning({ id: categories.id }).get(),
};

export type CategoryRow = Awaited<ReturnType<typeof selectWithCount>>[number];
