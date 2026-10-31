import { defineConfig, env } from 'prisma/config';

// The Prisma CLI does not load .env. Node's own loader does, with no dotenv dependency.
try {
  process.loadEnvFile('.env');
} catch {
  // CI and the container inject env directly; there is no file there
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations', seed: 'node prisma/seed.ts' },
  datasource: { url: env('DATABASE_URL') },
});
