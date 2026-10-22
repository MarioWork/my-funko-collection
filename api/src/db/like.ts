import { sql, type SQL, type SQLWrapper } from 'drizzle-orm';

const LIKE_ESCAPE = '\\';
const LIKE_SPECIALS = /[\\%_]/g;

// A LIKE pattern where the user's text is literal: `%` and `_` typed by the user match themselves, not anything.
export function containsPattern(text: string): string {
  return `%${text.replace(LIKE_SPECIALS, (character) => `${LIKE_ESCAPE}${character}`)}%`;
}

// `column LIKE '%text%' ESCAPE '\'`. SQLite's LIKE is case-insensitive for ASCII.
export function likeContains(column: SQLWrapper, text: string): SQL {
  return sql`${column} like ${containsPattern(text)} escape ${LIKE_ESCAPE}`;
}
