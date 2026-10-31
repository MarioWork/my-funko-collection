import { containsText } from '../../lib/likePatterns.ts';
import type { Prisma } from '../../generated/prisma/client.ts';
import { toOrderDirection, toSkipTake } from '../../lib/pagination.ts';
import { deletedIdOrUndefined, ID_SELECT, prisma, reloadIfUpdated } from '../../lib/prisma.ts';
import type { TagSortField, CreateTag, ListTagsQuery, UpdateTag } from './tags.schema.ts';

// itemCount = how many collection items carry the tag; an unused tag still lists with 0.
const TAG_SELECT = {
  id: true,
  name: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { itemTags: true } },
} as const satisfies Prisma.TagSelect;

const SORT_FIELD_MAP: Record<TagSortField, keyof Prisma.TagOrderByWithRelationInput> = {
  NAME: 'name',
  CREATION_DATE: 'createdAt',
};

type SelectedTag = Prisma.TagGetPayload<{ select: typeof TAG_SELECT }>;

export type TagRow = Omit<SelectedTag, '_count'> & { itemCount: number };

function toRow({ _count, ...tag }: SelectedTag): TagRow {
  return { ...tag, itemCount: _count.itemTags };
}

function buildListFilter(userId: number, { name }: ListTagsQuery): Prisma.TagWhereInput {
  return name ? { userId, name: containsText(name) } : { userId };
}

// Every read and write names the user: another user's tag is simply not there.
async function findById(userId: number, id: number): Promise<TagRow | undefined> {
  const tag = await prisma.tag.findFirst({ where: { id, userId }, select: TAG_SELECT });

  return tag ? toRow(tag) : undefined;
}

export const tagsRepository = {
  findById,

  list: async (userId: number, query: ListTagsQuery) => {
    const where = buildListFilter(userId, query);
    const direction = toOrderDirection(query.direction);
    const sortField = SORT_FIELD_MAP[query.sorting_fields];

    const [rows, totalResultNumber] = await prisma.$transaction([
      prisma.tag.findMany({
        where,
        select: TAG_SELECT,
        orderBy: [{ [sortField]: direction }, { id: 'asc' }],
        ...toSkipTake(query),
      }),
      prisma.tag.count({ where }),
    ]);

    return { data: rows.map(toRow), totalResultNumber };
  },

  create: async (userId: number, data: CreateTag): Promise<TagRow> =>
    toRow(await prisma.tag.create({ data: { ...data, userId }, select: TAG_SELECT })),

  update: async (userId: number, id: number, data: UpdateTag): Promise<TagRow | undefined> => {
    const write = await prisma.tag.updateMany({ where: { id, userId }, data });

    return reloadIfUpdated(write, () => findById(userId, id));
  },

  delete: async (userId: number, id: number): Promise<{ id: number } | undefined> => {
    const write = await prisma.tag.deleteMany({ where: { id, userId } });

    return deletedIdOrUndefined(id, write);
  },

  // Which of these ids are the user's own tags.
  ownIds: async (userId: number, ids: number[]): Promise<Set<number>> => {
    const rows = await prisma.tag.findMany({ where: { userId, id: { in: ids } }, select: ID_SELECT });

    return new Set(rows.map((row) => row.id));
  },
};
