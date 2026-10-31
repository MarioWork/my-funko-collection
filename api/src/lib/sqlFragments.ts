// Building blocks for the raw SQL queries Prisma's query API cannot express (the funko list, the item list and the
// collection totals). Every value goes in as a `${parameter}`; only fixed keywords go through `Prisma.raw`.
import { Prisma } from '../generated/prisma/client.ts';
import type { SortDirection } from './pagination.ts';

const LEADING_DIGITS = '^[0-9]+';

// Funko numbers are text ("01", "1300", "SE"): sort by their leading digits as a number, so 2 comes before 10.
// A number with no leading digits ("SE") sorts as 0.
export function numberSortKey(column: Prisma.Sql): Prisma.Sql {
  return Prisma.sql`coalesce(substring(${column} from ${LEADING_DIGITS})::bigint, 0)`;
}

// Empty values first going up and last going down. Postgres's own default is the opposite.
const DIRECTION_MAP: Record<SortDirection, Prisma.Sql> = {
  ASC: Prisma.raw('asc nulls first'),
  DESC: Prisma.raw('desc nulls last'),
};

export function sortDirection(direction: SortDirection): Prisma.Sql {
  return DIRECTION_MAP[direction];
}

type Condition = Prisma.Sql | undefined;

function definedConditions(conditions: Condition[]): Prisma.Sql[] {
  return conditions.filter((condition) => condition !== undefined);
}

// Every condition holds; no conditions at all matches every row.
export function allOf(conditions: Condition[]): Prisma.Sql {
  const defined = definedConditions(conditions);

  if (defined.length === 0) return Prisma.sql`true`;

  return Prisma.sql`(${Prisma.join(defined, ' and ')})`;
}

// At least one condition holds.
export function anyOf(conditions: Condition[]): Prisma.Sql {
  const defined = definedConditions(conditions);

  if (defined.length === 0) return Prisma.sql`false`;

  return Prisma.sql`(${Prisma.join(defined, ' or ')})`;
}

export function inList(column: Prisma.Sql, values: number[]): Prisma.Sql {
  return Prisma.sql`${column} in (${Prisma.join(values)})`;
}
