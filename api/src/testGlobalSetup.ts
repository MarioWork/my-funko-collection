// Runs once per `vitest run`, before any worker starts: one freshly migrated template database for the run.
import { execFileSync } from 'node:child_process';
import {
  TEMPLATE_DATABASE,
  assertServerReachable,
  createDatabase,
  dropTestDatabases,
  withDatabase,
} from './testDatabases.ts';

const PRISMA_BIN = 'node_modules/.bin/prisma';

export async function setup(): Promise<void> {
  process.loadEnvFile('.env.test');

  const { env } = await import('./config/env.ts');

  await assertServerReachable(env.DATABASE_URL);
  await dropTestDatabases(env.DATABASE_URL);
  await createDatabase(env.DATABASE_URL, TEMPLATE_DATABASE);

  // The same `migrate deploy` the container runs, so the tests see exactly the production schema. The child
  // inherits this process's environment, so the template's URL goes in first: the one write to process.env here,
  // after env.ts has parsed (setupTests.ts sets each worker's own URL again).
  process.env.DATABASE_URL = withDatabase(env.DATABASE_URL, TEMPLATE_DATABASE);
  execFileSync(PRISMA_BIN, ['migrate', 'deploy'], { stdio: 'ignore' });
}

export async function teardown(): Promise<void> {
  const { env } = await import('./config/env.ts');

  await dropTestDatabases(env.DATABASE_URL);
}
