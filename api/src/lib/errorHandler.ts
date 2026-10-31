import { hasZodFastifySchemaValidationErrors } from '@fastify/type-provider-zod';
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import {
  PG_CHECK_VIOLATION,
  PG_FOREIGN_KEY_VIOLATION,
  PG_NOT_NULL_VIOLATION,
  PG_RESTRICT_VIOLATION,
  PG_UNIQUE_VIOLATION,
  PRISMA_RECORD_NOT_FOUND,
  getErrorLogFields,
  getPrismaErrorCode,
  getSqlState,
} from './databaseErrors.ts';
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

const SQL_STATE_ERROR_MAP: Record<string, MappedError> = {
  [PG_UNIQUE_VIOLATION]: {
    statusCode: 409,
    code: 'CONFLICT',
    message: 'A record with these values already exists',
  },
  [PG_FOREIGN_KEY_VIOLATION]: {
    statusCode: 409,
    code: 'CONFLICT',
    message: 'A related record is missing or still referenced',
  },
  [PG_RESTRICT_VIOLATION]: {
    statusCode: 409,
    code: 'CONFLICT',
    message: 'The record is still referenced by another one',
  },
  [PG_NOT_NULL_VIOLATION]: { statusCode: 400, code: 'VALIDATION_ERROR', message: 'A required value is missing' },
  [PG_CHECK_VIOLATION]: {
    statusCode: 400,
    code: 'VALIDATION_ERROR',
    message: 'A value is outside its allowed range',
  },
};

const PRISMA_ERROR_MAP: Record<string, MappedError> = {
  [PRISMA_RECORD_NOT_FOUND]: { statusCode: 404, code: 'NOT_FOUND', message: 'Record not found' },
};

function toDatabaseMappedError(error: unknown): MappedError | undefined {
  const sqlState = getSqlState(error);
  const prismaCode = getPrismaErrorCode(error);

  if (sqlState && SQL_STATE_ERROR_MAP[sqlState]) return SQL_STATE_ERROR_MAP[sqlState];

  return prismaCode ? PRISMA_ERROR_MAP[prismaCode] : undefined;
}

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

  const mapped = toDatabaseMappedError(error);

  if (mapped) {
    return reply.code(mapped.statusCode).send({ code: mapped.code, message: mapped.message });
  }

  // Fastify's own 4xx (body too large, rate limit, @fastify/sensible httpErrors) keep their status.
  if (isClientError(error)) {
    return reply.code(error.statusCode ?? 400).send({ code: error.code ?? 'REQUEST_ERROR', message: error.message });
  }

  request.log.error(getErrorLogFields(error), 'unhandled error');

  return reply.code(500).send(INTERNAL_ERROR);
}

export function notFoundHandler(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(404).send({ code: 'NOT_FOUND', message: `Route ${request.method} ${request.url} not found` });
}
