import { rm } from 'node:fs/promises';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { env } from '../config/env.ts';
import { forgetStoredFiles } from '../lib/imageStorage.ts';
import { applyPragmas, client, db } from './client.ts';
import {
  categories,
  collectionItems,
  collectionItemTags,
  collections,
  funkoImages,
  funkos,
  series,
  tags,
} from './schema/index.ts';

const MIGRATIONS_FOLDER = './drizzle';
const IN_MEMORY_URL = ':memory:';

// Both helpers refuse to touch anything but the in-memory database .env.test points at.
function assertInMemory(): void {
  if (env.DATABASE_URL !== IN_MEMORY_URL) {
    throw new Error(`Test database helpers only run against ${IN_MEMORY_URL}, got ${env.DATABASE_URL}`);
  }
}

// Each Vitest worker imports its own `db`, so this is one fresh in-memory database per test file.
export async function prepareTestDb(): Promise<void> {
  assertInMemory();
  await applyPragmas(client);
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
}

// One line per table, children first; the uploads folder of this test file goes with them.
export async function resetTestDb(): Promise<void> {
  assertInMemory();
  await db.delete(collectionItemTags);
  await db.delete(collectionItems);
  await db.delete(funkoImages);
  await db.delete(funkos);
  await db.delete(series);
  await db.delete(collections);
  await db.delete(tags);
  await db.delete(categories);
  await rm(env.UPLOADS_DIR, { recursive: true, force: true });
  forgetStoredFiles();
}
