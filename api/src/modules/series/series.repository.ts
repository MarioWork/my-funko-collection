import { catalogueOf, scopeFilter, type SubmitterScope } from '../../lib/catalogueVisibility.ts';
import { containsText } from '../../lib/likePatterns.ts';
import type { Prisma } from '../../generated/prisma/client.ts';
import { toOrderDirection, toSkipTake } from '../../lib/pagination.ts';
import { deletedIdOrUndefined, ID_SELECT, prisma, reloadIfUpdated } from '../../lib/prisma.ts';
import type { SeriesSortField, ListSeriesQuery, UpdateSeries } from './series.schema.ts';

// The funko count comes along, so a series with no funkos still lists with 0. It counts only the funkos `userId`
// sees: another member's waiting submission never shows, not even as a number.
function seriesSelect(userId: number) {
  return {
    id: true,
    name: true,
    status: true,
    submittedById: true,
    createdAt: true,
    updatedAt: true,
    _count: { select: { funkos: { where: catalogueOf(userId) } } },
  } as const satisfies Prisma.SeriesSelect;
}

const SORT_FIELD_MAP: Record<SeriesSortField, keyof Prisma.SeriesOrderByWithRelationInput> = {
  NAME: 'name',
  CREATION_DATE: 'createdAt',
};

type SelectedSeries = Prisma.SeriesGetPayload<{ select: ReturnType<typeof seriesSelect> }>;

export type SeriesRow = Omit<SelectedSeries, '_count'> & { funkoCount: number };

export type NewSeries = Pick<Prisma.SeriesUncheckedCreateInput, 'name' | 'status' | 'submittedById'>;

function toRow({ _count, ...series }: SelectedSeries): SeriesRow {
  return { ...series, funkoCount: _count.funkos };
}

function buildListFilter(userId: number, { name }: ListSeriesQuery): Prisma.SeriesWhereInput {
  return { AND: [catalogueOf(userId), name ? { name: containsText(name) } : {}] };
}

// `userId` only decides which funkos the count includes; who may see the row is the service's call.
async function findById(userId: number, id: number): Promise<SeriesRow | undefined> {
  const series = await prisma.series.findUnique({ where: { id }, select: seriesSelect(userId) });

  return series ? toRow(series) : undefined;
}

export const seriesRepository = {
  findById,

  findAccess: async (id: number) =>
    (await prisma.series.findUnique({ where: { id }, select: { status: true, submittedById: true } })) ?? undefined,

  findIdByName: async (name: string, scope: SubmitterScope) =>
    (await prisma.series.findFirst({ where: { name, ...scopeFilter(scope) }, select: ID_SELECT })) ?? undefined,

  list: async (userId: number, query: ListSeriesQuery) => {
    const where = buildListFilter(userId, query);
    const direction = toOrderDirection(query.direction);
    const sortField = SORT_FIELD_MAP[query.sorting_fields];

    const [rows, totalResultNumber] = await prisma.$transaction([
      prisma.series.findMany({
        where,
        select: seriesSelect(userId),
        orderBy: [{ [sortField]: direction }, { id: 'asc' }],
        ...toSkipTake(query),
      }),
      prisma.series.count({ where }),
    ]);

    return { data: rows.map(toRow), totalResultNumber };
  },

  create: async (userId: number, data: NewSeries): Promise<SeriesRow> =>
    toRow(await prisma.series.create({ data, select: seriesSelect(userId) })),

  update: async (userId: number, id: number, data: UpdateSeries): Promise<SeriesRow | undefined> => {
    const write = await prisma.series.updateMany({ where: { id }, data });

    return reloadIfUpdated(write, () => findById(userId, id));
  },

  delete: async (id: number): Promise<{ id: number } | undefined> => {
    const write = await prisma.series.deleteMany({ where: { id } });

    return deletedIdOrUndefined(id, write);
  },
};
