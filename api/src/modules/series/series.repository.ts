import { and, asc, count, desc, eq, type SQL } from 'drizzle-orm';
import { db, type DbExecutor } from '../../db/client.ts';
import { likeContains } from '../../db/like.ts';
import { funkos } from '../../db/schema/funkos.ts';
import { series, type SeriesSortField } from '../../db/schema/series.ts';
import { toLimitOffset } from '../../lib/pagination.ts';
import type { CreateSeries, ListSeriesQuery, UpdateSeries } from './series.schema.ts';

const SERIES_COLUMNS = {
  id: series.id,
  name: series.name,
  createdAt: series.createdAt,
  updatedAt: series.updatedAt,
} as const;

const SORT_FIELD_MAP: Record<SeriesSortField, typeof series.name | typeof series.createdAt> = {
  NAME: series.name,
  CREATION_DATE: series.createdAt,
};

function buildListFilter({ name }: ListSeriesQuery): SQL | undefined {
  const nameFilter = name ? likeContains(series.name, name) : undefined;

  return and(nameFilter);
}

// The count comes from a left join + group by, so a series with no funkos still lists with 0.
function selectWithCount(executor: DbExecutor) {
  return executor
    .select({ ...SERIES_COLUMNS, funkoCount: count(funkos.id) })
    .from(series)
    .leftJoin(funkos, eq(funkos.seriesId, series.id))
    .groupBy(series.id);
}

export const seriesRepository = {
  findById: (id: number, executor: DbExecutor = db): Promise<SeriesRow | undefined> =>
    selectWithCount(executor).where(eq(series.id, id)).get(),

  list: async (query: ListSeriesQuery) => {
    const filter = buildListFilter(query);
    const direction = query.direction === 'DESC' ? desc : asc;
    const sortColumn = SORT_FIELD_MAP[query.sorting_fields];
    const { limit, offset } = toLimitOffset(query);

    const [data, totalResultNumber] = await Promise.all([
      selectWithCount(db).where(filter).orderBy(direction(sortColumn), asc(series.id)).limit(limit).offset(offset),
      db.$count(series, filter),
    ]);

    return { data, totalResultNumber };
  },

  create: async (data: CreateSeries, executor: DbExecutor = db): Promise<SeriesRow> => {
    const inserted = await executor.insert(series).values(data).returning(SERIES_COLUMNS).get();

    return { ...inserted, funkoCount: 0 };
  },

  update: async (id: number, data: UpdateSeries, executor: DbExecutor = db): Promise<SeriesRow | undefined> => {
    const updated = await executor.update(series).set(data).where(eq(series.id, id)).returning({ id: series.id }).get();

    if (!updated) return undefined;

    return selectWithCount(executor).where(eq(series.id, id)).get();
  },

  delete: (id: number, executor: DbExecutor = db): Promise<{ id: number } | undefined> =>
    executor.delete(series).where(eq(series.id, id)).returning({ id: series.id }).get(),
};

export type SeriesRow = { id: number; name: string; funkoCount: number; createdAt: Date; updatedAt: Date };
