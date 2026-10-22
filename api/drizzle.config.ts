import { defineConfig } from 'drizzle-kit';

// drizzle-kit does NOT load .env. Node's own loader does, with no dotenv dependency.
try {
  process.loadEnvFile('.env');
} catch {
  // CI injects env directly; there is no file there
}

const url = process.env.DATABASE_URL;

if (!url) throw new Error('DATABASE_URL is not set');

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  casing: 'snake_case',
  strict: true,
  verbose: true,
  dbCredentials: { url },
});
