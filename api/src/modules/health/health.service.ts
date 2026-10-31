import { getErrorLogFields } from '../../lib/databaseErrors.ts';
import { ServiceUnavailableError } from '../../lib/httpErrors.ts';
import { logger } from '../../lib/logger.ts';
import { healthRepository } from './health.repository.ts';
import type { HealthResponse } from './health.schema.ts';

const OK_STATUS = 'ok' as const;

const log = logger.child({ module: 'health' });

// Liveness: the process answers. Nothing to check.
export function getLiveness(): HealthResponse {
  return { status: OK_STATUS };
}

// Readiness: the database answers too. A failure is a 503 NOT_READY, with the database error kept as its cause.
export async function getReadiness(): Promise<HealthResponse> {
  try {
    await healthRepository.ping();
  } catch (error: unknown) {
    // The error handler does not log a 4xx/503 it maps itself, so the cause is logged here.
    log.error(getErrorLogFields(error), 'readiness check failed: database not reachable');

    throw new ServiceUnavailableError('Database is not reachable', { code: 'NOT_READY', cause: error });
  }

  return getLiveness();
}
