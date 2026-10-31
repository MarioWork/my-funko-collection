// Runs before every test file. The app reads its config once, from process.env, so the test values go in first.
import { randomBytes } from 'node:crypto';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseEnv } from 'node:util';
import { TEMPLATE_DATABASE, TEST_DATABASE_PREFIX, createDatabase, withDatabase } from './testDatabases.ts';

const TEST_ENV_FILE = '.env.test';
const DATABASE_SUFFIX_BYTES = 6;

process.loadEnvFile(TEST_ENV_FILE);

// The server's address, read from the file itself: env.ts has not run yet, and nothing but env.ts reads process.env.
const serverUrl = parseEnv(readFileSync(TEST_ENV_FILE, 'utf8')).DATABASE_URL ?? '';
const database = `${TEST_DATABASE_PREFIX}${randomBytes(DATABASE_SUFFIX_BYTES).toString('hex')}`;

await createDatabase(serverUrl, database, TEMPLATE_DATABASE);

// Vitest workers run files in parallel, so each file gets its own database (a copy of the template
// testGlobalSetup.ts migrated) and its own uploads folder. resetTestDb() empties both between tests.
// These are the only writes to process.env outside config/env.ts (node-ts-core §5): they have to land before
// env.ts parses, and no other channel reaches every worker.
process.env.DATABASE_URL = withDatabase(serverUrl, database);
process.env.UPLOADS_DIR = mkdtempSync(join(tmpdir(), 'funko-uploads-'));
