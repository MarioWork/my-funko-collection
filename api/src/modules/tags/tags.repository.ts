import { and, asc, count, desc, eq, type SQL } from 'drizzle-orm';
import { db, type DbExecutor } from '../../db/client.ts';
import { likeContains } from '../../db/like.ts';
import { collectionItemTags } from '../../db/schema/collectionItemTags.ts';
import { tags, type TagSortField } from '../../db/schema/tags.ts';
import { toLimitOffset } from '../../lib/pagination.ts';
import type { CreateTag, ListTagsQuery, UpdateTag } from './tags.schema.ts';

const TAG_COLUMNS = {
  id: tags.id,
  name: tags.name,
  notes: tags.notes,
  createdAt: tags.createdAt,
  updatedAt: tags.updatedAt,
} as const;

const SORT_FIELD_MAP: Record<TagSortField, typeof tags.name | typeof tags.createdAt> = {
  NAME: tags.name,
  CREATION_DATE: tags.createdAt,
};

function buildListFilter({ name }: ListTagsQuery): SQL | undefined {
  const nameFilter = name ? likeContains(tags.name, name) : undefined;

  return and(nameFilter);
}

// itemCount = how many collection items carry the tag; a left join keeps unused tags in the list with 0.
function selectWithCount(executor: DbExecutor) {
  return executor
    .select({ ...TAG_COLUMNS, itemCount: count(collectionItemTags.collectionItemId) })
    .from(tags)
    .leftJoin(collectionItemTags, eq(collectionItemTags.tagId, tags.id))
    .groupBy(tags.id);
}

export const tagsRepository = {
  findById: (id: number, executor: DbExecutor = db): Promise<TagRow | undefined> =>
    selectWithCount(executor).where(eq(tags.id, id)).get(),

  list: async (query: ListTagsQuery) => {
    const filter = buildListFilter(query);
    const direction = query.direction === 'DESC' ? desc : asc;
    const sortColumn = SORT_FIELD_MAP[query.sorting_fields];
    const { limit, offset } = toLimitOffset(query);

    const [data, totalResultNumber] = await Promise.all([
      selectWithCount(db).where(filter).orderBy(direction(sortColumn), asc(tags.id)).limit(limit).offset(offset),
      db.$count(tags, filter),
    ]);

    return { data, totalResultNumber };
  },

  create: async (data: CreateTag, executor: DbExecutor = db): Promise<TagRow> => {
    const inserted = await executor.insert(tags).values(data).returning(TAG_COLUMNS).get();

    return { ...inserted, itemCount: 0 };
  },

  update: async (id: number, data: UpdateTag, executor: DbExecutor = db): Promise<TagRow | undefined> => {
    const updated = await executor.update(tags).set(data).where(eq(tags.id, id)).returning({ id: tags.id }).get();

    if (!updated) return undefined;

    return selectWithCount(executor).where(eq(tags.id, id)).get();
  },

  delete: (id: number, executor: DbExecutor = db): Promise<{ id: number } | undefined> =>
    executor.delete(tags).where(eq(tags.id, id)).returning({ id: tags.id }).get(),
};

export type TagRow = {
  id: number;
  name: string;
  notes: string | null;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
};
