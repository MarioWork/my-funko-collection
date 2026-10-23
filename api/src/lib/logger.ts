import { pino } from 'pino';
import { env } from '../config/env.ts';

const REDACTED_PATHS = ['*.password', '*.token', '*.secret', 'req.headers.authorization', 'req.headers.cookie'];

// JSON lines everywhere. `yarn dev` pipes them through pino-pretty (options in .pino-prettyrc) for one readable,
// coloured line per entry; pino-pretty is a dev dependency, never loaded by the process itself.
export const logger = pino({
  level: env.LOG_LEVEL,
  redact: { paths: REDACTED_PATHS, censor: '[REDACTED]' },
});
