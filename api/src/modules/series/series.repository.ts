import { containsText } from '../../lib/likePatterns.ts';
import type { Prisma } from '../../generated/prisma/client.ts';
import { toOrderDirection, toSkipTake } from '../../lib/pagination.ts';
import { deletedIdOrUndefined, prisma, reloadIfUpdated } from '../../lib/prisma.ts';
import type { SeriesSortField, CreateSeries, ListSeriesQuery, UpdateSeries } from './series.schema.ts';

// The funko count comes along, so a series with no funkos still lists with 0.
const SERIES_SELECT = {
  id: true,
  name: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { funkos: true } },
} as const satisfies Prisma.SeriesSelect;

const SORT_FIELD_MAP: Record<SeriesSortField, keyof Prisma.SeriesOrderByWithRelationInput> = {
  NAME: 'name',
  CREATION_DATE: 'createdAt',
};

type SelectedSeries = Prisma.SeriesGetPayload<{ select: typeof SERIES_SELECT }>;

export type SeriesRow = Omit<SelectedSeries, '_count'> & { funkoCount: number };

function toRow({ _count, ...series }: SelectedSeries): SeriesRow {
  return { ...series, funkoCount: _count.funkos };
}

function buildListFilter({ name }: ListSeriesQuery): Prisma.SeriesWhereInput {
  return name ? { name: containsText(name) } : {};
}

async function findById(id: number): Promise<SeriesRow | undefined> {
  const series = await prisma.series.findUnique({ where: { id }, select: SERIES_SELECT });

  return series ? toRow(series) : undefined;
}

export const seriesRepository = {
  findById,

  list: async (query: ListSeriesQuery) => {
    const where = buildListFilter(query);
    const direction = toOrderDirection(query.direction);
    const sortField = SORT_FIELD_MAP[query.sorting_fields];

    const [rows, totalResultNumber] = await prisma.$transaction([
      prisma.series.findMany({
        where,
        select: SERIES_SELECT,
        orderBy: [{ [sortField]: direction }, { id: 'asc' }],
        ...toSkipTake(query),
      }),
      prisma.series.count({ where }),
    ]);

    return { data: rows.map(toRow), totalResultNumber };
  },

  create: async (data: CreateSeries): Promise<SeriesRow> =>
    toRow(await prisma.series.create({ data, select: SERIES_SELECT })),

  update: async (id: number, data: UpdateSeries): Promise<SeriesRow | undefined> => {
    const write = await prisma.series.updateMany({ where: { id }, data });

    return reloadIfUpdated(write, () => findById(id));
  },

  delete: async (id: number): Promise<{ id: number } | undefined> => {
    const write = await prisma.series.deleteMany({ where: { id } });

    return deletedIdOrUndefined(id, write);
  },
};
