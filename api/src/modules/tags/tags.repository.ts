import { containsText } from '../../lib/likePatterns.ts';
import type { Prisma } from '../../generated/prisma/client.ts';
import { toOrderDirection, toSkipTake } from '../../lib/pagination.ts';
import { deletedIdOrUndefined, prisma, reloadIfUpdated } from '../../lib/prisma.ts';
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

function buildListFilter({ name }: ListTagsQuery): Prisma.TagWhereInput {
  return name ? { name: containsText(name) } : {};
}

async function findById(id: number): Promise<TagRow | undefined> {
  const tag = await prisma.tag.findUnique({ where: { id }, select: TAG_SELECT });

  return tag ? toRow(tag) : undefined;
}

export const tagsRepository = {
  findById,

  list: async (query: ListTagsQuery) => {
    const where = buildListFilter(query);
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

  create: async (data: CreateTag): Promise<TagRow> => toRow(await prisma.tag.create({ data, select: TAG_SELECT })),

  update: async (id: number, data: UpdateTag): Promise<TagRow | undefined> => {
    const write = await prisma.tag.updateMany({ where: { id }, data });

    return reloadIfUpdated(write, () => findById(id));
  },

  delete: async (id: number): Promise<{ id: number } | undefined> => {
    const write = await prisma.tag.deleteMany({ where: { id } });

    return deletedIdOrUndefined(id, write);
  },
};
