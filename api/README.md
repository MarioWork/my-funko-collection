# My Funko Collection — API

Fastify 5 + zod 4 + Drizzle on SQLite, Node 24, TypeScript. Stores the catalog, the collections and their items,
the tags, and the uploaded photos (three WebP sizes each). Built from `node-fastify-template`.

## Run

```bash
corepack enable          # once per machine
yarn install
cp .env.example .env     # defaults are fine for local work
yarn db:migrate          # creates ./data/app.db
yarn db:seed             # optional: example data with placeholder images
yarn dev                 # http://localhost:3000, OpenAPI UI at /docs
```

`yarn typecheck && yarn lint && yarn test` is the definition of green.

## Scripts

| Script              | Does                                                                       |
| ------------------- | -------------------------------------------------------------------------- |
| `yarn dev`          | Runs `src/server.ts` with `--watch` and `.env`                             |
| `yarn build`        | Compiles to `dist/` (`tsconfig.build.json`)                                |
| `yarn start`        | Runs `dist/server.js`                                                      |
| `yarn typecheck`    | `tsc --noEmit`                                                             |
| `yarn lint`         | ESLint + Prettier check                                                    |
| `yarn test`         | Vitest: in-memory SQLite and a temp uploads folder per test file           |
| `yarn db:generate`  | New migration after a schema change: `--name=<change>` (commit `drizzle/`) |
| `yarn db:migrate`   | Applies pending migrations                                                 |
| `yarn db:seed`      | Example categories, series, funkos, collections, items, tags, images       |
| `yarn db:studio`    | Drizzle Studio                                                             |
| `yarn images:prune` | Deletes image files no row references                                      |
| `yarn auth:reset`   | Locked out: removes every passkey and sign-in, prints a new setup link     |

## Environment

Read once in `src/config/env.ts` (zod); the process exits on an invalid value. Only that file touches `process.env`.

| Variable               | Default                 | Meaning                                                                                   |
| ---------------------- | ----------------------- | ----------------------------------------------------------------------------------------- |
| `NODE_ENV`             | `development`           | `development`, `test` or `production`                                                     |
| `LOG_LEVEL`            | `info`                  | pino level                                                                                |
| `PORT`                 | `3000`                  |                                                                                           |
| `DATABASE_URL`         | (required)              | libsql URL: `file:./data/app.db`, `:memory:` under test                                   |
| `MIGRATE_ON_START`     | `false`                 | Apply migrations before listening (on in the container)                                   |
| `APP_ORIGIN`           | `http://localhost:5173` | The address the app is opened at; https in production. Passkeys are tied to its host name |
| `TRUST_PROXY_HOPS`     | `0`                     | Proxies in front (1 behind Caddy), for the real client IP                                 |
| `CORS_ORIGINS`         | (none)                  | Browser origins, comma-separated, never `*`; empty = off                                  |
| `UPLOADS_DIR`          | `./data/uploads`        | Where image files live (the Docker volume mounts over it)                                 |
| `MAX_IMAGE_BYTES`      | `10485760`              | Per uploaded file                                                                         |
| `MAX_IMAGES_PER_FUNKO` | `10`                    |                                                                                           |
| `IMAGE_LARGE_PX`       | `2000`                  | Longest side of the `lg` variant                                                          |
| `IMAGE_MEDIUM_PX`      | `1200`                  | `md` variant                                                                              |
| `IMAGE_SMALL_PX`       | `480`                   | `sm` variant (grid thumbnails; kept this large on purpose)                                |

## Data model

| Table                  | What                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------- |
| `categories`           | A Funko line as printed on the box: "Pop! Marvel", "Star Wars"                     |
| `series`               | The show, film or game a figure comes from: "Daredevil: Born Again"                |
| `funkos`               | One figure: name, number, type, category, series?, chase / exclusive, barcode      |
| `funko_images`         | A photo of a funko: position, size, three WebP variants + blur placeholder         |
| `collections`          | One of the user's own lists: "Owned" (exactly one is the default), "Wishlist"      |
| `collection_items`     | One funko in one collection: quantity, condition, price, currency, date, notes     |
| `collection_item_tags` | Item ↔ tag                                                                         |
| `tags`                 | A free label on an item, mainly the storage box ("Box 3")                          |
| `users`                | The one person who signs in: name and WebAuthn user handle                         |
| `passkeys`             | A passkey's public key, counter and name (the private key never leaves the device) |
| `sessions`             | A signed-in browser: SHA-256 of the cookie token, sign-in and last-seen times      |
| `auth_challenges`      | One-use, 5-minute challenges for passkey ceremonies                                |
| `setup_codes`          | SHA-256 of the first-run code, only until someone sets the app up                  |

Value sets: funko `type` is one of `POP`, `POP_DELUXE`, `POP_RIDES`, `POP_MOMENT`, `POP_TOWN`, `POP_ALBUM`,
`POP_JUMBO`, `POP_KEYCHAIN`, `SODA`, `BITTY_POP`, `MYSTERY_MINI`, `OTHER`; item `condition` is `MINT_IN_BOX`,
`BOX_DAMAGED`, `OUT_OF_BOX` or null.

Barcodes are stored and looked up in the 13-digit EAN form: a 12-digit UPC-A gets a leading zero
(`src/lib/barcode.ts`), so a scanned code matches a typed one.

## Sign-in

Passkeys only, for one person (the research behind it: `docs/login-security-research.md`). Every route needs a
session except `/health`, `/ready`, `GET /auth/status` and the four setup / login ceremony routes, which say so with
`config: { isPublic: true }`; the image files under `/uploads` need one too. `src/plugins/auth.plugin.ts` holds the
check, locked by default, and `auth.route.test.ts` calls every route in the OpenAPI document without a cookie.

- **First run.** While nobody has set the app up, each start prints a one-time link (`<APP_ORIGIN>/setup?code=...`)
  on stdout as plain text, kept out of the structured log. The code makes the first passkey; it is stored only as a SHA-256 and dies once used.
- **Session.** A random 256-bit token in an `HttpOnly`, `SameSite=Strict`, `Path=/` cookie (`__Host-session` over
  https, `session` on the plain-http dev server); the database keeps its SHA-256. It lasts 30 days from the sign-in,
  ends after 7 days unused, and a new one replaces the browser's old one at every sign-in.
- **Passkeys.** `@simplewebauthn/server`: discoverable, user verification required, no attestation (any passkey
  manager works, Bitwarden included). Adding or removing one needs a sign-in from the last 10 minutes; the last one can't go, and
  removing one ends every session it opened.
- **Cross-site writes.** Any non-GET request whose `Sec-Fetch-Site` is not `same-origin`/`none`, or whose `Origin`
  is not `APP_ORIGIN`, answers 403 `CROSS_SITE_REQUEST`.
- **Limits.** The ceremony routes allow 10 requests a minute per address (5 attempts). There is no lockout someone
  else could trigger: a passkey can't be guessed.
- **Locked out.** `docker compose exec api node dist/cli/resetAuth.js` removes every passkey and session and prints a new setup
  link (`yarn auth:reset` in dev). The collection is not touched.

API answers carry `Cache-Control: no-store`; image files `private, max-age=31536000, immutable`.

## Endpoints

Interactive docs with every schema: `GET /docs` (dev only). Auth: `GET /auth/status`, `POST /auth/setup/{options,verify}`,
`POST /auth/login/{options,verify}`, `POST /auth/logout`, `POST /auth/logout-everywhere`, `GET|POST /auth/passkeys`
(`/options`, `/verify`), `DELETE /auth/passkeys/:passkeyId`. Every list endpoint takes `page` (1-based), `size`
(max 100), `sorting_fields` and `direction` (`ASC` | `DESC`) and answers `{ data, totalResultNumber, currentPage }`.
Text filters are case-insensitive "contains"; id filters take a comma-separated list.

| Method and path                            | What                                                                                                                                                       |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /health`, `GET /ready`                | Liveness, readiness (database reachable)                                                                                                                   |
| `GET /categories`                          | List; `name`; sort `NAME` \| `CREATION_DATE`                                                                                                               |
| `GET /categories/:id`                      |                                                                                                                                                            |
| `POST /categories`                         | `{ name }`                                                                                                                                                 |
| `PATCH /categories/:id`                    |                                                                                                                                                            |
| `DELETE /categories/:id`                   | 409 while funkos still use it                                                                                                                              |
| `GET /series`                              | List with funko counts; `name`; sort `NAME` \| `CREATION_DATE`                                                                                             |
| `GET /series/:id`                          |                                                                                                                                                            |
| `POST /series`                             | `{ name }`; 409 when the name is taken                                                                                                                     |
| `PATCH /series/:id`                        |                                                                                                                                                            |
| `DELETE /series/:id`                       | Its funkos stay, with `series: null`                                                                                                                       |
| `GET /funkos`                              | List and search: `q` searches every field; named params narrow one (below)                                                                                 |
| `GET /funkos/by-barcode/:barcode`          | For a phone scanner                                                                                                                                        |
| `GET /funkos/:id`                          | With all its images                                                                                                                                        |
| `POST /funkos`                             | 409 with `existingId` when the same funko or barcode already exists                                                                                        |
| `PATCH /funkos/:id`                        |                                                                                                                                                            |
| `DELETE /funkos/:id`                       | 409 while it sits in a collection; `?force=true` removes it from all                                                                                       |
| `POST /funkos/:id/images`                  | Multipart, field `file` (several allowed); makes the three variants                                                                                        |
| `POST /funkos/:id/images/from-url`         | `{ url }`: downloads a public image and stores it                                                                                                          |
| `PATCH /funkos/:id/images/order`           | `{ imageIds }`: the first one is the primary                                                                                                               |
| `POST /funkos/:id/images/:imageId/rotate`  | `{ degrees: 90 \| 180 \| 270 }` clockwise; the image gets new URLs                                                                                         |
| `DELETE /funkos/:id/images/:imageId`       |                                                                                                                                                            |
| `GET /collections`                         | List with counts and money spent; sort `NAME` \| `CREATION_DATE`                                                                                           |
| `GET /collections/:id`                     |                                                                                                                                                            |
| `POST /collections`                        | `{ name, notes?, isDefault? }`                                                                                                                             |
| `PATCH /collections/:id`                   | `isDefault: true` moves the default here                                                                                                                   |
| `DELETE /collections/:id`                  | Removes its items (never the funkos); 409 for the default one                                                                                              |
| `GET /collections/:id/items`               | Items of one collection (filters below)                                                                                                                    |
| `GET /collections/:id/items/:itemId`       |                                                                                                                                                            |
| `POST /collections/:id/items`              | `{ funkoId, quantity?, condition?, purchasePriceCents?, purchaseCurrency?, purchasedAt?, notes?, tagIds? }`; 409 with `existingId` when already there      |
| `PATCH /collections/:id/items/:itemId`     | `tagIds` replaces the whole set                                                                                                                            |
| `POST /collections/:id/items/:itemId/move` | `{ toCollectionId }`: keeps tags, notes and purchase data                                                                                                  |
| `DELETE /collections/:id/items/:itemId`    |                                                                                                                                                            |
| `GET /items`                               | Items across all collections; same filters plus `collectionId`                                                                                             |
| `GET /tags`                                | List with item counts; `name`; sort `NAME` \| `CREATION_DATE`                                                                                              |
| `GET /tags/:id`, `POST`, `PATCH`, `DELETE` | Delete only removes the label from items                                                                                                                   |
| `GET /suggest?q=`                          | Search-bar suggestions: funkos, categories, series, collections, tags at once                                                                              |
| `GET /stats`                               | Totals for the home page: counts, per collection, per category, image bytes                                                                                |
| `GET /images`                              | Every stored image (rows with their funko, plus loose files no row uses); `q`, `hasFunko`, sort `SIZE` (default, biggest first) / `CREATION_DATE` / `NAME` |
| `GET /images/groups`                       | The same, one group per funko with its count and total size (loose files last); same params                                                                |
| `GET /export`                              | Everything as one JSON download (top-level `series`, `seriesId` on each funko)                                                                             |
| `GET /export/items.csv`                    | One CSV line per collection item (`series` column after `category`)                                                                                        |
| `GET /uploads/...`                         | The image files (immutable, cached for a year)                                                                                                             |

`GET /funkos` filters: `q`, `name`, `number`, `barcode`, `exclusive`, `type`, `isChase`, `categoryId`, `category`,
`seriesId`, `series`, `tagId`, `tag`, `collectionId`, `collection`, `notInCollectionId`, `hasCollections`, `hasSeries`, `hasTags`, `hasImages`; sort
`RELEVANCE` (default with `q`), `NAME`, `NUMBER`, `CREATION_DATE`, `CATEGORY`, `SERIES` (funkos without a series
come last in both directions). Each hit carries `category`, `series` (or null), `matchedOn` (which fields the search
hit, `SERIES` among them), `collections` (where it sits, with quantity) and `primaryImage`. A funko body takes an
optional `seriesId` (null or left out means none; null on a `PATCH` clears it; a missing series answers 400).

Item list filters: `name`, `funkoId`, `tagId`, `categoryId`, `seriesId`, `condition`, `purchasedFrom`, `purchasedTo`; sort
`NAME`, `NUMBER`, `CREATION_DATE`, `UPDATE_DATE`, `PURCHASE_DATE`, `PURCHASE_PRICE` (default `CREATION_DATE`).

### Errors

One envelope: `{ code, message, issues?, existingId? }`.

| Status | `code`                                                   | When                                                                |
| ------ | -------------------------------------------------------- | ------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`                                       | Bad body or query; `issues` lists `{ path, message }`               |
| 401    | `UNAUTHORIZED`                                           | No valid session (any route but the public ones)                    |
| 401    | `SIGN_IN_FAILED`, `PASSKEY_FAILED`, `INVALID_SETUP_CODE` | A passkey ceremony or setup code failed                             |
| 403    | `CROSS_SITE_REQUEST`, `REAUTH_REQUIRED`                  | A write from another site; removing a passkey needs a fresh sign-in |
| 404    | `NOT_FOUND`                                              |                                                                     |
| 409    | `CONFLICT`                                               | Duplicate or still referenced; `existingId` points at the twin      |
| 409    | `ALREADY_SET_UP`, `NOT_SET_UP`, `LAST_PASSKEY`           | Setup done already / not yet; the only passkey                      |
| 413    | `PAYLOAD_TOO_LARGE`                                      | Image over `MAX_IMAGE_BYTES`                                        |
| 429    |                                                          | Rate limit (600 requests a minute per client)                       |

## Images

`src/lib/imageStorage.ts` is the only file that imports `sharp` or touches the uploads folder. Each upload becomes
`data/uploads/funkos/<funkoId>/<uuid>.{lg,md,sm}.webp` (2000 / 1200 / 480 px long edge, EXIF orientation applied,
metadata stripped) plus a tiny blurred data URI kept in the database as `placeholder`. A response carries
`url` (large), `mediumUrl`, `smallUrl` under `/uploads/...`, plus `width`, `height`, `sizeBytes` and `position`. Deleting a funko deletes its folder; `yarn images:prune` cleans up
anything a crash left behind.

## Layout

```
src/
  app.ts, server.ts       build the Fastify app; start it and shut down cleanly
  config/env.ts           the only reader of process.env
  cli/                    one-off scripts (images:prune, auth:reset)
  db/                     client, schema/, relations, migrations runner, seed
  lib/                    errors, error handler, pagination, query params, image storage, remote fetch, barcode
  modules/<resource>/     <resource>.route.ts, .schema.ts, .service.ts, .repository.ts, .route.test.ts
  plugins/                db, auth (the sign-in check) and uploads (multipart in, static files out)
drizzle/                  SQL migrations (committed)
```

Rules that keep it tidy: no `.then()` chains, no cross-module `.repository.ts` imports (go through the other
module's service), multi-step writes run in one transaction, every route is covered by an `app.inject()` test.

## Docker

`Dockerfile` is a two-stage build (`node:24-slim`); the runtime runs as `node`, reads `/app/data` and listens on 3000. The root `compose.yaml` runs it behind Caddy and keeps `./data` on the host.
