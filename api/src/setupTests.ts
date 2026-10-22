// Runs before every test file. The app reads its config once, from process.env, so the test values go in first.
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.loadEnvFile('.env.test');

// One throwaway uploads folder per test file (Vitest workers run files in parallel). resetTestDb() empties it.
// This is the one write to process.env outside config/env.ts (node-ts-core §5): it has to land before env.ts
// parses, and no other channel reaches every worker.
process.env.UPLOADS_DIR = mkdtempSync(join(tmpdir(), 'funko-uploads-'));
