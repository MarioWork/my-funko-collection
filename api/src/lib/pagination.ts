import { z } from 'zod';

// The wire contract the React client (ts-api-services) speaks: page/size/sorting_fields/direction in,
// { data, totalResultNumber, currentPage } out.
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;
export const SORT_DIRECTIONS = ['ASC', 'DESC'] as const;

export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  size: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  direction: z.enum(SORT_DIRECTIONS).default('ASC'),
});

// The wire's ASC/DESC as Prisma's `orderBy` spells it.
const ORDER_DIRECTION_MAP = { ASC: 'asc', DESC: 'desc' } as const satisfies Record<SortDirection, string>;

export function toOrderDirection(direction: SortDirection): (typeof ORDER_DIRECTION_MAP)[SortDirection] {
  return ORDER_DIRECTION_MAP[direction];
}

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export function paginatedResponseSchema<Item extends z.ZodType>(itemSchema: Item) {
  return z.object({
    data: z.array(itemSchema),
    totalResultNumber: z.number().int(),
    currentPage: z.number().int(),
  });
}

export function toSkipTake({ page, size }: Pick<PaginationQuery, 'page' | 'size'>) {
  return { skip: (page - 1) * size, take: size };
}
