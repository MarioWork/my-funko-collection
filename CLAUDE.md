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
- `DELETE /funkos/:id` answers 409 `IN_COLLECTIONS` with `userCount` while the funko is in a collection; `?force=true`
  removes it from all of them. Taking it from other users' collections (issue #13) needs `{ reason }` in the body (400
  without; the body keeps it out of request logs), and every user who had it (the admin too, if they had it) gets a
  `FUNKO_REMOVED` notification with the funko's name and the reason, no funko link. The admin learns how many users
  have it (the 409's `userCount`, `userCount` on the admin's `GET /funkos/:id`), never whose; the web's
  `FunkoRemoveDialog` says so and asks why. A delete that only touches the deleter's own items needs no reason and
  tells nobody.
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
- A recent sign-in (10 minutes, `assertRecentSignIn`) guards passkey, password and user changes. "Confirm it's you"
  renews it with a passkey (`POST /auth/login/verify`) or the signed-in user's own password
  (`POST /auth/recent-sign-in`, no username: it never switches users); both replace the session. Web side:
  `withRecentSignIn` + `useConfirmIdentityStep`, the password option only for a user with a username; `/set-password`
  confirms with the temporary password only (`isPasswordOnly`). The word is "recent sign-in" (`docs/GLOSSARY.md`).
- Admins create every user (`POST /users`, a recent sign-in) with an app-made temporary password,
  sent once and stored only as a hash; it dies 7 days after it was made unless replaced
  (`users.temporary_password_expires_at`). Until then the session gets 403 `PASSWORD_CHANGE_REQUIRED` on every
  locked route but those with `config: { isAllowedWithTemporaryPassword: true }` (`PUT /auth/password`,
  `POST /auth/recent-sign-in`, sign-out);
  keep that list tiny. The web's `signedInUserMiddleware` and `authMiddleware` send such a user to `/set-password`,
  and the mocks refuse the rest in `requirePasswordChange.mock.handler.ts`.
- Admins manage users (`PATCH /users/:id` role and/or `isReadOnly`, `POST /users/:id/temporary-password`,
  `DELETE /users/:id`): each needs a recent sign-in and ends all of that user's sessions. There is always one admin
  who is not read-only: the last one can't be made a member, read-only or deleted (409 `LAST_ADMIN`, checked under a
  `users` table lock); the web disables those controls with the reason (`isLastAdmin`). Deleting a user cascades their sessions, passkeys, collections, items and tags in
  the database; funkos stay and their images keep a null uploader.
- Roles: a user is an `ADMIN` or a `MEMBER` (`docs/GLOSSARY.md`); whoever sets the app up is an admin. Changing or
  deleting a category or series, the images lists and the users set `config: { isAdminOnly: true }` and answer 403
  `ADMIN_ONLY` to a member; add every new one to `ADMIN_ONLY_ROUTES` in `auth.route.test.ts` (the test calls every
  route as a member). The role check sits next to the sign-in check in `auth.plugin.ts`'s `onRequest` hook, a
  route-level gate rather than a service check (node-ts-api §9), like the sign-in exception below. The web hides
  those controls with `useIsAdmin()` (admin-only pages call `assertAdmin()` in their loader), and the mocks refuse
  them in `requireAdmin.mock.handler.ts`; keep the three in step.
- Read-only users (issue #8, `docs/GLOSSARY.md`): `users.is_read_only`, read from the user on every request. Every
  write (not GET/HEAD/OPTIONS) answers 403 `READ_ONLY` to them, checked in `auth.plugin.ts`'s `onRequest` hook after
  the temporary-password check and before the admin gate, except routes with `config: { isAllowedWhenReadOnly: true }`
  (own password, own passkeys, the recent sign-in they need, sign-out); keep that list tiny and in step with `ALLOWED_WHEN_READ_ONLY` in
  `auth.route.test.ts` (the test calls every write as a read-only member and admin) and
  `requireWriteAccess.mock.handler.ts`. The web shows every write control disabled with `useReadOnlyReason()`
  (`DisabledReason`; `LinkButton`'s `disabledReason` turns a "New ..." link into a disabled button), pages made only
  for writing call `assertCanWrite()` in their loader (the "read-only" error page), and `authMiddleware` forgets the
  cached user on a 403 `READ_ONLY`.
- Submissions (issue #9, `docs/adr/0001-shared-catalogue-own-collections.md`): a member's new funko, category or
  series is `WAITING` with `submitted_by_id`; an admin's is `APPROVED`. The catalogue a user browses (lists, search,
  suggestions, counts, barcode lookup, adding to a collection) is approved rows plus their own waiting ones
  (`catalogueOf()` in `lib/catalogueVisibility.ts`; the raw funko list writes it in SQL); by id and in the export they
  also see their own rejected or merged ones. Creating them, and the funko and funko-image writes, are open to members: the services decide
  (`funkos/funkos.access.ts`: an admin changes any funko, a member only their own waiting one, else 404 / 403
  `ADMIN_ONLY`). Those routes are `SUBMISSION_ROUTES` in `auth.route.test.ts`, which fails on a catalogue write in
  neither list. Barcode, identity and name uniqueness hold in the approved catalogue and within one member's waiting
  ones (partial unique indexes in the `submissions` migration). A `BEFORE DELETE` trigger on `users` deletes the
  user's rejected submissions (with their items) and their unused never-approved categories and series; waiting,
  approved and merged ones stay with a null sender ("Removed user", shown to admins on a submission), and orphan
  submissions never clash (null senders are distinct in the partial indexes). Until approved, a submission's image
  files under `/uploads` are served only to admins and its sender (the uploads plugin's hook asks
  `assertCanSeeImageFiles()`); others get 404. Reviewing (issue #10): `GET /submissions/review` (Waiting / Done,
  with `possibleDoubles`), `POST /submissions/:id/approval` and `/rejection` are admin-only routes;
  `/resubmission` is the sender's (a `SUBMISSION_ROUTE`). A member also edits or deletes their own rejected one
  (`isOpenSubmission()` in `funkos.access.ts`). Approving moves a waiting category or series into the catalogue, or
  onto the approved one of the same name; a clash with the catalogue is a 409 in words (pre-checked, and
  `isUniqueViolation()` by SQLSTATE in a race). `rejection_reason` is set exactly while REJECTED (a check in the
  `submission_reviews` migration); an admin's change to someone's open submission (fields, or a photo added or removed) sets
  `changed_by_admin_at`, and sending it again clears it. Rejecting an orphan submission deletes it (204). The web
  mirrors the rule in `useCanEditFunko()` /
  `assertCanEditFunko()` and the mocks in `mockCatalogueUtils.ts`. Like `assertOwnTags()`, the cross-module checks
  `isUsableCategory()` / `isUsableSeries()` (may a funko use it) and `assertCanSeeImageFiles()` (the `/uploads` hook)
  are named for what they check, not with the get/add/update/delete verbs.
- Merging (issue #12, `POST /submissions/:id/merge`, admin-only): `{ targetFunkoId }` must be an approved funko. In
  one transaction (`funkosRepository.merge`) every item of the submission moves onto the target; a clash in one
  collection keeps the older item, adds the quantities, joins notes and tags, capped at the item limits
  (`MAX_QUANTITY`, `MAX_TAGS_PER_ITEM` in `collectionItems.type.ts`; the older item's tags first, the newer one's
  extras dropped) so the member can still edit it. The rule is `funkos/funkos.merge.ts`, handed to the repository.
  The submission becomes `MERGED` with `merged_into_id` (a check: only while merged) and keeps its images, category
  and series; its sender gets `SUBMISSION_MERGED` with the target's `funkoId`.
  Web: Merge on the review page opens `MergeSubmissionDialog` (approved maybe-doubles first, then a catalogue search
  through the existing `useSuggestions` type-ahead, not a new read); `mergeSubmission.mock.handler.ts` mirrors the
  item rule. `SubmissionReviewNotes` shows "Merged into" with a link wherever a submission's review is shown.
- Notifications (issue #11): approve and reject tell the sender (reject with its reason; an orphan submission has
  nobody to tell), a new or resent submission tells every admin. One `notifications` table: `kind` (an enum),
  `funko_id` (the funko to open, cleared when it goes) and the funko's name as written, `reason?`, `read_at`.
  Force-delete (#13) added `FUNKO_REMOVED` (`funko_id` null from the start); merge (#12) adds its own `kind`, no new
  column. A user sees and marks only their own (404
  otherwise); marking read is open to read-only users. Kept 90 days with no scheduler: reads skip older rows and
  every new notification deletes everyone's older ones in the same transaction. No email, no push. The web bell's
  count comes from the app shell loader, refreshed by revalidation (every write, every page change), never a poll.
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
yarn dev            # applies pending migrations, then http://localhost:3000, OpenAPI at /docs
yarn test           # Vitest: a copy of a migrated template db + temp uploads folder per test file
yarn typecheck && yarn lint && yarn test   # the definition of green
yarn db:migrate     # prisma migrate dev: apply, or --name=<change> after a schema edit (commit prisma/)
yarn db:seed        # example data with placeholder images, members luke and han (no sign-in) and their submissions
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
  In production, migrations run in their own one-shot `migrate` container before the api (`compose.yaml`), never at
  app start. In dev, `yarn dev` runs `prisma migrate deploy` + `prisma generate` first (never makes or resets one).
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
- The bell's unread count is the one loader value left as a promise (`appShellLoader.ts`, read through
  `<Suspense>` + `<Await>` in `UnreadCountAwait`), and the one read that is caught (a failed count becomes null and
  only hides the number). Both on purpose (issue #11): a badge must never take a page down. Don't copy either for
  page data.
- `LinkButton` keeps `role="link"` (Base UI would announce a button); the desktop `<main>` is shadcn's
  `SidebarInset`, so the content wrapper is a `div`.
- Mock mode: `src/mocks/mockStore.ts` is an in-memory copy of the API seed; `resetMockStore()` runs after each
  Vitest test and before each Playwright test. Handlers read and write that store, so mocks behave like a database;
  there are no per-handler `create*MockModel` factories (decided 2026-10-23, overriding the mocks skill here).
  `yarn dev:big` adds 300 generated funkos (`VITE_MOCK_EXTRA_FUNKOS`), never in tests.
