import { pino, type TransportSingleOptions } from 'pino';
import { env } from '../config/env.ts';

const REDACTED_PATHS = ['*.password', '*.token', '*.secret', 'req.headers.authorization', 'req.headers.cookie'];

// Dev only: one coloured line per entry ("12:04:31 INFO [db] Query: ..."). pino-pretty is a dev dependency and
// production keeps plain JSON lines for `docker compose logs`.
const PRETTY_TRANSPORT: TransportSingleOptions = {
  target: 'pino-pretty',
  options: {
    colorize: true,
    translateTime: 'SYS:HH:MM:ss',
    ignore: 'pid,hostname,module,reqId,statusCode,durationMs',
    messageFormat: '{if module}[{module}] {end}{msg}',
    singleLine: true,
  },
};

const isPretty = env.NODE_ENV === 'development';

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: { paths: REDACTED_PATHS, censor: '[REDACTED]' },
  transport: isPretty ? PRETTY_TRANSPORT : undefined,
});
