// The throwaway databases the tests run on: one migrated template per run, one copy of it per test file.
import pg from 'pg';
import { AppError } from './lib/errors.ts';

export const TEST_DATABASE_PREFIX = 'funko_test_';
export const TEMPLATE_DATABASE = `${TEST_DATABASE_PREFIX}template`;
// Every server has this one; CREATE and DROP DATABASE are run from it.
const MAINTENANCE_DATABASE = 'postgres';

export function withDatabase(url: string, database: string): string {
  const withName = new URL(url);

  withName.pathname = `/${database}`;

  return withName.toString();
}

export function databaseName(url: string): string {
  return new URL(url).pathname.slice(1);
}

// Database names cannot be bound as parameters, so only names this file made are ever put into SQL.
function quoteName(name: string): string {
  if (!name.startsWith(TEST_DATABASE_PREFIX)) throw new Error(`Not a test database: ${name}`);

  return `"${name.replaceAll('"', '""')}"`;
}

async function onMaintenance<Result>(serverUrl: string, run: (client: pg.Client) => Promise<Result>): Promise<Result> {
  const client = new pg.Client({ connectionString: withDatabase(serverUrl, MAINTENANCE_DATABASE) });

  await client.connect();

  try {
    return await run(client);
  } finally {
    await client.end();
  }
}

const CONNECTION_REFUSED = 'ECONNREFUSED';

type ErrorWithCode = { code?: unknown };

// A refused connection almost always means the local Postgres is not started: say how to start it.
export async function assertServerReachable(serverUrl: string): Promise<void> {
  try {
    await onMaintenance(serverUrl, (client) => client.query('select 1'));
  } catch (error: unknown) {
    const isRefused = (error as ErrorWithCode | undefined)?.code === CONNECTION_REFUSED;

    if (!isRefused) throw error;

    throw new AppError('Postgres is not running on localhost:5432. Start it first (README, "Run it locally")', {
      code: 'POSTGRES_NOT_RUNNING',
      cause: error,
    });
  }
}

export async function createDatabase(serverUrl: string, name: string, template?: string): Promise<void> {
  const fromTemplate = template ? ` template ${quoteName(template)}` : '';

  await onMaintenance(serverUrl, (client) => client.query(`create database ${quoteName(name)}${fromTemplate}`));
}

// Every test database on the server, the template included: leftovers of a crashed run go too.
export async function dropTestDatabases(serverUrl: string): Promise<void> {
  await onMaintenance(serverUrl, async (client) => {
    const { rows } = await client.query<{ datname: string }>(
      'select datname from pg_database where starts_with(datname, $1)',
      [TEST_DATABASE_PREFIX],
    );

    for (const { datname } of rows) {
      await client.query(`drop database if exists ${quoteName(datname)} with (force)`);
    }
  });
}
