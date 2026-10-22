// The only entry point: build, listen, shut down. Nothing else has side effects at import time.
import { buildApp } from './app.ts';
import { env } from './config/env.ts';
import { runMigrations } from './db/migrate.ts';
import { logger } from './lib/logger.ts';

const SHUTDOWN_TIMEOUT_MS = 10_000;
const LISTEN_HOST = '0.0.0.0';

process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'unhandled rejection');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'uncaught exception');
  process.exit(1);
});

const app = await buildApp();

if (env.MIGRATE_ON_START) await runMigrations();

await app.listen({ port: env.PORT, host: LISTEN_HOST });

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  logger.info({ signal }, 'shutting down');

  // Stop taking requests, finish in-flight ones, close the database; force exit if that hangs.
  const forceExit = setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  await app.close();
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
