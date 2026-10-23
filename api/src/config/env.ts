import { z } from 'zod';

const DEFAULT_UPLOADS_DIR = './data/uploads';
const DEFAULT_MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const DEFAULT_MAX_IMAGES_PER_FUNKO = 10;
const DEFAULT_IMAGE_LARGE_PX = 2000;
const DEFAULT_IMAGE_MEDIUM_PX = 1200;
const DEFAULT_IMAGE_SMALL_PX = 480;
const DEFAULT_APP_ORIGIN = 'http://localhost:5173';
const HTTPS_PROTOCOL = 'https:';

const booleanFromString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  PORT: z.coerce.number().int().min(0).max(65535).default(3000),
  // A libsql URL: `file:./data/app.db` for a local database, `:memory:` under test.
  DATABASE_URL: z.string().min(1),
  // Apply pending migrations before listening. On in the container, off in dev (where `yarn db:migrate` is explicit).
  MIGRATE_ON_START: booleanFromString,
  // How many reverse proxies sit in front of the API: 1 behind Caddy, 0 when it is reached directly. Fastify then
  // reads the client address from X-Forwarded-For, so rate limits count each device instead of the proxy.
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),
  // The one address the app is opened at (scheme + host + port). Passkeys are bound to its host name for good, and
  // writes are only accepted from this origin. https in production; http://localhost:5173 in dev.
  APP_ORIGIN: z.url().default(DEFAULT_APP_ORIGIN),
  // Comma-separated list of allowed browser origins; never `*`. Empty (the default) turns CORS off: the app is
  // same-origin in production (Caddy) and in dev (the Vite proxy), so only a separate client would need it.
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.url())),
  // Where uploaded images live. The Docker volume mounts over it.
  UPLOADS_DIR: z.string().min(1).default(DEFAULT_UPLOADS_DIR),
  MAX_IMAGE_BYTES: z.coerce.number().int().positive().default(DEFAULT_MAX_IMAGE_BYTES),
  MAX_IMAGES_PER_FUNKO: z.coerce.number().int().positive().default(DEFAULT_MAX_IMAGES_PER_FUNKO),
  // Longest side of each generated variant, in pixels.
  IMAGE_LARGE_PX: z.coerce.number().int().positive().default(DEFAULT_IMAGE_LARGE_PX),
  IMAGE_MEDIUM_PX: z.coerce.number().int().positive().default(DEFAULT_IMAGE_MEDIUM_PX),
  IMAGE_SMALL_PX: z.coerce.number().int().positive().default(DEFAULT_IMAGE_SMALL_PX),
});

export type Env = z.infer<typeof EnvSchema>;

// Passkeys and Secure cookies need https; only a local dev server may use plain http.
const EnvSchemaWithRules = EnvSchema.refine(
  (value) => value.NODE_ENV !== 'production' || new URL(value.APP_ORIGIN).protocol === HTTPS_PROTOCOL,
  { message: 'APP_ORIGIN must be https in production', path: ['APP_ORIGIN'] },
);

const parsed = EnvSchemaWithRules.safeParse(process.env);

if (!parsed.success) {
  // The logger depends on env, so this is the one place console is allowed.
  console.error('Invalid environment:\n' + z.prettifyError(parsed.error));
  process.exit(1);
}

export const env: Readonly<Env> = Object.freeze(parsed.data);
