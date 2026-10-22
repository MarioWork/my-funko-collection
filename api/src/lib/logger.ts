import { pino } from 'pino';
import { env } from '../config/env.ts';

const REDACTED_PATHS = ['*.password', '*.token', '*.secret', 'req.headers.authorization', 'req.headers.cookie'];

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: { paths: REDACTED_PATHS, censor: '[REDACTED]' },
});
