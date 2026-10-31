import { Prisma } from '../generated/prisma/client.ts';

const LIKE_ESCAPE = '\\';
const LIKE_SPECIALS = /[\\%_]/g;

type ContainsFilter = { contains: string; mode: 'insensitive' };

// The user's text with `%`, `_` and `\` escaped, so they match themselves. Prisma's `contains` passes them through
// to LIKE as wildcards (verified on Prisma 7.10), and backslash is Postgres's default LIKE escape.
export function escapeLike(text: string): string {
  return text.replace(LIKE_SPECIALS, (character) => `${LIKE_ESCAPE}${character}`);
}

// A Prisma filter: the field contains the text, ignoring case (ILIKE).
export function containsText(text: string): ContainsFilter {
  return { contains: escapeLike(text), mode: 'insensitive' };
}

// The same match for a raw query: `column ILIKE '%text%'`.
export function ilikeContains(column: Prisma.Sql, text: string): Prisma.Sql {
  return Prisma.sql`${column} ilike ${`%${escapeLike(text)}%`}`;
}
