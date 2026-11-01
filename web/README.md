# My Funko Collection — web

The React app: browse the catalog, open a funko with its photos, scan a box with the phone camera to add it, keep
collections (Owned, Wishlist, ...) and tag items with the box they live in. Phone-first, with a proper desktop
layout (sidebar, wide grid, tables, ⌘K search).

## Stack

| Area     | Tool                                                                            |
| -------- | ------------------------------------------------------------------------------- |
| UI       | React 19 with the React Compiler, Tailwind CSS 4, shadcn/ui on Base UI          |
| Build    | Vite 8                                                                          |
| Routing  | React Router 8, data mode (loaders and actions)                                 |
| Data     | axios, one Fastify API (`../api`)                                               |
| Forms    | react-hook-form + yup (`useFormCompat` under the compiler)                      |
| Scanner  | `barcode-detector` ponyfill (zxing-wasm, self-hosted from `public/wasm/`)       |
| Tables   | TanStack Table 9                                                                |
| Mocks    | MSW 3 (`msw/vite` plugin, `@msw/playwright` for E2E), in-memory store with seed |
| Tests    | Vitest 5 + Testing Library, Playwright for E2E                                  |
| Lint     | ESLint (flat, type-aware) + custom rules, Prettier                              |
| Packages | Yarn 4, release committed in `.yarn/releases`                                   |

## Getting started

```bash
corepack enable   # once per machine; Node 24 ships Corepack, it reads packageManager and runs the committed Yarn
yarn install
yarn dev          # http://localhost:5173/home, talks to the API on port 3000 (cd ../api && yarn dev)
```

Without the API, run against the browser mocks (the same seed the tests use):

```bash
VITE_USE_MOCKS=true yarn dev   # signed in as the mock user, Mario (an admin): what the tests see
yarn dev:mocks                 # signed in as leia, an admin with every notification kind
```

### Seeing every UI state

Each start command opens the mock app as one persona: a seeded user who shows one set of UI states. Signed out
(`yarn dev:signed-out`), the sign-in page offers the same people in its dev sign-in picker.

| Command                    | Signed in as                        | Shows                                                                                                                                    |
| -------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `yarn dev:mocks`           | `leia`, an admin                    | Every notification kind, read and unread; the review list with every status; the remove dialog of a funko other users have (Darth Vader) |
| `yarn dev:member`          | `rey`, a member                     | Her submissions waiting, sent again, rejected, rejected then changed by an admin, merged and approved; every member notification         |
| `yarn dev:read-only`       | `poe`, a read-only member           | Every write control disabled with its reason                                                                                             |
| `yarn dev:read-only-admin` | `lando`, a read-only admin          | The same, on the admin pages                                                                                                             |
| `yarn dev:new-user`        | `finn`, with a temporary password   | Opens on `/set-password`                                                                                                                 |
| `yarn dev:last-admin`      | `leia`, every other admin read-only | The Users page's locked controls, with the reason                                                                                        |
| `yarn dev:signed-out`      | nobody                              | The sign-in page, with the dev sign-in picker                                                                                            |
| `yarn dev:setup`           | nobody, before the first run        | The first-run page (`/setup?code=funko-first-run`)                                                                                       |

A `yarn db:seed` local API has the same users (`api/README.md`, "Seeded users"), all with the dev password
`funko-dev-password-123`. The mock store lives in the page: a reload starts again as the command's persona.

**Dev sign-in picker.** Only in `yarn dev` (both modes), the sign-in page says "Development mode" and whether it
uses mock data or the real local API, and offers a "Sign in as…" select (`username - Role (read-only)`). Picking
one fills the normal username and password form with the dev password and submits it: the real password route on
the API, the mock one in mock mode. There is no way around signing in, and the password route's rate limit (5 a
minute) still applies. Both live in `pages/Login/components/` under `import.meta.env.DEV`, so a build drops them;
`scripts/checkProductionBundle.ts` runs after every `yarn build` and fails it if `dist/` still holds the banner,
the picker or the dev password.

The dev server proxies `/api` (prefix stripped) and `/uploads` to `http://localhost:3000`, the same shape Caddy
gives the app in production, so `VITE_BASE_API_URL` is always `/api`.

Node version: see `.node-version` (fnm reads it).

## Scripts

| Script               | Does                                                                 |
| -------------------- | -------------------------------------------------------------------- |
| `yarn dev`           | Starts the dev server (copies the scanner's `.wasm` first)           |
| `yarn build`         | Copies the `.wasm`, type-checks, builds, checks `dist/` (see below)  |
| `yarn build:demo`    | The public demo: mock data in the browser, a demo banner, `404.html` |
| `yarn dev:big`       | Mock mode with 300 extra generated funkos, to try long lists         |
| `yarn dev:<persona>` | Mock mode signed in as a persona ("Seeing every UI state" above)     |
| `yarn preview`       | Serves the built app                                                 |
| `yarn lint`          | Runs ESLint and the Prettier check                                   |
| `yarn format`        | Formats every file with Prettier                                     |
| `yarn test`          | Runs the unit and component tests once                               |
| `yarn test:watch`    | Runs them in watch mode                                              |
| `yarn test:coverage` | Runs them with a coverage report                                     |
| `yarn test-e2e`      | Type-checks `e2e/`, then runs Playwright against the mocked app      |
| `yarn icons`         | Regenerates the PWA icons in `public/icons/` from the SVG            |
| `yarn wasm:copy`     | Copies zxing-wasm from `node_modules` to `public/wasm/` (gitignored) |

## Environment

Set in `.env` (all modes) and `.env.development` (dev only). Values are read at build time.

| Variable                 | Meaning                                                             |
| ------------------------ | ------------------------------------------------------------------- |
| `VITE_PROJECT_PATH`      | Base path the app is served from (`/` by default)                   |
| `VITE_BASE_API_URL`      | Base URL for every API call: `/api`, same origin, proxied by Caddy  |
| `VITE_USE_MOCKS`         | `true` starts MSW in the browser (off by default; on for mock mode) |
| `VITE_PLAYWRIGHT`        | `true` under Playwright, which brings its own mocks                 |
| `VITE_DEMO`              | `true` in the demo build: shows the "changes are not saved" banner  |
| `VITE_MOCK_EXTRA_FUNKOS` | Mock mode only: generated funkos added to the seed (`dev:big`)      |
| `VITE_MOCK_AUTH_STATE`   | Mock mode only: start `signedOut` or `setup` instead of signed in   |
| `VITE_MOCK_PERSONA`      | Mock mode only: start as a persona (`member`, `read-only`...)       |

**Demo on GitHub Pages.** `.github/workflows/pages.yml` builds `yarn build:demo` with
`VITE_PROJECT_PATH=/<repo>/` and publishes `dist/`. It runs by hand only (Actions tab), once the repo's Pages
source is set to "GitHub Actions". `404.html` is a copy of `index.html`, so a deep link or a refresh still opens
the app.

## Folder structure

```
src/
  application/
    layout/               AppShell (bottom nav + FAB on phones, sidebar on desktop), ⌘K palette, theme
    routes/               route table, path constants (routesUtils.ts), one file per feature
  common/
    api/services/         one folder per API service (+ yup schemas + wire-name tests)
    components/           shared components; components/ui/ is vendored shadcn (do not hand-edit)
    hookUtils/            shared hooks (useListParams, useFormCompat, useActionToast, useAddDestination, ...)
    utils/                shared helpers and yup rules
  mocks/                  MSW handlers and an in-memory store that mirrors the API seed
  pages/                  one folder per page, with its loader, actions and routed dialogs/sheets
  types/
    models/               API models (`*ApiModel`)
    utility/              shared types and value sets (`*Util`)
e2e/                      Playwright config, fixtures, page objects, tests
public/                   manifest, icons, the scanner's wasm (copied at dev/build time)
scripts/                  icon generation, wasm copy
```

Aliases: `@api`, `@services`, `@application`, `@app-types`, `@utils`, `@pages`, `@components`, `@hooks`, `@mocks`, `@test-utils`.

## Pages

| Path                                     | What                                                                                                                                                                                                                             |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/home`                                  | Your stats (the funkos in your collections), recent funkos, your collections, by category, quick actions                                                                                                                         |
| `/funkos`, `/funkos/:id`                 | The catalog: grid or table, search + filters + sort, detail with gallery (who uploaded the image on show, under it)                                                                                                              |
| `/add`, `/add/manual`                    | Scan-first add page: images, details, a card per collection (own copy)                                                                                                                                                           |
| `/collections`, `/collections/:id`       | Your lists and their items (table on desktop, cards on phones)                                                                                                                                                                   |
| `/items`                                 | Every item across collections (filter by tag to find a box); its grid cards show the collection as a tag on the photo, then number + name, series, chase and exclusive                                                           |
| `/search`                                | The phone's search tab; on desktop press ⌘K / Ctrl+K anywhere                                                                                                                                                                    |
| `/categories`, `/tags`, `/settings`      | Manage pages (tags are your own), theme, default collection, "Adding to" defaults, exports                                                                                                                                       |
| `/submissions`                           | Members only (in the normal sidebar): the funkos you sent in, each with its state as a chip in words, why one was rejected (Send again), what it was merged into and whether an admin changed it                                 |
| `/submissions/review`                    | Admin group, admins only: every member's submissions, Waiting (Approve, Merge into a catalogue funko, Reject with a reason, "Maybe a double") and Done tabs (`?state=DONE`)                                                      |
| `/submissions/review/:funkoId/merge`     | Admins only, a dialog over the review page: pick the catalogue funko a submission is the same as, then (`?into=<id>`) pick side by side what that funko keeps                                                                    |
| `/notifications`                         | Everyone (a sidebar item on desktop, the bell in the phone header, with the unread count): your notifications, newest first; opening one marks it read and goes to the funko, your submissions or the review list; Mark all read |
| `/users`, `/users/add`, `/users/:userId` | Admin group, admins only: every user with role (and read-only) and state; New user shows the temporary password once; Manage changes a role, makes read-only or undoes it, gives a new temporary password or deletes             |
| `/images`                                | Admin group, admins only: every stored image, loose files included, with who uploaded it and when                                                                                                                                |
| `/settings` → Security                   | Passkeys (add, remove), sign out, sign out everywhere                                                                                                                                                                            |
| `/login`                                 | Sign in with a passkey (outside the app shell); `?redirectTo=` returns                                                                                                                                                           |
| `/setup?code=...`                        | First run: your name and the first passkey, from the link in the log                                                                                                                                                             |
| `/set-password`                          | Outside the shell: a user signed in with a temporary password chooses their own before anything else                                                                                                                             |

## How data flows

1. **Service** (`common/api/services/<name>Service/`) calls the API with axios. A read returns the data and throws
   on failure; a write goes through `axiosActions` and returns `{ success, data?, error? }`, never throwing.
2. **Loader** (`pages/<Page>/<page>Loader.ts`) reads the URL and calls the services before the page renders.
3. **Page** reads the loader's data with `useLoaderData()`. List state (search, filters, sort, page) lives in the URL
   through `useListParams`.
4. **Every write is a route action** submitted with `useFetcher`: forms, deletes, toggles, uploads. The action
   validates against the service's yup schema, then the router reloads the loaders. Safe writes end in a toast with
   Undo (`useActionToast`); errors show inline next to the form.
5. **Routed dialogs and sheets** (edit funko, add/edit item, add/edit collection) are child routes with their own
   loader and action; closing navigates back.

## Signing in

Each user, with a passkey (`@simplewebauthn/browser`) or a username and password; the API keeps the session in an
HttpOnly cookie the app never sees.

- **Gate.** The app shell's loader (`AppShell/appShellLoader.ts`) asks `GET /auth/status` once, when the shell
  mounts: `setup` → `/setup`, `signedOut` → `/login?redirectTo=<where you were>`, `signedIn` → the app, with the
  user's name, username and role for `useSignedInUser()` / `useIsAdmin()`. Its `shouldRevalidate` is off (no status call per navigation),
  except after saving a password, which sets the username.
- **Roles.** Only an admin changes the catalogue. For a member `useIsAdmin()` hides rename / delete on Categories
  and Series (read-only, Export stays). The sidebar's Admin group (below a divider; and the phone menu's) holds Users and Images,
  admins only, and the admins' Submissions review. A member who opens `/images`, `/users` or `/submissions/review`
  gets the "This page is for admins" error page (`assertAdmin()` in those loaders).
- **Read-only.** An admin can make a user read-only (`isReadOnly` on the signed-in user and on each user). Every write
  control then shows disabled with the reason "Your account is read-only…" (`useReadOnlyReason()` +
  `DisabledReason`: hover, keyboard focus, tap, and the control's description); `LinkButton`'s `disabledReason` and
  the `AddFab` turn the "New ..." / Scan links into disabled buttons. Reads, Export, their own password and passkeys
  and signing out stay. Pages made only for writing (Add, Edit funko, the collection and item dialogs, New user) call
  `assertCanWrite()` in their loader, so their URL shows the "Your account is read-only" error page. If the API
  refuses a write with 403 `READ_ONLY` (made read-only while the app was open), `authMiddleware` forgets the cached
  user and the shell asks again.
- **Submissions.** Everyone gets the Add form and the New funko buttons: an admin's funko joins the catalogue, a
  member's is a waiting submission only they see (`status`, `isSubmittedByMe` on a funko). The form and the saved
  card say so; a category or series the member types in with the "+" waits too and reads "(waiting for review)" in
  the dropdown. `useCanEditFunko()` (`pages/FunkoDetail/funkoAccessUtils.ts`, the API's rule) shows Edit, Delete and the image
  controls to an admin, and to a member on their own waiting or rejected submission, whose page also shows its chip
  (and, once rejected, why); `assertCanEditFunko()` guards the edit route the same way. Members find what they sent
  in under _Submissions_ (`/submissions`, `GET /submissions`), with a Waiting / Approved / Rejected / Merged chip, the
  rejection reason, "Merged into" with a link to the catalogue funko, "An admin changed this submission."
  (`SubmissionReviewNotes`, also on the funko page and the Done tab) and Send again on a rejected one.
- **Reviewing submissions.** Admins review on _Submissions_ in the Admin group (`/submissions/review`, Waiting and
  Done tabs as `?state=`). A waiting row says who sent it ("Removed user" for a deleted member), flags "Maybe a
  double" with links to the other funkos (same barcode, or same number and category), and has Approve, "This is a
  double of…" (every waiting row), Merge (only when a maybe-double is in the catalogue) and Reject;
  the funko's name opens its page, where an admin can fix it first (the sender is then told). Reject asks for a
  reason in a dialog (for an orphan submission it says rejecting deletes it). Merge is a routed dialog
  (`MergeSubmissionDialog`, `/submissions/review/:funkoId/merge`, its own loader and action) with two steps, one
  flow for both ways in (`detectedMergeLinkOf`): with exactly one catalogue maybe-double, Merge opens straight on
  the side-by-side step (`?into=<id>`); with several, or by hand with "This is a double of…", it opens on the pick
  step,
  which lists the catalogue maybe-doubles first (the first one picked; each labelled by `funkoLabelOf`, so "#78
  Thanos (Chase)" never reads like the regular one) and searches the catalogue (`useMergeTargets`, reusing the
  `useSuggestions` type-ahead, so no new read outside a loader); a picked search result stays listed while the admin
  searches again, Enter in the search never submits, and Next puts the pick in the URL (Back returns). The
  side-by-side step (issue #39) shows each field that differs as a radio group named after the field, "Original entry"
  (picked to start with) or "Submission"; fields that are the same show once under "Same on both". Category and
  series compare by name, as the API brings a waiting one onto the approved one of that name. A submission barcode
  another catalogue funko holds is offered disabled, saying whose it is (the loader looks it up with
  `GET /funkos?barcode=`). Images are checkboxes ("Original entry image 1", "Submission image 1"): the original entry's ticked,
  the submission's not; "Pick another funko" goes back. A refusal shows in the dialog in the API's words; success
  toasts and closes. A read-only admin sees Approve, "This is a double of…", Merge and Reject disabled with the
  reason (and opening the dialog's URL shows the read-only page), and a read-only member Send again. One `useReviewActions()` fetcher owns approve and reject, so the toast and a refusal (the catalogue
  already has the funko or barcode, with a link to it) outlive the row that leaves the tab.
- **Notifications.** The sidebar's Notifications item on desktop (`SidebarNotificationsEntry`, after the four
  destinations) and the bell in the phone header (`NotificationBell`) link to `/notifications` and carry the unread
  count (`UnreadBadge`), in their name too ("Notifications, 2 unread", `describeNotificationsLink`). The count comes from
  the app shell's loader as a promise it never waits for (`UnreadCountAwait`; a failed count only hides the number),
  and the shell's `shouldRevalidate` re-runs it after every write and on every move to another page (not on search
  param changes): no poll, so a notification that arrives while the user stays on one page shows at their next
  click. One polite live region (`NotificationAnnouncer`) says the count when it goes up, never on the first load
  or on every reload. On the page, each notification's title links to what it is about (an approval: the funko; a
  rejection, with its reason: _Submissions_; a merge: the catalogue funko it went into; a new or resent submission:
  the review list) and marks it read as it
  opens: a plain click on an unread one submits to the mark-read action, which redirects to the link's target from
  the API's answer, so the count reloads after the write (a middle click or "open in new tab" just follows the link
  and leaves it unread); one whose funko was deleted gets _Mark read_ instead, as does a "removed from the
  catalogue" one (`FUNKO_REMOVED`, with the admin's reason). Unread ones say
  "New" in words. _Mark all read_ is open to a read-only user (it only touches their own notifications) and is
  disabled, with the reason, once nothing is unread.
- **New users.** An admin creates one on _Users_ → _New user_ (`/users/add`, a routed dialog): a username and a
  role. It needs a recent sign-in (the same "confirm it's you" step as Settings), and the answer's temporary
  password is shown once with a Copy button; nothing keeps it. Signed in with it, the user's status carries
  `mustChangePassword`: `signedInUserMiddleware` sends every app page to `/set-password`, and `authMiddleware` does
  the same for any 403 `PASSWORD_CHANGE_REQUIRED`. That page (outside the shell) saves the new password under the
  username the admin gave, or signs out; saving opens Home. Past the 10 minutes of a recent sign-in, the page asks
  for the temporary password right there (`useConfirmIdentityStep` with `isPasswordOnly`, no passkey); an expired one
  says to sign out and ask an admin.
- **Managing users.** Each row's _Manage_ link opens `/users/:userId` (a routed dialog over the list, its own page on
  phones; the user comes from the list's loader, `USER_LIST_ROUTE_ID`): _Make admin_ / _Make member_, _Make read-only_
  / _Allow changes_ (the row's role then reads "Member, read-only"), _New temporary
  password_ (asks for a username when the user has none; the password is shown once, like New user) and _Delete user_.
  Each confirms in an alert dialog, needs a recent sign-in (the shared "confirm it's you" step), and ends that
  user's sessions. The last admin who can make changes (`isLastAdmin` from the API) keeps _Make member_, _Make read-only_
  and _Delete user_ disabled, saying why; a read-only admin sees all four disabled (`DisabledReason`: hover, keyboard focus, tap, and the button's description). Changing or deleting yourself
  signs you out: the list reload answers 401 and `authMiddleware` goes to the login page.
- **Lost session.** The root route's `authMiddleware` lets every loader and action run, then turns any 401
  `UNAUTHORIZED` (a thrown read or an action's envelope) into a redirect to the login page, remembering the page.
  `redirectTo` is checked (`safeRedirectPath`): only a path inside the app.
- **Ceremonies run in route actions.** A click submits to an action through `useFetcher`; the action gets the
  options from the API, runs the browser prompt (`@utils/passkeyUtils`) and sends the result back, then redirects.
  A closed prompt comes back as a `PASSKEY_CANCELLED` failure with friendly copy, never the raw error.
- **Password.** The login page has a username + password form next to the passkey button; both submit to the one
  login action with an `intent`. The fields carry `autocomplete` (`username`, `current-password`, `new-password` in
  Settings) so password managers fill them, and paste works. _Settings → Security → Password_ sets or changes it;
  15+ characters is checked here, the common-password list only by the API (shown on the field).
- **Confirm it's you.** Adding or removing a passkey, saving a password, or creating or changing a user needs a recent sign-in (10 minutes). On a 403
  `REAUTH_REQUIRED` the dialog switches to "Confirm it's you" (`useConfirmIdentityStep`): "Confirm with passkey"
  always, and for a user with a password (a username) a "Your current password" field and "Confirm with password"
  next to it (`ConfirmPasswordField`, `ConfirmIdentityButtons`). The dialog submits again with `reauth` (the method,
  and the password typed), and the action confirms first (a passkey sign-in, or `POST /auth/recent-sign-in`), then
  retries (`withRecentSignIn` in `@api/recentSignIn`). A wrong password shows on its field.
- **Mocks.** `mockStore.auth` starts signed in as Mario (`auth.userId`, `MOCK_USER_ID`) with two passkeys, or as the
  persona `VITE_MOCK_PERSONA` names (`mockPersonas.ts`; `setMockPersona()` in tests); `setMockAuthState()` (tests) or
  `VITE_MOCK_AUTH_STATE` (dev) starts signed out or before setup. Without a session every mocked route answers 401,
  like the API. The mocks accept any well-formed ceremony response; the first-run code is `funko-first-run`. Mario
  has no password until one is set (the mock store keeps it as typed); `isSignInRecent = false` makes the next
  passkey, password or user change ask "confirm it's you", and confirming with the password checks that copy. Mario is an admin; `setMockUserRole()`
  (tests) makes him a member, and `requireAdmin.mock.handler.ts` then answers 403 `ADMIN_ONLY` on the admin-only
  routes, like the API. Funkos, categories and series carry `status` and `submittedById` in the store: a member's
  new one is a waiting submission, and the handlers show other members' waiting ones to nobody and let a member
  change only their own (`mockCatalogueUtils.ts`, `findEditableFunko`), like the API. `addMockSubmission()` (tests)
  puts one in, the signed-in user's unless `submittedById` names another member (null: a removed user's); a
  rejected one carries a reason, a merged one its `mergedIntoId`. The seed (`mockSeed.ts`) adds four of other
  members' after everything else, so the review page has something: luke's waiting "Thanos (Infinity Gauntlet)"
  (maybe a double of #78), han's waiting "Mandalorian with Grogu" (each with one photo its sender uploaded, so a
  merge has an image to pick), luke's rejected "Bluey" and han's "Baby Yoda",
  merged into Grogu, with the notifications they sent (each admin heard of all four, the oldest and the merged one
  read; luke of his rejection, han of his merge), as in the api seed. The review handlers (`handlers/submission/`)
  approve (moving a waiting category or series into the catalogue), reject, merge (`mergeSubmission.mock.handler.ts`:
  the picked fields and images are checked and applied as the API does in `mergeChoicesMockUtils.ts`, all but the
  same-picture rule, as the store keeps no picture hashes; the items move, a clash in one collection becomes one
  item) and resend like the API, and an admin's change to
  someone's submission (fields, or a photo added or removed) sets `changedByAdminAt` (`recordMockAdminChange`);
  sending it again clears it, and rejecting an orphan submission deletes it, as on the API. Approving, rejecting,
  merging, sending again and a member's new funko write notifications into `mockStore.notifications`
  (`handlers/notification/notificationMockUtils.ts`); the handlers answer only Mario's own, and
  `addMockNotification()` (tests) adds one for him. The api seed has the same
  four submissions. Of other users' items the store keeps only who has which funko (`mockStore.otherUsersItems`:
  luke and han have Grogu, luke Darth Vader), for the count an admin sees: deleting one of those as an admin opens
  the remove dialog, which asks why, and the delete handler tells every user who had it (`notifyMockFunkoRemoved`),
  as on the API; han's seed notification says "Boba Fett (Prototype)" was removed. Deleting a user in the mocks settles their submissions as the API's trigger does (rejected ones
  go, the rest lose their sender), and an admin opening a submission sees "Sent in by ..." or "Removed user"
  (`@utils/removedUserUtils`, shared with the Images page). `mockStore.users` holds the other users (`mockUsers.ts`: leia, an admin; luke, with the
  temporary password `MOCK_TEMPORARY_PASSWORD`; han, whose one expired): `GET /users` lists them after the
  signed-in user (`isLastAdmin` worked out from every row), `POST /users` adds one with a made-up temporary password,
  `PATCH|DELETE /users/:userId` and `POST /users/:userId/temporary-password` change them like the API (a change to
  Mario signs this browser out), and a password sign-in as one of them makes the browser theirs: `auth.userId` becomes theirs, so their own
  submissions and notifications are the ones answered (the collections, items and tags stay the same), and the user
  who left goes back into `mockStore.users`. The personas (rey, poe, lando, finn, and leia) sign in with the dev
  password, which the mocks hold only when `import.meta.env.DEV` is true (or absent, under Playwright): never in a
  build. The seed also gives rey a submission in every state, adds the orphan "Totoro", and gives leia, lando and
  rey every notification kind, read and unread (older than the four submissions' ones, which Mario keeps alone). `setMockMustChangePassword()` (tests) starts signed in with a temporary password;
  `requirePasswordChange.mock.handler.ts` then answers 403 `PASSWORD_CHANGE_REQUIRED` like the API. `setMockReadOnly()`
  (tests; `test.use({ isReadOnly: true })` in Playwright) makes Mario read-only, and `requireWriteAccess.mock.handler.ts`
  then answers 403 `READ_ONLY` on every write but his own password, passkeys, signing out and marking his notifications read. `renderRoutes` (`@test-utils`) wraps the pages in a stand-in shell route that holds the
  mock user (`shellRoute()` for a table that needs it placed by hand). The store holds only Mario's own collections,
  items and tags, as the API sends them; an item write naming a tag that is not in it answers 404, like the API.
- **E2E.** `auth.e2e.test.ts` runs the real ceremonies against Chrome's virtual authenticator (the
  `virtualAuthenticator` fixture): first run, sign out, sign back in.

## Scanner and photos

- The scanner uses the `barcode-detector` ponyfill everywhere (Safari's native API is unreliable), reading a centred
  crop of the camera frame a few times a second; two agreeing frames count. UPC-A (12 digits) is normalised to
  EAN-13 (a leading zero) on both the app and the API, so a scan matches a typed code.
- The reader is zxing-wasm's `zxing_reader.wasm`, served from the app's own origin at `wasm/` (no CDN on a LAN).
  `scripts/copyWasm.ts` copies it from `node_modules` into `public/wasm/` (git-ignored) as the first step of
  `yarn dev` and `yarn build`, written into those scripts because Yarn 4 never runs `pre*` hooks; `yarn test-e2e`
  gets it through `yarn dev`. `scripts/checkProductionBundle.ts` fails the build when `dist/wasm/` lacks it, so the
  Docker image and the demo build always ship it.
- The camera needs a secure context: `localhost` in dev, HTTPS through Caddy in production (see the root README
  for trusting the certificate). Without it the scanner shows a manual-entry form only.
- Photos are resized on the device to a 2000 px long edge before upload; the API makes the three WebP sizes.

## Deployment

`Dockerfile` builds the app and serves `dist/` with Caddy (`Caddyfile`): HTTPS from a local CA, `/api/*` and
`/uploads/*` proxied to the `api` container. The root `compose.yaml` wires it up.

## Conventions enforced by the compiler and the linter

- `tsconfig.app.json` carries Vite's template flags: `erasableSyntaxOnly` (no `enum`, use `as const` value sets), `verbatimModuleSyntax` (`import type` for types), `noUncheckedSideEffectImports`.
- The React Compiler memoizes components; manual `useMemo` / `useCallback` are escape hatches and the `react-hooks` compiler rules lint them. react-hook-form goes through `useFormCompat` (`'use no memo'`).
- Route paths come from `routesUtils.ts`. A literal path in `navigate()`, `to` or `href` is an error.
- Colours are semantic tokens only (`bg-background`, `text-muted-foreground`, `bg-primary`): the palette lives in
  `src/index.css`. No `dark:` colour overrides, no raw hex in components.
- Every clickable control gets the hand cursor and a hover colour from one rule in `src/index.css` (base layer; an
  unlayered one for the vendored menu, select and combobox items, which set `cursor-default`). A control's own
  `cursor-*`, `bg-*` or `hover:bg-*` utility still wins, so give a new control its own hover look only when the
  muted background does not suit it.
- `src/common/components/ui/**` is vendored shadcn code (kebab-case files, several exports per file) and is the one
  folder exempt from the naming rules. Wrap it; do not restyle it in place.
- A file in `src/types/` that only exports types must end in `.type.ts`.
- E2E tests interact through page objects in `e2e/pages/`, never directly, and never use `waitForTimeout`.
- No snapshot tests.
