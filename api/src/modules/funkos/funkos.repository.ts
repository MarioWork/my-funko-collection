// What the funkos jobs share: a funko's row, the user's own collections it is in, and who has it (never whose).
import type { Prisma } from '../../generated/prisma/client.ts';
import { ID_SELECT, prisma } from '../../lib/prisma.ts';
import type { FunkoRow } from './funkos.type.ts';

export const FUNKO_SELECT = {
  id: true,
  name: true,
  number: true,
  type: true,
  isChase: true,
  exclusive: true,
  barcode: true,
  categoryId: true,
  category: { select: { name: true } },
  seriesId: true,
  series: { select: { name: true } },
  status: true,
  submittedById: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.FunkoSelect;

const FUNKO_COLLECTION_SELECT = {
  funkoId: true,
  collection: { select: { id: true, name: true } },
} as const satisfies Prisma.CollectionItemSelect;

export type CollectionSummaryRow = { funkoId: number; id: number; name: string };

// The client a query runs on: the shared one, or a transaction's.
type QueryClient = Pick<typeof prisma, 'user'>;

// Users with the funko in at least one of their collections.
function holdsFunko(funkoId: number): Prisma.UserWhereInput {
  return { collections: { some: { items: { some: { funkoId } } } } };
}

export async function findHolderIdsIn(client: QueryClient, funkoId: number): Promise<number[]> {
  const holders = await client.user.findMany({ where: holdsFunko(funkoId), select: ID_SELECT, orderBy: { id: 'asc' } });

  return holders.map((holder) => holder.id);
}

export function toRow({
  category,
  series,
  ...funko
}: Prisma.FunkoGetPayload<{ select: typeof FUNKO_SELECT }>): FunkoRow {
  return { ...funko, categoryName: category.name, seriesName: series.name };
}

export async function findRow(where: Prisma.FunkoWhereInput): Promise<FunkoRow | undefined> {
  const funko = await prisma.funko.findFirst({ where, select: FUNKO_SELECT, orderBy: { id: 'asc' } });

  return funko ? toRow(funko) : undefined;
}

export function groupByFunkoId<Row extends { funkoId: number }>(rows: Row[]): Map<number, Row[]> {
  const grouped = new Map<number, Row[]>();

  for (const row of rows) {
    const bucket = grouped.get(row.funkoId) ?? [];

    bucket.push(row);
    grouped.set(row.funkoId, bucket);
  }

  return grouped;
}

export const funkosRepository = {
  findById: (id: number): Promise<FunkoRow | undefined> => findRow({ id }),

  // Which of the user's own collections each funko is in; other users' collections never show.
  collectionsByFunkoIds: async (userId: number, funkoIds: number[]): Promise<Map<number, CollectionSummaryRow[]>> => {
    if (funkoIds.length === 0) return new Map();

    const items = await prisma.collectionItem.findMany({
      where: { funkoId: { in: funkoIds }, collection: { userId } },
      select: FUNKO_COLLECTION_SELECT,
      orderBy: { collection: { name: 'asc' } },
    });

    return groupByFunkoId(items.map(({ funkoId, collection }) => ({ funkoId, ...collection })));
  },

  // Every user with the funko in a collection, for the delete guard: a funko in anyone's collection is protected.
  // Only ids: who they are is never told, only how many.
  findHolderIds: (funkoId: number): Promise<number[]> => findHolderIdsIn(prisma, funkoId),

  // How many users have the funko in a collection, for an admin about to delete it.
  countHolders: (funkoId: number): Promise<number> => prisma.user.count({ where: holdsFunko(funkoId) }),
};
