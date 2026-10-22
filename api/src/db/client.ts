import { createClient, type Client } from '@libsql/client';
import { DefaultLogger, sql, type LogWriter } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { env } from '../config/env.ts';
import { logger } from '../lib/logger.ts';
import * as relations from './relations.ts';
import * as tables from './schema/index.ts';

export const schema = { ...tables, ...relations };

const log = logger.child({ module: 'db' });

const queryLogWriter: LogWriter = {
  write: (message) => log.debug(message),
};

// Query logging prints parameters, so it is a development-only convenience.
const isQueryLogEnabled = env.NODE_ENV === 'development';

// One connection for the process. `file:` for a database on disk, `:memory:` under test.
export const client: Client = createClient({ url: env.DATABASE_URL });

// SQLite enforces foreign keys per connection, and only when asked. WAL lets readers run beside a writer.
export async function applyPragmas(connection: Client): Promise<void> {
  await connection.execute('PRAGMA foreign_keys = ON');
  await connection.execute('PRAGMA journal_mode = WAL');
}

export const db = drizzle({
  client,
  schema,
  casing: 'snake_case',
  logger: isQueryLogEnabled ? new DefaultLogger({ writer: queryLogWriter }) : false,
});

// The readiness probe's one query, so no route or service needs drizzle-orm for it.
export async function pingDb(): Promise<void> {
  await db.run(sql`select 1`);
}

export type Database = typeof db;
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];
export type DbExecutor = Database | Transaction;
