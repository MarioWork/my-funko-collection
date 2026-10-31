import { clearUploads } from './lib/imageStorage.ts';
import { env } from './config/env.ts';
import { prisma } from './lib/prisma.ts';
import { TEMPLATE_DATABASE, TEST_DATABASE_PREFIX, databaseName } from './testDatabases.ts';

const MIGRATION_LOG_TABLE = '_prisma_migrations';

type TableNameRow = { tablename: string };

// Every table of the schema but Prisma's own migration log, read from Postgres so a new model is never missed.
async function appTables(): Promise<string[]> {
  const rows = await prisma.$queryRaw<TableNameRow[]>`
    select tablename from pg_tables where schemaname = current_schema() and tablename <> ${MIGRATION_LOG_TABLE}`;

  return rows.map((row) => `"${row.tablename}"`);
}

// Refuses to touch anything but this test file's own database (see setupTests.ts).
function assertTestDatabase(): void {
  const name = databaseName(env.DATABASE_URL);
  const isTestCopy = name.startsWith(TEST_DATABASE_PREFIX) && name !== TEMPLATE_DATABASE;

  if (!isTestCopy) throw new Error(`Test database helpers only run on a ${TEST_DATABASE_PREFIX}* copy, got ${name}`);
}

// Empties every table and this test file's uploads folder. Ids keep counting up, as they would in production.
export async function resetTestDb(): Promise<void> {
  assertTestDatabase();
  const tables = await appTables();

  // Table names come from pg_tables, quoted; no request data reaches this statement. CASCADE takes care of the order.
  await prisma.$executeRawUnsafe(`truncate table ${tables.join(', ')} cascade`);
  await clearUploads();
}
