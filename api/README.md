# My Funko Collection — API

Fastify 5 + zod 4 + Prisma 7 on PostgreSQL, Node 26, TypeScript. Stores the catalog, the collections and their items,
the tags, and the uploaded photos (three WebP sizes each). Built from `node-fastify-template`.

## Run

```bash
corepack enable          # once per machine
yarn install             # also generates the Prisma client (src/generated/, git-ignored)
cp .env.example .env     # defaults are fine for local work
yarn db:seed             # optional: example data with placeholder images and the seeded users (below)
yarn dev                 # applies pending migrations, then http://localhost:3000, OpenAPI UI at /docs
```

`yarn typecheck && yarn lint && yarn test` is the definition of green.

It needs a PostgreSQL 18 server on `localhost:5432` with a `funko` role that may create databases. How to get one
on macOS, Linux or Windows (Docker or a local install): the root [README](../README.md#run-it-locally-development).
`yarn test` says so when it is not running. With Homebrew, `yarn postgres:start` / `yarn postgres:stop` turn it on
and off.

The tests make their own databases on that server (`funko_test_*`, dropped after the run): one migrated template,
then a copy of it per test file, so files run in parallel without seeing each other's rows.

## Scripts

| Script                                       | Does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `yarn dev`                                   | Applies pending migrations (`prisma migrate deploy`) and regenerates the client, then runs `src/server.ts` with `--watch` and `.env`                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `yarn build`                                 | Compiles to `dist/` (`tsconfig.build.json`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `yarn start`                                 | Runs `dist/server.js`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `yarn typecheck`                             | `tsc --noEmit`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `yarn lint`                                  | ESLint + Prettier check                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `yarn test`                                  | Vitest: its own Postgres database and temp uploads folder per test file                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `yarn db:migrate`                            | Applies pending migrations; after a schema edit, `--name=<change>` makes one (commit `prisma/`)                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `yarn db:deploy`                             | Applies pending migrations, never makes one (what the container runs)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `yarn db:generate`                           | Regenerates the Prisma client (`yarn install` already does)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `yarn postgres:start` / `yarn postgres:stop` | Turns the local Postgres (Homebrew) on or off; it never starts at login                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `yarn db:seed`                               | Local only (refuses `NODE_ENV=production`). Example categories, series, funkos, tags, images, and items in the first user's "Owned" and "Wishlist" (with nobody set up, that first user is `leia`), the seeded users below, plus two members, `luke` and `han`, with no sign-in (give one a temporary password on the Users page to sign in as them), and their submissions: two waiting (one maybe a double of Thanos #78), each with one photo its sender uploaded, one rejected with a reason and one merged into Grogu, with the notifications they sent |
| `yarn db:studio`                             | Prisma Studio                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `yarn images:prune`                          | Deletes image files no row references                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `yarn auth:reset`                            | Locked out: removes every passkey, password and sign-in (users and their collections stay), prints a new setup link                                                                                                                                                                                                                                                                                                                                                                                                                                          |

### Seeded users

`yarn db:seed` makes one user per set of UI states, all signing in with the same dev password
**`funko-dev-password-123`** (15+ characters, not on the common list). Seeding again resets their role, read-only
setting and password. The web's dev sign-in picker (`yarn dev`, sign-in page) fills the normal form with them; the
mocks have the same people (`web/README.md`, "Seeing every UI state").

| Username | Role                       | Shows                                                                                                                                                                                                                                                                                                                                        |
| -------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `leia`   | Admin                      | Every notification kind, read and unread; the review list with every status (waiting, sent again, rejected, merged, approved, an orphan); Darth Vader, a funko other users have. On a fresh database she is the first user (the example items are hers) and the last admin who can make changes, so the Users page shows the locked controls |
| `rey`    | Member                     | Her submissions waiting, sent again, rejected, rejected then changed by an admin, merged (into Darth Vader) and approved; every member notification, read and unread                                                                                                                                                                         |
| `poe`    | Member, read-only          | Every write refused with 403 `READ_ONLY`                                                                                                                                                                                                                                                                                                     |
| `lando`  | Admin, read-only           | The same as an admin                                                                                                                                                                                                                                                                                                                         |
| `finn`   | Member, temporary password | Must replace the password first (403 `PASSWORD_CHANGE_REQUIRED`, `/set-password` on the web); it expires 7 days after the seed                                                                                                                                                                                                               |

With leia holding the dev password, a fresh seeded database counts as set up, so no setup link is printed;
`yarn auth:reset` prints one (and removes every password) to give her a passkey instead. On a database where
someone was already set up, that user keeps the example items and leia is one more admin (so not the last one).
Signing in with a password is rate limited (5 a minute per address) for the seeded users too.

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

| Table                  | What                                                                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `categories`           | A Funko line as printed on the box: "Pop! Marvel", "Pop! Star Wars"; `status` and `submitted_by_id` like a funko's                                                  |
| `series`               | The show, film or game a figure comes from: "Daredevil: Born Again"; `status` and `submitted_by_id` like a funko's                                                  |
| `funkos`               | One figure: name, number, type, category, series, chase / exclusive, barcode?, `status`, and the member who sent it in (`submitted_by_id`)                          |
| `funko_images`         | A photo of a funko: position, byte size, three WebP sizes + blur placeholder, uploader and time                                                                     |
| `collections`          | One user's own list (`user_id`, name unique per user): "Owned" (each user's one default), "Wishlist"                                                                |
| `collection_items`     | One funko in one collection: quantity, condition, price, currency, date, notes                                                                                      |
| `collection_item_tags` | Item ↔ tag                                                                                                                                                          |
| `tags`                 | One user's own label for their items (`user_id`, name unique per user), mainly the box ("Box 3")                                                                    |
| `users`                | A person who signs in: name, role, read-only or not, WebAuthn user handle, lower-case username, argon2id hash and, while it is temporary, when the password expires |
| `passkeys`             | A passkey's public key, counter and name (the private key never leaves the device)                                                                                  |
| `sessions`             | A signed-in browser: SHA-256 of the cookie token, how it signed in, sign-in and last-seen times                                                                     |
| `auth_challenges`      | One-use, 5-minute challenges for passkey ceremonies                                                                                                                 |
| `setup_codes`          | SHA-256 of the first-run code, only until someone sets the app up                                                                                                   |
| `notifications`        | A message for one user (`user_id`) about one funko: `kind`, `funko_id` (cleared when the funko goes), the funko's name as it was, `reason?`, `read_at`              |

Value sets: funko `type` is one of `POP`, `POP_DELUXE`, `POP_RIDES`, `POP_MOMENT`, `POP_TOWN`, `POP_ALBUM`,
`POP_JUMBO`, `POP_KEYCHAIN`, `SODA`, `BITTY_POP`, `MYSTERY_MINI`, `OTHER`; item `condition` is `MINT_IN_BOX`,
`BOX_DAMAGED`, `OUT_OF_BOX` or null; user `role` is `ADMIN` or `MEMBER` (the default for a new row); a funko's,
category's or series' `status` is `WAITING`, `APPROVED` (the default), `REJECTED` or `MERGED`; a notification's `kind`
is `SUBMISSION_APPROVED`, `SUBMISSION_REJECTED` (with the reason), `SUBMISSION_MERGED` (pointing at the catalogue
funko), `SUBMISSION_SENT`, `SUBMISSION_RESENT` or `FUNKO_REMOVED` (with the reason, no `funko_id`). A merged funko's
`merged_into_id` names the catalogue funko it went into (only while `MERGED`, a check in the `submission_merges`
migration; cleared if that funko is deleted).

Barcodes are stored and looked up in the 13-digit EAN form: a 12-digit UPC-A gets a leading zero
(`src/lib/barcode.ts`), so a scanned code matches a typed one.

## Sign-in

A passkey or a username and password, for each user (`docs/adr/0002-passwords-next-to-passkeys.md`). Every route
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
  manager works, Bitwarden included). Adding or removing one needs a recent sign-in (10 minutes); the last one can't go, and
  removing one ends every session it opened.
- **Password.** Set or changed in Settings (`PUT /auth/password`, with the username; answers the user), which needs a sign-in from the
  last 10 minutes and ends every other session a password opened. At least 15 characters, no character-mix rules,
  refused when it is on the built-in common list (`assets/common-passwords.txt`, case ignored, no outside service).
  Stored only as an argon2id hash (`src/lib/passwordHash.ts`, Node's own `crypto.argon2`, 19 MiB, 2 passes).
  Usernames are 3–32 letters, digits, `.`, `-` or `_`, compared lower-case. A wrong username, a wrong password and
  a user with no password all get the same 401 `SIGN_IN_FAILED`, after the same hashing time.
- **Recent sign-in.** Changing a passkey or the password, and creating or managing users, need a sign-in from the
  last 10 minutes (`assertRecentSignIn`, else 403 `REAUTH_REQUIRED`). Either way of signing in renews it: a passkey
  through `POST /auth/login/verify`, or the signed-in user's own password through `POST /auth/recent-sign-in`
  (`{ password }`, no username, so it can never switch users). Both replace the session with a fresh one; the
  password one becomes a `PASSWORD` session. A wrong password and a user with no password get the same 401
  `SIGN_IN_FAILED`, it has the sign-in's limit (5 tries a minute per address, its own count) and never locks
  anyone out. A temporary-password session may use it with that temporary password (an expired one answers 401
  `TEMPORARY_PASSWORD_EXPIRED`); the password still has to be replaced after.
- **Roles.** A user is an `ADMIN` or a `MEMBER`. Whoever sets the app up is an admin (the migration made the user
  already there one). Routes with `config: { isAdminOnly: true }` answer 403 `ADMIN_ONLY` to a member: changing or
  deleting a category or series, reviewing submissions (`GET /submissions/review`, `POST
/submissions/:id/approval`, `/rejection`, `/merge`), the images lists (`GET /images`, `/images/groups`, `/export/images.*`)
  and the users (`/users` and everything under it). Members read the catalogue, keep their own collections, items
  and tags, and send new funkos in as submissions (below): `POST /funkos`, `/categories` and `/series` are open to
  them, and so are the funko and funko-image writes and `POST /submissions/:id/resubmission`, whose services
  (`funkos.access.ts`) let a member change only their own waiting or rejected submission: another member's answers
  404, a catalogue funko (or their own once approved or merged) 403 `ADMIN_ONLY`. `auth.route.test.ts` keeps both lists (`ADMIN_ONLY_ROUTES`, `SUBMISSION_ROUTES`) and fails when a
  catalogue write is on neither.
- **Read-only.** An admin can limit a user to looking (`users.is_read_only`, `isReadOnly` in `GET /auth/status`
  and the sign-in answer). They still sign in and read everything they could before, but every write answers 403
  `READ_ONLY` except their own password (`PUT /auth/password`), their own passkeys (`POST /auth/passkeys/options`,
  `/verify`, `DELETE /auth/passkeys/:passkeyId`), the recent sign-in those need (`POST /auth/recent-sign-in`),
  signing out (`POST /auth/logout`, `/logout-everywhere`) and marking their own notifications read
  (`PATCH /notifications`, `/notifications/:notificationId`), which
  say so with `config: { isAllowedWhenReadOnly: true }`. The check runs in the same `onRequest` hook, after the
  temporary-password one and before the admin gate, on the user's row as it is now (the session reads it on every
  request). `auth.route.test.ts` calls every write in the OpenAPI document as a read-only member and admin
  (`ALLOWED_WHEN_READ_ONLY`).
- **New users.** Only an admin creates a user (`POST /users` with a username and a role), and it needs the admin's
  sign-in from the last 10 minutes. The user is named after the username and gets an app-made temporary password:
  four groups of five characters with no look-alikes (`abcde-fghjk-...`, ~99 bits), never on the common list,
  stored only as its argon2id hash and sent once, in that answer. It stops working 7 days after it was made
  (`temporary_password_expires_at`) unless the user replaces it first; signing in with an expired one answers 401
  `TEMPORARY_PASSWORD_EXPIRED`, but only once the password matched. A session of a user whose password is temporary
  (`mustChangePassword` in `GET /auth/status` and the sign-in answer) gets 403 `PASSWORD_CHANGE_REQUIRED` on every
  locked route but `PUT /auth/password`, `POST /auth/recent-sign-in`, `POST /auth/logout` and `POST /auth/logout-everywhere`
  (`config: { isAllowedWithTemporaryPassword: true }`), the image files included. Saving a new password (not the
  temporary one: 400 `PASSWORD_REUSED`) makes it the user's own and opens the app. The database trigger gives the
  new user their own "Owned" and "Wishlist".
  `auth.route.test.ts` lists every admin-only route in `ADMIN_ONLY_ROUTES` and calls every route as a member.
- **Managing users.** An admin changes a user's role or makes them read-only and back (`PATCH /users/:userId`), gives one who forgot their password a
  new temporary password (`POST /users/:userId/temporary-password`, same rules as on create: shown once, 7 days, must
  be replaced; the old password stops working, passkeys stay; a user with no username gets one in the body (one who has a username keeps it: another answers 400), else 400
  `USERNAME_REQUIRED`) or deletes one (`DELETE /users/:userId`). Each needs the admin's sign-in from the last 10
  minutes and ends every session of that user at once, the admin's own included when they change themselves. There
  is always at least one admin who is not read-only: making the last one a member, read-only or deleting them answers
  409 `LAST_ADMIN` (checked under a table lock, so two admins demoting each other can't both win), and `GET /users`
  marks that user `isLastAdmin`. Ending the sessions on a role or read-only change makes the app ask
  `GET /auth/status` again at the next sign-in, so it shows the new role or the read-only controls at once. Deleting a user deletes their sessions, passkeys, collections, items and tags (database cascades);
  catalogue funkos stay, and images they uploaded keep showing with a removed user as uploader. What they sent in:
  see "Submissions" below.
- **Cross-site writes.** Any non-GET request whose `Sec-Fetch-Site` is not `same-origin`/`none`, or whose `Origin`
  is not `APP_ORIGIN`, answers 403 `CROSS_SITE_REQUEST`.
- **Limits.** The ceremony routes allow 10 requests a minute per address (5 attempts); password sign-in allows 5.
  There is no lockout: anyone could trigger one against the owner.
- **Locked out.** `docker compose exec api node dist/cli/resetAuth.js` removes every passkey, password and session and prints a new setup
  link (`yarn auth:reset` in dev). The users stay, with their collections, items and tags (deleting a user
  would delete those), and the next setup gives the first user a new passkey (and the admin role) instead of making a second user.

API answers carry `Cache-Control: no-store`; image files `private, max-age=31536000, immutable`.

## Endpoints

Interactive docs with every schema: `GET /docs` (dev only). Auth: `GET /auth/status`, `POST /auth/setup/{options,verify}`,
`POST /auth/login/{options,verify,password}`, `POST /auth/recent-sign-in`, `PUT /auth/password`, `POST /auth/logout`, `POST /auth/logout-everywhere`, `GET|POST /auth/passkeys`
(`/options`, `/verify`), `DELETE /auth/passkeys/:passkeyId`. Users (admins only): `GET|POST /users`, `PATCH|DELETE /users/:userId`, `POST /users/:userId/temporary-password`. Every list endpoint takes `page` (1-based), `size`
(max 100), `sorting_fields` and `direction` (`ASC` | `DESC`) and answers `{ data, totalResultNumber, currentPage }`.
Text filters are case-insensitive "contains"; id filters take a comma-separated list.

The catalogue (categories, series, funkos, images) is shared; collections, items and tags belong to one user
(`docs/adr/0001-shared-catalogue-own-collections.md`). Every collection, item and tag route, the funko filters and
search that look at collections or tags, the `collections` on a funko, suggestions, stats and exports see only the
signed-in user's own; another user's collection, item or tag id answers 404. An item takes only the user's own tags:
`tagIds` naming another user's tag (or one that does not exist) answers 404. A database trigger gives every new user
their own "Owned" (the default) and "Wishlist", whatever code makes the user. The `tags_per_user` migration gave the
tags already there to the first user; another user whose items carried one got their own copy of it.

**Submissions.** An admin's new funko, category or series is `APPROVED` at once. A member's is `WAITING`, with
`submitted_by_id` set, and only that member sees it (`lib/catalogueVisibility.ts`): the catalogue a user browses
(lists, search, suggestions, counts, the barcode lookup, adding to a collection) is the approved rows plus their own
waiting ones; by id they also open their own rejected or merged ones, and the export carries those too, so their
items still name their funko. An admin opens any submission by id, and lists them on the review list, never in the
catalogue lists. While it waits, the member can put it in their own collections, edit it, add or change its images
and delete it. A funko may use the approved categories and series, and a waiting or rejected one also its sender's
own waiting ones (400 otherwise). The
unique rules (barcode, identity, category and series names) hold in the approved catalogue and within one member's
waiting ones, never across them (partial unique indexes in the `submissions` migration): two members may wait on
the same box, and an admin may add one a member waits on. A member's funko, category or series that the catalogue
already has answers 409 with its `existingId`. `GET /submissions` lists what the signed-in user sent in, whatever
became of it. An admin opening a submission by id also gets `submittedBy` (`{ id, name }`, or null for a removed
user). Deleting a user (`DELETE /users/:userId`, or any other code) runs a trigger from the migration: their
rejected submissions go, with any item of them; their never-approved categories and series that no funko uses go;
everything else they sent in stays with `submitted_by_id` cleared, so a waiting one waits on for an admin (an
orphan submission, `docs/GLOSSARY.md`). Orphan submissions are in no member's scope: the partial unique indexes treat each null sender as distinct, so they
never clash with each other or block a new submission. Image files of deleted rows stay until `yarn images:prune`.
A submission's image files under `/uploads` follow the same rule as the funko: until it is approved only admins and
its sender load them (whoever uploaded each photo); others, and everyone but admins for an orphan submission, get 404 (the
uploads plugin's hook, `assertCanSeeImageFiles()`).

**Reviewing.** `GET /submissions/review?state=WAITING` (admins) lists every waiting submission, oldest first, with
`submittedBy` (null for a removed user) and `possibleDoubles`: every other approved or waiting funko with the same
barcode, or the same number in a category of the same name (any case), each with `isChase`, `exclusive` (so look-alikes read apart) and `matchedOn` (`BARCODE`,
`NUMBER_AND_CATEGORY`). `state=DONE` lists the reviewed ones (approved, rejected, merged), last reviewed first; an
admin's own funkos are never on it. `POST /submissions/:id/approval` puts a waiting funko in everyone's catalogue
with its sender's waiting category and series; when the catalogue meanwhile got a category or series of the same
name, the funko moves to that one and the member's waiting one goes once nothing uses it. It answers 409 with
`existingId` when the catalogue already has the same funko or barcode (and 409 in words if a unique index refuses
it in a race, by SQLSTATE 23505), and 409 when the funko is not waiting. `POST /submissions/:id/rejection` takes
`{ reason }` (1–500 characters, required; a check in the `submission_reviews` migration) that the sender reads on
`GET /submissions` and the funko page; the funko stays in their collections, private. Rejecting an orphan
submission deletes it instead (204), as the trigger deletes a removed user's rejected ones: with any items, and the
never-approved category and series no funko uses any more; its image files stay for `yarn images:prune`. The
sender can then edit it
(images too), delete it, or `POST /submissions/:id/resubmission` to make it wait again without the reason (409 when
it is not rejected, or clashes with their other waiting ones or the catalogue). `POST /submissions/:id/merge` takes
`{ targetFunkoId }`, a funko in the catalogue (400 when it is not approved, does not exist or is the submission
itself; 409 when the submission is not waiting): every item of the submission moves onto that funko, in one
transaction. When the same collection already holds the target, the two items become one: the older item stays,
the quantities add up, the notes are joined (older first, each once) and it carries both items' tags; its other
fields (condition, price, date) stay its own. The joined item keeps to the item limits, so the member can still edit
it: at most 1000 (`MAX_QUANTITY`) and 20 tags (`MAX_TAGS_PER_ITEM`), the older item's tags first and the newer one's
extras dropped. The admin also picks what the catalogue funko keeps (issue #39), all in the same transaction:
`fieldsFromSubmission` lists the fields it takes from the submission (`NAME`, `NUMBER`, `TYPE`, `CATEGORY`,
`SERIES`, `CHASE`, `EXCLUSIVE`, `BARCODE`; each once, and only one that differs, else 400; left out, it keeps all of
its own). A picked waiting category or series joins the catalogue as approval brings it in (onto the approved one of
the same name, which is also what "differs" compares with). A picked barcode another catalogue funko has, or picks
that make it the same as another catalogue funko, answer 409 in words with `existingId` (and a clash that slips in
meanwhile is a 409 too). `imageIdsFromSubmission` moves those submission images onto it, after its own, keeping their
uploader (their files move into its folder, so everyone sees them); `removedImageIds` removes its own images, like a
normal image delete. An image of neither funko is a 400, and so is ending up with more than `MAX_IMAGES_PER_FUNKO`;
a picked image that is the very same picture as one it keeps stays with the submission. The submission becomes
`MERGED` with `mergedInto`, still private to its sender and admins, and keeps its own fields, category, series and
the images not picked, as the record of what was sent. An orphan submission merges the same way, with nobody to
tell. When an admin changes someone's
waiting or rejected submission (its fields, or adds or removes a photo; reordering and rotating don't count),
`changedByAdminAt` records it for the sender; sending it again clears it. A read-only user gets 403 `READ_ONLY` on
approving, rejecting, merging and sending again, like every other write. A submission
carries `reviewedAt`, `rejectionReason`, `changedByAdminAt` and `mergedInto` (`{ id, name }` or null) on both lists;
`GET /funkos/:id` adds the last three for admins and the sender only.

**Notifications.** Approving, rejecting or merging a submission tells its sender (`SUBMISSION_APPROVED`,
`SUBMISSION_REJECTED` with the reason, `SUBMISSION_MERGED` naming the catalogue funko it went into); an orphan
submission has nobody to tell. A member's new submission (`POST /funkos`) and one sent again tell every admin, read-only ones included (`SUBMISSION_SENT`,
`SUBMISSION_RESENT`). Each row names its funko (`funkoId`, null once the funko is deleted) and keeps the funko's name
as it was. A user reads and marks only their own: another user's id answers 404. Kept 90 days, with no scheduler:
reads leave older rows out, and every new notification deletes everyone's older ones in the same transaction. The
notification is written right after the approve, reject, merge or send, not in its transaction: one that fails to
write is logged and dropped, so the change it reports still answers as the success it is. A forced delete of a funko
other users have tells every user who had it (the admin too, if they had it) with the admin's reason
(`FUNKO_REMOVED`, `funkoId` null since the funko is gone, the name kept). No email, no push.

| Method and path                                                    | What                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /health`, `GET /ready`                                        | Liveness, readiness (database reachable)                                                                                                                                                                                                                                                                                                                                                                           |
| `GET /categories`                                                  | List; `name`; sort `NAME` \| `CREATION_DATE`                                                                                                                                                                                                                                                                                                                                                                       |
| `GET /categories/:id`                                              |                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `POST /categories`                                                 | `{ name }`; a member's waits with their submission; 409 with `existingId` when the name is taken                                                                                                                                                                                                                                                                                                                   |
| `PATCH /categories/:id`                                            |                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `DELETE /categories/:id`                                           | 409 while funkos still use it                                                                                                                                                                                                                                                                                                                                                                                      |
| `GET /series`                                                      | List with funko counts; `name`; sort `NAME` \| `CREATION_DATE`                                                                                                                                                                                                                                                                                                                                                     |
| `GET /series/:id`                                                  |                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `POST /series`                                                     | `{ name }`; a member's waits with their submission; 409 with `existingId` when the name is taken                                                                                                                                                                                                                                                                                                                   |
| `PATCH /series/:id`                                                |                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `DELETE /series/:id`                                               | 409 in words while funkos (submissions too) still use it: every funko has a series                                                                                                                                                                                                                                                                                                                                 |
| `GET /funkos`                                                      | List and search: `q` searches every field; named params narrow one (below)                                                                                                                                                                                                                                                                                                                                         |
| `GET /funkos/by-barcode/:barcode`                                  | For a phone scanner                                                                                                                                                                                                                                                                                                                                                                                                |
| `GET /funkos/:id`                                                  | With all its images                                                                                                                                                                                                                                                                                                                                                                                                |
| `POST /funkos`                                                     | An admin's joins the catalogue, a member's is a waiting submission; 409 with `existingId` when the same funko or barcode already exists                                                                                                                                                                                                                                                                            |
| `PATCH /funkos/:id`                                                | A member: only their own waiting or rejected submission (images too); an admin changing one notes `changedByAdminAt`                                                                                                                                                                                                                                                                                               |
| `DELETE /funkos/:id`                                               | 409 `IN_COLLECTIONS` with `userCount` (how many users have it) while it sits in anyone's collection, naming only your own collections and the others as a number, never whose; `?force=true` removes it from all, and needs `{ reason }` in the body (400 without) when other users have it: each user who had it gets a `FUNKO_REMOVED` notification with it. `GET /funkos/:id` gives admins the same `userCount` |
| `POST /funkos/:id/images`                                          | Multipart, field `file` (several allowed); makes the three sizes                                                                                                                                                                                                                                                                                                                                                   |
| `POST /funkos/:id/images/from-url`                                 | `{ url }`: downloads a public image and stores it                                                                                                                                                                                                                                                                                                                                                                  |
| `PATCH /funkos/:id/images/order`                                   | `{ imageIds }`: the first one is the primary                                                                                                                                                                                                                                                                                                                                                                       |
| `POST /funkos/:id/images/:imageId/rotate`                          | `{ degrees: 90 \| 180 \| 270 }` clockwise; the image gets new URLs                                                                                                                                                                                                                                                                                                                                                 |
| `DELETE /funkos/:id/images/:imageId`                               |                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `GET /collections`                                                 | List with counts and money spent; sort `NAME` \| `CREATION_DATE`                                                                                                                                                                                                                                                                                                                                                   |
| `GET /collections/:id`                                             |                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `POST /collections`                                                | `{ name, notes?, isDefault? }`                                                                                                                                                                                                                                                                                                                                                                                     |
| `PATCH /collections/:id`                                           | `isDefault: true` moves the default here                                                                                                                                                                                                                                                                                                                                                                           |
| `DELETE /collections/:id`                                          | Removes its items (never the funkos); 409 for the default one                                                                                                                                                                                                                                                                                                                                                      |
| `GET /collections/:id/items`                                       | Items of one collection (filters below)                                                                                                                                                                                                                                                                                                                                                                            |
| `GET /collections/:id/items/:itemId`                               |                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `POST /collections/:id/items`                                      | `{ funkoId, quantity?, condition?, purchasePriceCents?, purchaseCurrency?, purchasedAt?, notes?, tagIds? }`; 409 with `existingId` when already there                                                                                                                                                                                                                                                              |
| `PATCH /collections/:id/items/:itemId`                             | `tagIds` replaces the whole set                                                                                                                                                                                                                                                                                                                                                                                    |
| `POST /collections/:id/items/:itemId/move`                         | `{ toCollectionId }`: keeps tags, notes and purchase data                                                                                                                                                                                                                                                                                                                                                          |
| `DELETE /collections/:id/items/:itemId`                            |                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `GET /items`                                                       | Items across all collections; same filters plus `collectionId`                                                                                                                                                                                                                                                                                                                                                     |
| `GET /tags`                                                        | The user's own tags with item counts; `name`; sort `NAME` \| `CREATION_DATE`                                                                                                                                                                                                                                                                                                                                       |
| `GET /tags/:id`, `POST`, `PATCH`, `DELETE`                         | Delete only removes the label from items                                                                                                                                                                                                                                                                                                                                                                           |
| `GET /suggest?q=`                                                  | Search-bar suggestions: funkos, categories, series, collections, tags at once                                                                                                                                                                                                                                                                                                                                      |
| `GET /submissions`                                                 | What the signed-in user sent in, each with `status`, `rejectionReason`, `changedByAdminAt`, `mergedInto`; `status` narrows it; sort `CREATION_DATE` (default, newest first) / `NAME`                                                                                                                                                                                                                               |
| `GET /submissions/review`                                          | Admins: `state=WAITING` (default, oldest first, with `possibleDoubles`) or `DONE` (last reviewed first); each with `submittedBy`                                                                                                                                                                                                                                                                                   |
| `POST /submissions/:id/approval`                                   | Admins: the waiting funko (and its new category and series) joins the catalogue; 409 with `existingId` when the catalogue has the same funko or barcode                                                                                                                                                                                                                                                            |
| `POST /submissions/:id/rejection`                                  | Admins: `{ reason }` (1–500 characters) the sender reads; the funko stays in their collections, private; an orphan submission is deleted (204)                                                                                                                                                                                                                                                                     |
| `POST /submissions/:id/merge`                                      | Admins: `{ targetFunkoId, fieldsFromSubmission?, imageIdsFromSubmission?, removedImageIds? }` (a catalogue funko, and what it keeps); the sender's items move there, a clash in one collection becomes one item; 409 when not waiting or a picked barcode / identity clashes with the catalogue                                                                                                                    |
| `POST /submissions/:id/resubmission`                               | The sender: a rejected one waits again; 409 when it is not rejected or clashes                                                                                                                                                                                                                                                                                                                                     |
| `GET /notifications`                                               | The signed-in user's own from the last 90 days, newest first, each with `kind`, `funkoId`, `funkoName`, `reason`, `isRead`; `page`, `size`                                                                                                                                                                                                                                                                         |
| `GET /notifications/unread-count`                                  | `{ count }`: the bell's number                                                                                                                                                                                                                                                                                                                                                                                     |
| `PATCH /notifications/:notificationId`                             | `{ isRead: true }`: opening one marks it read; 404 for another user's or one past 90 days; allowed when read-only                                                                                                                                                                                                                                                                                                  |
| `PATCH /notifications`                                             | `{ isRead: true }`: mark all read (204); allowed when read-only                                                                                                                                                                                                                                                                                                                                                    |
| `GET /stats`                                                       | Totals for the home page, for the signed-in user only: the funkos in their collections (count, categories, images and bytes, per category), and each of their collections                                                                                                                                                                                                                                          |
| `GET /images`                                                      | Every stored image (rows with their funko, uploader and upload time, plus loose files no row uses); `q`, `hasFunko`, sort `SIZE` (default, biggest first) / `CREATION_DATE` / `NAME`                                                                                                                                                                                                                               |
| `GET /images/groups`                                               | The same, one group per funko with its count and total size (loose files last); same params                                                                                                                                                                                                                                                                                                                        |
| `GET /export`                                                      | Everything as one JSON download: the whole catalogue and the signed-in user's own collections, tags, items and item tags (top-level `series`, `seriesId` on each funko)                                                                                                                                                                                                                                            |
| `GET /export/items.csv`                                            | One CSV line per item in the signed-in user's collections (`series` column after `category`)                                                                                                                                                                                                                                                                                                                       |
| `GET /export/funkos.{csv,json,xlsx}`                               | The funkos of one `categoryId`, `seriesId`, `collectionId`, `tagId` or `funkoId` (all funkos without one): CSV and spreadsheet one line per funko and item, JSON one entry per funko with its items; every format links each photo (`image_urls` / `imageUrls`), and a single funko's spreadsheet embeds its photos on a Photos sheet; named after the filter (`category-pop-marvel.xlsx`), 404 for an unknown id  |
| `GET /export/{categories,series,collections,tags}.{csv,json,xlsx}` | A whole list (names, counts, notes, totals); `?includeFunkos=true` adds their funkos: a second sheet, the CSV's lines (each once), or nested per entry in the JSON                                                                                                                                                                                                                                                 |
| `GET /export/images.{csv,json,xlsx}`                               | Every stored image: its funko, file, size, upload date and absolute links to the three sizes (never the files)                                                                                                                                                                                                                                                                                                     |
| `GET /users`                                                       | Admins only: every user with `role`, `isReadOnly` and `state` (`ACTIVE`, `TEMPORARY_PASSWORD`, `TEMPORARY_PASSWORD_EXPIRED`, `NO_SIGN_IN`) `temporaryPasswordExpiresAt` and `isLastAdmin`; sort `USERNAME` (default, users with none last) / `NAME` / `CREATION_DATE`                                                                                                                                              |
| `POST /users`                                                      | Admins only, recent sign-in: `{ username, role }`; 201 `{ user, temporaryPassword }` (the only time the password is sent); 409 when the username is taken                                                                                                                                                                                                                                                          |
| `PATCH /users/:userId`                                             | Admins only, recent sign-in: `{ role?, isReadOnly? }` (at least one); ends the user's sessions when either changes; 409 `LAST_ADMIN` for the last admin who is not read-only                                                                                                                                                                                                                                       |
| `POST /users/:userId/temporary-password`                           | Admins only, recent sign-in: `{ username? }` (only for a user who has none, and then needed); 200 `{ user, temporaryPassword }`; ends the user's sessions                                                                                                                                                                                                                                                          |
| `DELETE /users/:userId`                                            | Admins only, recent sign-in: the user with their sessions, passkeys, collections, items and tags; 409 `LAST_ADMIN` for the last admin                                                                                                                                                                                                                                                                              |
| `GET /uploads/...`                                                 | The image files (immutable, cached for a year); a submission's only for admins and its sender, 404 otherwise                                                                                                                                                                                                                                                                                                       |

`GET /funkos` filters: `q`, `name`, `number`, `barcode`, `exclusive`, `type`, `isChase`, `categoryId`, `category`,
`seriesId`, `series`, `tagId`, `tag`, `collectionId`, `collection`, `notInCollectionId`, `hasCollections`, `hasTags`, `hasImages`; sort
`RELEVANCE` (default with `q`), `NAME`, `NUMBER`, `CREATION_DATE`, `CATEGORY`, `SERIES`. Each hit carries `category`,
`series`, `matchedOn` (which fields the search
hit, `SERIES` among them), `collections` (where it sits, with quantity), `primaryImage`, `status` and
`isSubmittedByMe`. A funko body takes an
required `seriesId` (every funko has a series: left out or null answers 400 on a `POST`, null answers 400 on a
`PATCH`, which may only move it to another series; a missing series answers 400). `barcode` stays optional.

Item list filters: `name`, `funkoId`, `tagId`, `categoryId`, `seriesId`, `condition`, `purchasedFrom`, `purchasedTo`; sort
`NAME`, `NUMBER`, `CREATION_DATE`, `UPDATE_DATE`, `PURCHASE_DATE`, `PURCHASE_PRICE` (default `CREATION_DATE`).

### Errors

One envelope: `{ code, message, issues?, existingId? }`.

| Status | `code`                                                   | When                                                                                                         |
| ------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 400    | `VALIDATION_ERROR`                                       | Bad body or query; `issues` lists `{ path, message }`                                                        |
| 400    | `COMMON_PASSWORD`                                        | The new password is on the common-password list                                                              |
| 400    | `PASSWORD_REUSED`                                        | The new password is the temporary one it should replace                                                      |
| 400    | `USERNAME_REQUIRED`                                      | A new temporary password for a user with no username, and none given                                         |
| 401    | `UNAUTHORIZED`                                           | No valid session (any route but the public ones)                                                             |
| 401    | `SIGN_IN_FAILED`, `PASSKEY_FAILED`, `INVALID_SETUP_CODE` | A sign-in, passkey ceremony or setup code failed                                                             |
| 401    | `TEMPORARY_PASSWORD_EXPIRED`                             | The right temporary password, after its 7 days                                                               |
| 403    | `CROSS_SITE_REQUEST`, `REAUTH_REQUIRED`                  | A write from another site; a passkey, password or user change needs a recent sign-in                         |
| 403    | `ADMIN_ONLY`                                             | A member called an admin-only route, or changed a funko that is not their own waiting or rejected submission |
| 403    | `PASSWORD_CHANGE_REQUIRED`                               | Signed in with a temporary password: replace it first                                                        |
| 404    | `NOT_FOUND`                                              |                                                                                                              |
| 409    | `CONFLICT`                                               | Duplicate or still referenced; `existingId` points at the twin                                               |
| 409    | `ALREADY_SET_UP`, `NOT_SET_UP`, `LAST_PASSKEY`           | Setup done already / not yet; the only passkey                                                               |
| 409    | `LAST_ADMIN`                                             | The last admin can't be made a member or deleted                                                             |
| 413    | `PAYLOAD_TOO_LARGE`                                      | Image over `MAX_IMAGE_BYTES`                                                                                 |
| 429    |                                                          | Rate limit (600 requests a minute per client)                                                                |

## Images

`src/lib/imageStorage.ts` is the only file that imports `sharp` or touches the uploads folder. Each upload becomes
`data/uploads/funkos/<funkoId>/<uuid>.{lg,md,sm}.webp` (2000 / 1200 / 480 px long edge, EXIF orientation applied,
metadata stripped) plus a tiny blurred data URI kept in the database as `placeholder`. A response carries
`url` (large), `mediumUrl`, `smallUrl` under `/uploads/...`, plus `width`, `height`, `sizeBytes`, `position` and
`uploadedBy` (`{ id, name }`; the funko page shows it under each photo).
Every image records the user who uploaded it (`uploaded_by_id`) and when (`created_at`); the images that existed
before went to the first admin. Deleting that user keeps the image and clears its uploader, so `GET /images` and a funko's images show
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
                          pagination, ids, query params, image storage, remote fetch, barcode, password hashing,
                          who sees which catalogue rows (catalogueVisibility)
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
