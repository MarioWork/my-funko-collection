import { DrizzleQueryError } from 'drizzle-orm';

// SQLite extended result codes. libsql reports the generic `SQLITE_CONSTRAINT` in `code`; the specific
// violation is the extended code in `rawCode` (verified: a duplicate on a unique index gives 2067).
export const SQLITE_CONSTRAINT_UNIQUE = 2067;
export const SQLITE_CONSTRAINT_FOREIGN_KEY = 787;
// A delete blocked by `onDelete: 'restrict'` surfaces as a trigger constraint (verified: rawCode 1811), not 787.
export const SQLITE_CONSTRAINT_TRIGGER = 1811;
export const SQLITE_CONSTRAINT_NOT_NULL = 1299;
export const SQLITE_CONSTRAINT_CHECK = 275;

type SqliteError = { code: string; rawCode?: number; message: string };

type SqliteErrorLike = { code?: unknown; rawCode?: unknown; message?: unknown };

// Drizzle wraps every driver error in DrizzleQueryError; the libsql error is its `cause`.
export function getSqliteError(error: unknown): SqliteError | undefined {
  const cause = error instanceof DrizzleQueryError ? error.cause : error;
  const candidate = cause as SqliteErrorLike | undefined;

  if (typeof candidate?.code !== 'string') return undefined;

  return {
    code: candidate.code,
    rawCode: typeof candidate.rawCode === 'number' ? candidate.rawCode : undefined,
    message: typeof candidate.message === 'string' ? candidate.message : '',
  };
}
