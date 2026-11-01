import { Prisma } from '../generated/prisma/client.ts';

// Postgres SQLSTATE codes (https://www.postgresql.org/docs/current/errcodes-appendix.html). Prisma's own codes are
// not enough: a failed check constraint is P2039 and anything from a raw query is P2010, but the driver's original
// SQLSTATE is always in `meta.driverAdapterError.cause.originalCode` (verified on Prisma 7.10 + adapter-pg).
export const PG_UNIQUE_VIOLATION = '23505';
export const PG_FOREIGN_KEY_VIOLATION = '23503';
// A delete blocked by `onDelete: Restrict`.
export const PG_RESTRICT_VIOLATION = '23001';
export const PG_NOT_NULL_VIOLATION = '23502';
export const PG_CHECK_VIOLATION = '23514';

// Prisma's "the row to update or delete was not found".
export const PRISMA_RECORD_NOT_FOUND = 'P2025';

type DriverAdapterMeta = { driverAdapterError?: { cause?: { originalCode?: unknown } } };

export function getSqlState(error: unknown): string | undefined {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return undefined;

  const originalCode = (error.meta as DriverAdapterMeta | undefined)?.driverAdapterError?.cause?.originalCode;

  return typeof originalCode === 'string' ? originalCode : undefined;
}

// A write a unique index refused: a service that knows which rule it broke answers in its own words.
export function isUniqueViolation(error: unknown): boolean {
  return getSqlState(error) === PG_UNIQUE_VIOLATION;
}

export function getPrismaErrorCode(error: unknown): string | undefined {
  return error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined;
}

type ErrorLogFields = { err: unknown };

type DatabaseErrorSummary = { name: string; code: string; sqlState: string | undefined; model: unknown };

// A Prisma error's message and `meta` can carry the values of the row ("Failing row contains ..."): log the codes
// and the model only, never the data.
export function getErrorLogFields(error: unknown): ErrorLogFields {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return { err: error };

  const summary: DatabaseErrorSummary = {
    name: error.name,
    code: error.code,
    sqlState: getSqlState(error),
    model: error.meta?.modelName,
  };

  return { err: summary };
}
