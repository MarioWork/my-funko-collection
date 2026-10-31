# My Funko Collection

A self-hosted Funko Pop tracker for one person, run with Docker Compose on a LAN-only home server. One user signs in
with a passkey or a username and password.
The global React/Node conventions apply; this file holds only what is specific to this repo.

## Layout

- `api/` — Fastify 5 + zod 4 + Prisma 7 on PostgreSQL 18, built from `node-fastify-template`. Follow the
  `node-ts-core` and `node-ts-api` skills (§6 is Prisma). Endpoints and env are documented in `api/README.md`.
- `web/` — React 19 + Vite 8 + Tailwind 4 + shadcn/ui (Base UI) app from `react-project-template`. Follow the
  always-on React core and the `react-ts-*`, `ts-api-services` and `shadcn` skills. Pages, flows and scripts are in
  `web/README.md`.
- `compose.yaml` — the deployment: Caddy (`web/`) on 80/443 with a local CA, proxying `/api` and `/uploads` to the
  api container; neither the api nor the `db` (postgres:18) container is published. All runtime data lives in
  `./data` (`postgres/` + `uploads/`); the db password is `POSTGRES_PASSWORD` in a git-ignored root `.env`.
- UI decisions to keep: image-first grid, scan-first add, filters as a drawer, toast + Undo for undoable writes.

## Vocabulary

The domain words (funko, category, series, variant, collection, item, tag...) are defined in `docs/GLOSSARY.md`.
Use them as written there, in code and in chat. "Variant" means a funko version (chase, glow), never a photo size.

## Product rules

- No external Funko APIs at runtime. Entry is manual; photos are the user's own. Do not propose catalog lookups.
- Images are stored on disk under `data/uploads/funkos/<id>/`: the user uploads one photo, the server makes three
  WebP sizes (2000 / 1200 / 480 px) plus a blur placeholder. Keep them sharp; never shrink below these sizes.
  Each image records who uploaded it (`uploaded_by_id`); deleting that user clears it ("Removed user" on the Images
  page) and never deletes the image.
- One search endpoint: `GET /funkos?q=` searches every field, named params narrow one field. No separate `/search`.
- `DELETE /funkos/:id` answers 409 while the funko is in a collection; `?force=true` removes it from all of them.
- Deleting a tag only removes the label from items. Deleting a collection removes its items, never the funkos.
- Collections, items and tags belong to one user (`docs/adr/0001-shared-catalogue-own-collections.md`); the
  catalogue is shared. Every collection/item/tag read and write takes the signed-in user's id
  (`signedInUserId(request)` from `auth.plugin.ts`, passed route → service → repository) and another user's id
  answers 404. So do the funko filters and search that look at collections, items or tags, a funko's `collections`,
  suggestions, stats and exports. Tag names are unique per user. Only the user's own tags go on their own items:
  the items service asks `assertOwnTags()` in the tags service (the database cannot check "same user" across
  `collection_item_tags`).
- Every user has their own "Owned" (the default) and "Wishlist" from the moment the user row exists: reference data
  from the custom migration `api/prisma/migrations/*_default_collections/` (claimed by the first user) plus a trigger
  in `*_collections_per_user/` for every new user, not the seed or app code. Each insert skips one that is already
  there (`ON CONFLICT DO NOTHING`). Names are unique per user; one default per user (a partial index).
  `yarn auth:reset` keeps the users (deleting one deletes their collections); the next setup gives the first user a
  new passkey and makes them an admin.
- Sign-in is a passkey or a username + password (`docs/adr/0002-passwords-next-to-passkeys.md`, `api/README.md`
  "Sign-in"). Passwords: 15+ characters, the built-in list `api/assets/common-passwords.txt` refused, argon2id via
  Node's `crypto.argon2` (`api/src/lib/passwordHash.ts`), rate limited, never a lockout. Every API
  route and `/uploads` file needs a session unless it sets `config: { isPublic: true }`; keep that list tiny, and
  add new public routes to `PUBLIC_ROUTES` in `auth.route.test.ts`. Sessions are server-side rows (SHA-256 of an
  HttpOnly cookie token), never JWTs or localStorage. No TOTP, email or "auth off" switch, not even in dev.
- Admins create every user (`POST /users`, a sign-in from the last 10 minutes) with an app-made temporary password,
  sent once and stored only as a hash; it dies 7 days after it was made unless replaced
  (`users.temporary_password_expires_at`). Until then the session gets 403 `PASSWORD_CHANGE_REQUIRED` on every
  locked route but those with `config: { isAllowedWithTemporaryPassword: true }` (`PUT /auth/password`, sign-out);
  keep that list tiny. The web's `signedInUserMiddleware` and `authMiddleware` send such a user to `/set-password`,
  and the mocks refuse the rest in `requirePasswordChange.mock.handler.ts`.
- Roles: a user is an `ADMIN` or a `MEMBER` (`docs/GLOSSARY.md`); whoever sets the app up is an admin. Catalogue
  writes (funkos, categories, series, funko images), the images lists and the users set
  `config: { isAdminOnly: true }` and answer 403 `ADMIN_ONLY` to a member; add every new one to `ADMIN_ONLY_ROUTES` in `auth.route.test.ts` (the test
  calls every route as a member). The role check sits next to the sign-in check in `auth.plugin.ts`'s `onRequest`
  hook, a route-level gate rather than a service check (node-ts-api §9), like the sign-in exception below. The web
  hides those controls with `useIsAdmin()` (admin-only pages call `assertAdmin()` in their loader), and the mocks
  refuse them in `requireAdmin.mock.handler.ts`; keep the three in step.
- Deliberate exceptions to the Node skills for auth (decided 2026-10-23): the check is a global `onRequest` hook in
  `auth.plugin.ts` with server-side cookie sessions, not `@fastify/jwt` + `preHandler: [app.authenticate]`
  (node-ts-api §9); random 256-bit tokens (session, setup code) are stored as plain SHA-256, not argon2 (they can't
  be brute-forced and must be looked up by hash); the WebAuthn routes keep the spec's two steps in their URLs
  (`/auth/login/options` + `/auth/login/verify`) instead of noun-only URLs.
- Also kept as they are (decided 2026-10-23): `POST /auth/logout`, `POST /auth/logout-everywhere` and
  `GET /suggest` keep their verb URLs; the sub-resource folders `collections/items/` and `funkos/images/` keep
  their `collectionItems.*` / `funkoImages.*` file prefixes (node-ts-api §3/§4).
- Passkeys are bound to the host name in `APP_ORIGIN` (`x-app-address` in `compose.yaml`): never an IP address, and
  changing it orphans every passkey (`yarn auth:reset` then makes new ones).
- Barcodes are stored and looked up in the 13-digit EAN form: a 12-digit UPC-A gets a leading zero on both sides
  (`api/src/lib/barcode.ts`, `web/src/common/utils/barcodeUtils.ts`). Keep them in step.

## Git workflow

- `main` is protected by GitHub rulesets: no direct push, no force push, every change lands through a pull request.
- New branches must be `feature/<id>-<slug>` or `issue/<id>-<slug>` (other names are refused on push), where `<id>`
  is the GitHub issue it adds or fixes. Open the issue first (`gh issue create`) when there is none.
- The PR body says `Closes #<id>`. Merge with "Rebase and merge" (`gh pr merge --rebase`) when possible, for a
  linear history; `--squash` only when a rebase is refused. So keep PR branches linear: when one conflicts with
  `main`, `git rebase github/main` and force-push the branch (only `main` blocks force push), never merge `main` in.
  The branch is deleted on merge.
- The remote is named `github`, not `origin`.

## Commands

Inside `api/`:

```
yarn dev            # http://localhost:3000, OpenAPI at /docs
yarn test           # Vitest: a copy of a migrated template db + temp uploads folder per test file
yarn typecheck && yarn lint && yarn test   # the definition of green
yarn db:migrate     # prisma migrate dev: apply, or --name=<change> after a schema edit (commit prisma/)
yarn db:seed        # example data with placeholder images
yarn images:prune   # delete image files no row references
yarn auth:reset      # locked out: remove every passkey, password and session (users stay), print a new setup link
```

Inside `web/`:

```
yarn dev                         # http://localhost:5173/home, real API on :3000 (VITE_USE_MOCKS=true for MSW mocks)
yarn tsc -b && yarn lint && yarn test && yarn test-e2e   # the definition of green (e2e starts its own dev server on 5199, desktop + phone)
yarn dlx shadcn@latest add <component>                   # vendors into src/common/components/ui/ (root tsconfig holds the paths)
```

## Gotchas

- Yarn 4.18 has a package age gate: the newest point releases are refused ("quarantined"). Pick an older range.
- No `.then()` chains, no `process.env` outside `config/env.ts` (the test exceptions are commented in
  `src/setupTests.ts` and `src/testGlobalSetup.ts`), no cross-module `.repository.ts` imports: go through the
  other module's service.
- `yarn test` in `api/` needs Postgres on `localhost:5432` with a `funko` role that may create databases
  (`api/README.md`, "Run"). It does not start at login (Mario's choice, 2026-10-31): `yarn postgres:start` /
  `yarn postgres:stop`. Each test file gets its own copy of a migrated template database.
- Prisma (decided 2026-10-31): the generated client (`src/generated/prisma`, git-ignored) is imported by
  repositories, `lib/prisma.ts`, `lib/databaseErrors.ts`, the `Prisma.sql` helpers in `lib/likePatterns.ts` and
  `lib/sqlFragments.ts`, and test/seed code. Three queries are `$queryRaw` because Prisma can't express them: the funko list, the item
  list (numeric `number` sort, relevance) and collection totals (price × quantity). DB errors map by Postgres
  SQLSTATE (`lib/databaseErrors.ts`), not Prisma code. Ids are capped at 2^31 − 1 (`lib/ids.ts`). Prisma's
  `contains` does not escape `%`/`_`: always use `containsText()`. Check constraints, the one-default-per-user
  partial index and the default-collections trigger live by hand in the migration SQL (Prisma ignores them, so
  `migrate dev` never drops them).
  Migrations run in their own one-shot `migrate` container before the api (`compose.yaml`), never at app start.
  Prisma refuses `migrate reset` from an AI agent: ask Mario, or have him run it.
- `src/lib/imageStorage.ts` is the only file that imports `sharp` or touches the uploads folder.
- Run the `node-ts-audit` skill on `api/` and `react-ts-audit` on `web/` before calling a change done.

## Web specifics

- `src/common/components/ui/**` is vendored shadcn code: kebab-case files, several named exports, lint overrides.
  The one exception to "file name = default export". Wrap it in team-named components; never restyle it in place.
- Colours are semantic tokens only (`bg-background`, `text-primary`, `ring-ring`), defined in `src/index.css` from
  two ramps: warm grey (stone) for everything, one teal accent from the logo for buttons, links, focus and selection.
  No `dark:` colour overrides, no hex in a component.
- Every write is a React Router action through `useFetcher`; `fetcher.submit` returns a promise, so `void` it.
- The signed-in user lives in React Router middleware (decided 2026-10-31 by Mario): the shell route's
  `signedInUserMiddleware` (`src/application/routes/`) asks `/auth/status` once, keeps it until sign-out, a 401, a
  403 `ADMIN_ONLY` / `PASSWORD_CHANGE_REQUIRED` or a password save, and puts it in the router `context`. Loaders and actions read `context.get(signedInUserContext)`
  (`assertAdmin(context)`); components use `useSignedInUser` / `useIsAdmin`. Never call `getStatus()` again.
- Two reads call a service outside a loader, on purpose (kept 2026-10-23): the scanner's barcode lookup in
  `pages/Add/hooks/useAddFlow.ts` (reads `error.response` to tell "not found" from a failure) and the type-ahead in
  `common/hookUtils/useSuggestions.ts` (an effect, debounced). Do not add a third without asking.
  Forms use `useFormCompat` (`'use no memo'`) with `<Field>` + `<Controller>` + `yupResolver`.
- List state (q, filters, sort, page) lives in the URL through `useListParams` / `useItemListParams`; the loader
  reads it and the mocks filter, sort and page the same way.
- Things that come and go glide (View Transitions; `index.css` sets the timing, reduced motion turns them off):
  rows the server adds or removes are wrapped in React's `<ViewTransition default={LIST_ITEM_TRANSITION_CLASS}>`;
  a local state change runs through `withViewTransition` (`@utils/viewTransitionUtils`). Never React Router's
  `viewTransition` option on `setSearchParams` or a fetcher (deprecated, and it aborts React's); search keystrokes
  use `flushSync` so typing never animates.
- The React Compiler lint forbids setState in an effect: derive state during render (the previous-prop pattern) or
  move the write into the event handler.
- `VITE_BASE_API_URL` is always `/api` (same origin): Vite proxies it in dev, Caddy in production. Image URLs from
  the API are `/uploads/...` and need no rewriting.
- `LinkButton` keeps `role="link"` (Base UI would announce a button); the desktop `<main>` is shadcn's
  `SidebarInset`, so the content wrapper is a `div`.
- Mock mode: `src/mocks/mockStore.ts` is an in-memory copy of the API seed; `resetMockStore()` runs after each
  Vitest test and before each Playwright test. Handlers read and write that store, so mocks behave like a database;
  there are no per-handler `create*MockModel` factories (decided 2026-10-23, overriding the mocks skill here).
  `yarn dev:big` adds 300 generated funkos (`VITE_MOCK_EXTRA_FUNKOS`), never in tests.
