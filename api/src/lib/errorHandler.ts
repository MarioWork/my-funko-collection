import { hasZodFastifySchemaValidationErrors } from '@fastify/type-provider-zod';
import { DrizzleQueryError } from 'drizzle-orm';
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import {
  SQLITE_CONSTRAINT_CHECK,
  SQLITE_CONSTRAINT_FOREIGN_KEY,
  SQLITE_CONSTRAINT_NOT_NULL,
  SQLITE_CONSTRAINT_TRIGGER,
  SQLITE_CONSTRAINT_UNIQUE,
  getSqliteError,
} from '../db/errors.ts';
import { ConflictError, HttpError } from './httpErrors.ts';

// The one error envelope every route lists for its 4xx/5xx responses.
export const ErrorResponseSchema = z
  .object({
    code: z.string(),
    message: z.string(),
    issues: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
    // On a 409: the id of the record that already holds the conflicting value, when the service knows it.
    existingId: z.number().int().optional(),
  })
  .meta({ id: 'ErrorResponse' });

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

type MappedError = { statusCode: number; code: string; message: string };

const SQLITE_ERROR_MAP: Record<number, MappedError> = {
  [SQLITE_CONSTRAINT_UNIQUE]: {
    statusCode: 409,
    code: 'CONFLICT',
    message: 'A record with these values already exists',
  },
  [SQLITE_CONSTRAINT_FOREIGN_KEY]: {
    statusCode: 409,
    code: 'CONFLICT',
    message: 'A related record is missing or still referenced',
  },
  [SQLITE_CONSTRAINT_TRIGGER]: {
    statusCode: 409,
    code: 'CONFLICT',
    message: 'The record is still referenced by another one',
  },
  [SQLITE_CONSTRAINT_NOT_NULL]: { statusCode: 400, code: 'VALIDATION_ERROR', message: 'A required value is missing' },
  [SQLITE_CONSTRAINT_CHECK]: {
    statusCode: 400,
    code: 'VALIDATION_ERROR',
    message: 'A value is outside its allowed range',
  },
};

// @fastify/multipart's own limit errors keep a stable code of ours instead of the plugin's FST_* names.
const MULTIPART_ERROR_MAP: Record<string, MappedError> = {
  FST_REQ_FILE_TOO_LARGE: { statusCode: 413, code: 'PAYLOAD_TOO_LARGE', message: 'The file is too large' },
  FST_FILES_LIMIT: { statusCode: 413, code: 'PAYLOAD_TOO_LARGE', message: 'Too many files in one request' },
  FST_PARTS_LIMIT: { statusCode: 413, code: 'PAYLOAD_TOO_LARGE', message: 'Too many parts in one request' },
  FST_INVALID_MULTIPART_CONTENT_TYPE: {
    statusCode: 400,
    code: 'VALIDATION_ERROR',
    message: 'The request is not multipart/form-data',
  },
};

const INTERNAL_ERROR: ErrorResponse = { code: 'INTERNAL_ERROR', message: 'Something went wrong' };

function isClientError(error: FastifyError): boolean {
  return typeof error.statusCode === 'number' && error.statusCode >= 400 && error.statusCode < 500;
}

function toHttpErrorResponse(error: HttpError): ErrorResponse {
  const existingId = error instanceof ConflictError ? error.existingId : undefined;

  return { code: error.code, message: error.message, existingId };
}

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof HttpError) {
    return reply.code(error.statusCode).send(toHttpErrorResponse(error));
  }

  if (hasZodFastifySchemaValidationErrors(error)) {
    const issues = error.validation.map((issue) => ({
      path: issue.instancePath,
      message: issue.message ?? 'Invalid value',
    }));

    return reply.code(400).send({ code: 'VALIDATION_ERROR', message: 'Request validation failed', issues });
  }

  const multipartMapped = error.code ? MULTIPART_ERROR_MAP[error.code] : undefined;

  if (multipartMapped) {
    return reply
      .code(multipartMapped.statusCode)
      .send({ code: multipartMapped.code, message: multipartMapped.message });
  }

  const sqliteError = getSqliteError(error);
  const mapped = sqliteError?.rawCode === undefined ? undefined : SQLITE_ERROR_MAP[sqliteError.rawCode];

  if (mapped) {
    return reply.code(mapped.statusCode).send({ code: mapped.code, message: mapped.message });
  }

  // Fastify's own 4xx (body too large, rate limit, @fastify/sensible httpErrors) keep their status.
  if (isClientError(error)) {
    return reply.code(error.statusCode ?? 400).send({ code: error.code ?? 'REQUEST_ERROR', message: error.message });
  }

  // A query error's message carries the SQL *and its parameters*; log the cause and the SQL template only.
  if (error instanceof DrizzleQueryError) {
    request.log.error({ err: error.cause, sql: error.query }, 'query failed');
  } else {
    request.log.error({ err: error }, 'unhandled error');
  }

  return reply.code(500).send(INTERNAL_ERROR);
}

export function notFoundHandler(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(404).send({ code: 'NOT_FOUND', message: `Route ${request.method} ${request.url} not found` });
}
