import { migrate } from 'drizzle-orm/libsql/migrator';
import { logger } from '../lib/logger.ts';
import { db } from './client.ts';

const MIGRATIONS_FOLDER = './drizzle';

// Applies every pending migration from the committed folder. Single-instance app, so running it at boot is safe.
export async function runMigrations(): Promise<void> {
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  logger.info('database migrations applied');
}
