# My Funko Collection — API

Fastify 5 + zod 4 + Prisma 7 on PostgreSQL, Node 26, TypeScript. Stores the catalog, the collections and their items,
the tags, and the uploaded photos (three WebP sizes each). Built from `node-fastify-template`.

## Run

```bash
corepack enable          # once per machine
yarn install             # also generates the Prisma client (src/generated/, git-ignored)
cp .env.example .env     # defaults are fine for local work
yarn db:migrate          # creates the tables in DATABASE_URL's database
yarn db:seed             # optional: example data with placeholder images
yarn dev                 # http://localhost:3000, OpenAPI UI at /docs
```

`yarn typecheck && yarn lint && yarn test` is the definition of green.

It needs a PostgreSQL 18 server on `localhost:5432` with a `funko` role that may create databases. How to get one
on macOS, Linux or Windows (Docker or a local install): the root [README](../README.md#run-it-locally-development).
`yarn test` says so when it is not running. With Homebrew, `yarn postgres:start` / `yarn postgres:stop` turn it on
and off.

The tests make their own databases on that server (`funko_test_*`, dropped after the run): one migrated template,
then a copy of it per test file, so files run in parallel without seeing each other's rows.

## Scripts

| Script                                       | Does                                                                                                                                                                                                    |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `yarn dev`                                   | Runs `src/server.ts` with `--watch` and `.env`                                                                                                                                                          |
| `yarn build`                                 | Compiles to `dist/` (`tsconfig.build.json`)                                                                                                                                                             |
| `yarn start`                                 | Runs `dist/server.js`                                                                                                                                                                                   |
| `yarn typecheck`                             | `tsc --noEmit`                                                                                                                                                                                          |
| `yarn lint`                                  | ESLint + Prettier check                                                                                                                                                                                 |
| `yarn test`                                  | Vitest: its own Postgres database and temp uploads folder per test file                                                                                                                                 |
| `yarn db:migrate`                            | Applies pending migrations; after a schema edit, `--name=<change>` makes one (commit `prisma/`)                                                                                                         |
| `yarn db:deploy`                             | Applies pending migrations, never makes one (what the container runs)                                                                                                                                   |
| `yarn db:generate`                           | Regenerates the Prisma client (`yarn install` already does)                                                                                                                                             |
| `yarn postgres:start` / `yarn postgres:stop` | Turns the local Postgres (Homebrew) on or off; it never starts at login                                                                                                                                 |
| `yarn db:seed`                               | Example categories, series, funkos, tags, images, and items in the first user's "Owned" and "Wishlist" (with nobody set up, a user with no sign-in is made for them; the first setup becomes that user) |
| `yarn db:studio`                             | Prisma Studio                                                                                                                                                                                           |
| `yarn images:prune`                          | Deletes image files no row references                                                                                                                                                                   |
| `yarn auth:reset`                            | Locked out: removes every passkey, password and sign-in (users and their collections stay), prints a new setup link                                                                                     |

## Environment

Read once in `src/config/env.ts` (zod); the process exits on an invalid value. Only that file touches `process.env`.

| Variable               | Default                 | Meaning                                                                                   |
| ---------------------- | ----------------------- | ----------------------------------------------------------------------------------------- |
| `NODE_ENV`             | `development`           | `development`, `test` or `production`                                                     |
| `LOG_LEVEL`            | `info`                  | pino level                                                                                |
| `PORT`                 | `3000`                  |                                                                                           |
| `DATABASE_URL`         | (required)              | PostgreSQL URL: `postgresql://funko:funko@localhost:5432/funko_dev`                       |
| `APP_ORIGIN`           | `http://localhost:5173` | The address the app is opened at; https in production. Passkeys are tied to its host name |
| `TRUST_PROXY_HOPS`     | `0`                     | Proxies in front (1 behind Caddy), for the real client IP                                 |
| `CORS_ORIGINS`         | (none)                  | Browser origins, comma-separated, never `*`; empty = off                                  |
| `UPLOADS_DIR`          | `./data/uploads`        | Where image files live (the Docker volume mounts over it)                                 |
| `MAX_IMAGE_BYTES`      | `5242880`               | Per uploaded file                                                                         |
| `MAX_IMAGES_PER_FUNKO` | `10`                    |                                                                                           |
| `IMAGE_LARGE_PX`       | `2000`                  | Longest side of the `lg` size                                                             |
| `IMAGE_MEDIUM_PX`      | `1200`                  | `md` size                                                                                 |
| `IMAGE_SMALL_PX`       | `480`                   | `sm` size (grid thumbnails; kept this large on purpose)                                   |

## Data model

| Table                  | What                                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| `categories`           | A Funko line as printed on the box: "Pop! Marvel", "Pop! Star Wars"                                  |
| `series`               | The show, film or game a figure comes from: "Daredevil: Born Again"                                  |
| `funkos`               | One figure: name, number, type, category, series?, chase / exclusive, barcode                        |
| `funko_images`         | A photo of a funko: position, byte size, three WebP sizes + blur placeholder, uploader and time      |
| `collections`          | One user's own list (`user_id`, name unique per user): "Owned" (each user's one default), "Wishlist" |
| `collection_items`     | One funko in one collection: quantity, condition, price, currency, date, notes                       |
| `collection_item_tags` | Item ↔ tag                                                                                           |
| `tags`                 | A free label on an item, mainly the storage box ("Box 3")                                            |
| `users`                | A person who signs in: name, role, WebAuthn user handle, lower-case username and argon2id hash       |
| `passkeys`             | A passkey's public key, counter and name (the private key never leaves the device)                   |
| `sessions`             | A signed-in browser: SHA-256 of the cookie token, how it signed in, sign-in and last-seen times      |
| `auth_challenges`      | One-use, 5-minute challenges for passkey ceremonies                                                  |
| `setup_codes`          | SHA-256 of the first-run code, only until someone sets the app up                                    |

Value sets: funko `type` is one of `POP`, `POP_DELUXE`, `POP_RIDES`, `POP_MOMENT`, `POP_TOWN`, `POP_ALBUM`,
`POP_JUMBO`, `POP_KEYCHAIN`, `SODA`, `BITTY_POP`, `MYSTERY_MINI`, `OTHER`; item `condition` is `MINT_IN_BOX`,
`BOX_DAMAGED`, `OUT_OF_BOX` or null; user `role` is `ADMIN` or `MEMBER` (the default for a new row).

Barcodes are stored and looked up in the 13-digit EAN form: a 12-digit UPC-A gets a leading zero
(`src/lib/barcode.ts`), so a scanned code matches a typed one.

## Sign-in

A passkey or a username and password, for one person (`docs/adr/0002-passwords-next-to-passkeys.md`). Every route
needs a session except `/health`, `/ready`, `GET /auth/status`, the four setup / login ceremony routes and
`POST /auth/login/password`, which say so with
`config: { isPublic: true }`; the image files under `/uploads` need one too. `src/plugins/auth.plugin.ts` holds the
check, locked by default, and `auth.route.test.ts` calls every route in the OpenAPI document without a cookie.

- **First run.** While nobody has set the app up, each start prints a one-time link (`<APP_ORIGIN>/setup?code=...`)
  on stdout as plain text, kept out of the structured log. The code makes the first passkey; it is stored only as a SHA-256 and dies once used.
- **Session.** A random 256-bit token in an `HttpOnly`, `SameSite=Strict`, `Path=/` cookie (`__Host-session` over
  https, `session` on the plain-http dev server); the database keeps its SHA-256. It lasts 30 days from the sign-in,
  ends after 7 days unused, and a new one replaces the browser's old one at every sign-in. It records how it was
  opened (`PASSKEY` or `PASSWORD`); only a passkey session points at its passkey.
- **Passkeys.** `@simplewebauthn/server`: discoverable, user verification required, no attestation (any passkey
  manager works, Bitwarden included). Adding or removing one needs a sign-in from the last 10 minutes; the last one can't go, and
  removing one ends every session it opened.
- **Password.** Set or changed in Settings (`PUT /auth/password`, with the username; answers the user), which needs a sign-in from the
  last 10 minutes and ends every other session a password opened. At least 15 characters, no character-mix rules,
  refused when it is on the built-in common list (`assets/common-passwords.txt`, case ignored, no outside service).
  Stored only as an argon2id hash (`src/lib/passwordHash.ts`, Node's own `crypto.argon2`, 19 MiB, 2 passes).
  Usernames are 3–32 letters, digits, `.`, `-` or `_`, compared lower-case. A wrong username, a wrong password and
  a user with no password all get the same 401 `SIGN_IN_FAILED`, after the same hashing time.
- **Roles.** A user is an `ADMIN` or a `MEMBER`. Whoever sets the app up is an admin (the migration made the user
  already there one). Routes with `config: { isAdminOnly: true }` answer 403 `ADMIN_ONLY` to a member: every
  catalogue write (funkos, categories, series, funko images) and the images lists (`GET /images`, `/images/groups`,
  `/export/images.*`). Members read the catalogue and keep their own collections, items and tags.
  `auth.route.test.ts` lists every admin-only route in `ADMIN_ONLY_ROUTES` and calls every route as a member.
- **Cross-site writes.** Any non-GET request whose `Sec-Fetch-Site` is not `same-origin`/`none`, or whose `Origin`
  is not `APP_ORIGIN`, answers 403 `CROSS_SITE_REQUEST`.
- **Limits.** The ceremony routes allow 10 requests a minute per address (5 attempts); password sign-in allows 5.
  There is no lockout: anyone could trigger one against the owner.
- **Locked out.** `docker compose exec api node dist/cli/resetAuth.js` removes every passkey, password and session and prints a new setup
  link (`yarn auth:reset` in dev). The users stay, with their collections and items (deleting a user
  would delete those), and the next setup gives the first user a new passkey (and the admin role) instead of making a second user.

API answers carry `Cache-Control: no-store`; image files `private, max-age=31536000, immutable`.

## Endpoints

Interactive docs with every schema: `GET /docs` (dev only). Auth: `GET /auth/status`, `POST /auth/setup/{options,verify}`,
`POST /auth/login/{options,verify,password}`, `PUT /auth/password`, `POST /auth/logout`, `POST /auth/logout-everywhere`, `GET|POST /auth/passkeys`
(`/options`, `/verify`), `DELETE /auth/passkeys/:passkeyId`. Every list endpoint takes `page` (1-based), `size`
(max 100), `sorting_fields` and `direction` (`ASC` | `DESC`) and answers `{ data, totalResultNumber, currentPage }`.
Text filters are case-insensitive "contains"; id filters take a comma-separated list.

The catalogue (categories, series, funkos, images) is shared; collections and items belong to one user
(`docs/adr/0001-shared-catalogue-own-collections.md`). Every collection and item route, the funko filters and search
that look at collections or tags, the `collections` on a funko, suggestions, stats and exports see only the signed-in
user's own; another user's collection or item id answers 404. A database trigger gives every new user their own
"Owned" (the default) and "Wishlist", whatever code makes the user.

| Method and path                                                    | What                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /health`, `GET /ready`                                        | Liveness, readiness (database reachable)                                                                                                                                                                                                                                                                                                                                                                          |
| `GET /categories`                                                  | List; `name`; sort `NAME` \| `CREATION_DATE`                                                                                                                                                                                                                                                                                                                                                                      |
| `GET /categories/:id`                                              |                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `POST /categories`                                                 | `{ name }`                                                                                                                                                                                                                                                                                                                                                                                                        |
| `PATCH /categories/:id`                                            |                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `DELETE /categories/:id`                                           | 409 while funkos still use it                                                                                                                                                                                                                                                                                                                                                                                     |
| `GET /series`                                                      | List with funko counts; `name`; sort `NAME` \| `CREATION_DATE`                                                                                                                                                                                                                                                                                                                                                    |
| `GET /series/:id`                                                  |                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `POST /series`                                                     | `{ name }`; 409 when the name is taken                                                                                                                                                                                                                                                                                                                                                                            |
| `PATCH /series/:id`                                                |                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `DELETE /series/:id`                                               | Its funkos stay, with `series: null`                                                                                                                                                                                                                                                                                                                                                                              |
| `GET /funkos`                                                      | List and search: `q` searches every field; named params narrow one (below)                                                                                                                                                                                                                                                                                                                                        |
| `GET /funkos/by-barcode/:barcode`                                  | For a phone scanner                                                                                                                                                                                                                                                                                                                                                                                               |
| `GET /funkos/:id`                                                  | With all its images                                                                                                                                                                                                                                                                                                                                                                                               |
| `POST /funkos`                                                     | 409 with `existingId` when the same funko or barcode already exists                                                                                                                                                                                                                                                                                                                                               |
| `PATCH /funkos/:id`                                                |                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `DELETE /funkos/:id`                                               | 409 while it sits in anyone's collection (naming only your own, others as "other users' collections"); `?force=true` removes it from all                                                                                                                                                                                                                                                                          |
| `POST /funkos/:id/images`                                          | Multipart, field `file` (several allowed); makes the three sizes                                                                                                                                                                                                                                                                                                                                                  |
| `POST /funkos/:id/images/from-url`                                 | `{ url }`: downloads a public image and stores it                                                                                                                                                                                                                                                                                                                                                                 |
| `PATCH /funkos/:id/images/order`                                   | `{ imageIds }`: the first one is the primary                                                                                                                                                                                                                                                                                                                                                                      |
| `POST /funkos/:id/images/:imageId/rotate`                          | `{ degrees: 90 \| 180 \| 270 }` clockwise; the image gets new URLs                                                                                                                                                                                                                                                                                                                                                |
| `DELETE /funkos/:id/images/:imageId`                               |                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `GET /collections`                                                 | List with counts and money spent; sort `NAME` \| `CREATION_DATE`                                                                                                                                                                                                                                                                                                                                                  |
| `GET /collections/:id`                                             |                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `POST /collections`                                                | `{ name, notes?, isDefault? }`                                                                                                                                                                                                                                                                                                                                                                                    |
| `PATCH /collections/:id`                                           | `isDefault: true` moves the default here                                                                                                                                                                                                                                                                                                                                                                          |
| `DELETE /collections/:id`                                          | Removes its items (never the funkos); 409 for the default one                                                                                                                                                                                                                                                                                                                                                     |
| `GET /collections/:id/items`                                       | Items of one collection (filters below)                                                                                                                                                                                                                                                                                                                                                                           |
| `GET /collections/:id/items/:itemId`                               |                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `POST /collections/:id/items`                                      | `{ funkoId, quantity?, condition?, purchasePriceCents?, purchaseCurrency?, purchasedAt?, notes?, tagIds? }`; 409 with `existingId` when already there                                                                                                                                                                                                                                                             |
| `PATCH /collections/:id/items/:itemId`                             | `tagIds` replaces the whole set                                                                                                                                                                                                                                                                                                                                                                                   |
| `POST /collections/:id/items/:itemId/move`                         | `{ toCollectionId }`: keeps tags, notes and purchase data                                                                                                                                                                                                                                                                                                                                                         |
| `DELETE /collections/:id/items/:itemId`                            |                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `GET /items`                                                       | Items across all collections; same filters plus `collectionId`                                                                                                                                                                                                                                                                                                                                                    |
| `GET /tags`                                                        | List with item counts; `name`; sort `NAME` \| `CREATION_DATE`                                                                                                                                                                                                                                                                                                                                                     |
| `GET /tags/:id`, `POST`, `PATCH`, `DELETE`                         | Delete only removes the label from items                                                                                                                                                                                                                                                                                                                                                                          |
| `GET /suggest?q=`                                                  | Search-bar suggestions: funkos, categories, series, collections, tags at once                                                                                                                                                                                                                                                                                                                                     |
| `GET /stats`                                                       | Totals for the home page, for the signed-in user only: the funkos in their collections (count, categories, images and bytes, per category), and each of their collections                                                                                                                                                                                                                                         |
| `GET /images`                                                      | Every stored image (rows with their funko, uploader and upload time, plus loose files no row uses); `q`, `hasFunko`, sort `SIZE` (default, biggest first) / `CREATION_DATE` / `NAME`                                                                                                                                                                                                                              |
| `GET /images/groups`                                               | The same, one group per funko with its count and total size (loose files last); same params                                                                                                                                                                                                                                                                                                                       |
| `GET /export`                                                      | Everything as one JSON download: the whole catalogue and the signed-in user's own collections, items and item tags (top-level `series`, `seriesId` on each funko)                                                                                                                                                                                                                                                 |
| `GET /export/items.csv`                                            | One CSV line per item in the signed-in user's collections (`series` column after `category`)                                                                                                                                                                                                                                                                                                                      |
| `GET /export/funkos.{csv,json,xlsx}`                               | The funkos of one `categoryId`, `seriesId`, `collectionId`, `tagId` or `funkoId` (all funkos without one): CSV and spreadsheet one line per funko and item, JSON one entry per funko with its items; every format links each photo (`image_urls` / `imageUrls`), and a single funko's spreadsheet embeds its photos on a Photos sheet; named after the filter (`category-pop-marvel.xlsx`), 404 for an unknown id |
| `GET /export/{categories,series,collections,tags}.{csv,json,xlsx}` | A whole list (names, counts, notes, totals); `?includeFunkos=true` adds their funkos: a second sheet, the CSV's lines (each once), or nested per entry in the JSON                                                                                                                                                                                                                                                |
| `GET /export/images.{csv,json,xlsx}`                               | Every stored image: its funko, file, size, upload date and absolute links to the three sizes (never the files)                                                                                                                                                                                                                                                                                                    |
| `GET /uploads/...`                                                 | The image files (immutable, cached for a year)                                                                                                                                                                                                                                                                                                                                                                    |

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

| Status | `code`                                                   | When                                                                          |
| ------ | -------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`                                       | Bad body or query; `issues` lists `{ path, message }`                         |
| 400    | `COMMON_PASSWORD`                                        | The new password is on the common-password list                               |
| 401    | `UNAUTHORIZED`                                           | No valid session (any route but the public ones)                              |
| 401    | `SIGN_IN_FAILED`, `PASSKEY_FAILED`, `INVALID_SETUP_CODE` | A sign-in, passkey ceremony or setup code failed                              |
| 403    | `CROSS_SITE_REQUEST`, `REAUTH_REQUIRED`                  | A write from another site; a passkey or password change needs a fresh sign-in |
| 403    | `ADMIN_ONLY`                                             | A member called an admin-only route (catalogue writes, images lists)          |
| 404    | `NOT_FOUND`                                              |                                                                               |
| 409    | `CONFLICT`                                               | Duplicate or still referenced; `existingId` points at the twin                |
| 409    | `ALREADY_SET_UP`, `NOT_SET_UP`, `LAST_PASSKEY`           | Setup done already / not yet; the only passkey                                |
| 413    | `PAYLOAD_TOO_LARGE`                                      | Image over `MAX_IMAGE_BYTES`                                                  |
| 429    |                                                          | Rate limit (600 requests a minute per client)                                 |

## Images

`src/lib/imageStorage.ts` is the only file that imports `sharp` or touches the uploads folder. Each upload becomes
`data/uploads/funkos/<funkoId>/<uuid>.{lg,md,sm}.webp` (2000 / 1200 / 480 px long edge, EXIF orientation applied,
metadata stripped) plus a tiny blurred data URI kept in the database as `placeholder`. A response carries
`url` (large), `mediumUrl`, `smallUrl` under `/uploads/...`, plus `width`, `height`, `sizeBytes` and `position`.
Every image records the user who uploaded it (`uploaded_by_id`) and when (`created_at`); the images that existed
before went to the first admin. Deleting that user keeps the image and clears its uploader, so `GET /images` shows
`uploadedBy: null` on a row (a removed user), as on a loose file. Deleting a funko deletes its folder; `yarn images:prune` cleans up
anything a crash left behind (in the container: `docker compose exec api node dist/cli/pruneImages.js`).

## Layout

```
src/
  app.ts, server.ts       build the Fastify app; start it and shut down cleanly
  config/env.ts           the only reader of process.env
  cli/                    one-off scripts (images:prune, auth:reset)
  generated/prisma/       the Prisma client (generated, git-ignored)
  lib/                    Prisma client, database errors, LIKE patterns and SQL fragments, error handler,
                          pagination, ids, query params, image storage, remote fetch, barcode, password hashing
  modules/<resource>/     <resource>.route.ts, .schema.ts, .service.ts, .repository.ts, .route.test.ts
  plugins/                prisma, auth (the sign-in check) and uploads (multipart in, static files out)
assets/
  common-passwords.txt    common passwords of 15+ characters, refused as a new password (from SecLists)
prisma/
  schema.prisma           the models
  migrations/             SQL migrations (committed; the first one adds the rules Prisma cannot declare)
  seed.ts                 example data (yarn db:seed)
```

Test helpers sit at the top of `src/`: `setupTests.ts` and `testGlobalSetup.ts` (the test databases, through
`testDatabases.ts`), `testDb.ts` (`resetTestDb()`) and `testFixtures.ts` (row factories, `signIn`).

Three queries are raw SQL (`$queryRaw`), because Prisma's query API cannot express them: `GET /funkos` (sorted by
relevance, and numbers as numbers: 2 before 10), `GET /collections/items` (numbers too) and the collection totals
(price × quantity). Everything else goes through Prisma's query API.

Rules that keep it tidy: no `.then()` chains, no cross-module `.repository.ts` imports (go through the other
module's service), multi-step writes run in one transaction, every route is covered by an `app.inject()` test.

## Docker

`Dockerfile` builds two images from one build stage (`node:24-slim`, both run as `node`): `migrate` holds the Prisma
CLI and the migrations and runs `prisma migrate deploy` once; `runtime` (the default) holds `dist/` and production
dependencies and listens on 3000. The root `compose.yaml` starts `db` (postgres:18), then `migrate`, then the api
once `migrate` has exited cleanly, behind Caddy, and keeps `./data` on the host.
