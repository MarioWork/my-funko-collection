import { migrate } from 'drizzle-orm/libsql/migrator';
import { logger } from '../lib/logger.ts';
import { db } from './client.ts';

const MIGRATIONS_FOLDER = './drizzle';

const log = logger.child({ module: 'migrate' });

// Applies every pending migration from the committed folder. Single-instance app, so running it at boot is safe.
export async function runMigrations(): Promise<void> {
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  log.info('database migrations applied');
}
