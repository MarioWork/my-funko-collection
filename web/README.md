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
VITE_USE_MOCKS=true yarn dev
```

The dev server proxies `/api` (prefix stripped) and `/uploads` to `http://localhost:3000`, the same shape Caddy
gives the app in production, so `VITE_BASE_API_URL` is always `/api`.

Node version: see `.node-version` (fnm reads it).

## Scripts

| Script               | Does                                                                 |
| -------------------- | -------------------------------------------------------------------- |
| `yarn dev`           | Starts the dev server (copies the scanner's `.wasm` first)           |
| `yarn build`         | Type-checks, then builds to `dist/`                                  |
| `yarn build:demo`    | The public demo: mock data in the browser, a demo banner, `404.html` |
| `yarn dev:big`       | Mock mode with 300 extra generated funkos, to try long lists         |
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

| Path                                | What                                                                                                     |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `/home`                             | Your stats (the funkos in your collections), recent funkos, your collections, by category, quick actions |
| `/funkos`, `/funkos/:id`            | The catalog: grid or table, search + filters + sort, detail with gallery                                 |
| `/add`, `/add/manual`               | Scan-first add page: images, details, a card per collection (own copy)                                   |
| `/collections`, `/collections/:id`  | Your lists and their items (table on desktop, cards on phones)                                           |
| `/items`                            | Every item across collections (filter by tag to find a box)                                              |
| `/search`                           | The phone's search tab; on desktop press ⌘K / Ctrl+K anywhere                                            |
| `/categories`, `/tags`, `/settings` | Manage pages, theme, default collection, "Adding to" defaults, exports                                   |
| `/settings` → Security              | Passkeys (add, remove), sign out, sign out everywhere                                                    |
| `/login`                            | Sign in with a passkey (outside the app shell); `?redirectTo=` returns                                   |
| `/setup?code=...`                   | First run: your name and the first passkey, from the link in the log                                     |

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

One user, with a passkey (`@simplewebauthn/browser`) or a username and password; the API keeps the session in an
HttpOnly cookie the app never sees.

- **Gate.** The app shell's loader (`AppShell/appShellLoader.ts`) asks `GET /auth/status` once, when the shell
  mounts: `setup` → `/setup`, `signedOut` → `/login?redirectTo=<where you were>`, `signedIn` → the app, with the
  user's name and username for `useSignedInUser()`. Its `shouldRevalidate` is off (no status call per navigation),
  except after saving a password, which sets the username.
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
- **Confirm it's you.** Adding or removing a passkey, or saving a password, needs a sign-in from the last 10 minutes. On a 403
  `REAUTH_REQUIRED` the dialog switches to "Confirm with passkey" and submits again with `isReauth`; the action
  signs in afresh, then retries (`withFreshSignIn`).
- **Mocks.** `mockStore.auth` starts signed in as Mario with two passkeys; `setMockAuthState()` (tests) or
  `VITE_MOCK_AUTH_STATE` (dev) starts signed out or before setup. Without a session every mocked route answers 401,
  like the API. The mocks accept any well-formed ceremony response; the first-run code is `funko-first-run`. Mario
  has no password until one is set (the mock store keeps it as typed).
- **E2E.** `auth.e2e.test.ts` runs the real ceremonies against Chrome's virtual authenticator (the
  `virtualAuthenticator` fixture): first run, sign out, sign back in.

## Scanner and photos

- The scanner uses the `barcode-detector` ponyfill everywhere (Safari's native API is unreliable), reading a centred
  crop of the camera frame a few times a second; two agreeing frames count. UPC-A (12 digits) is normalised to
  EAN-13 (a leading zero) on both the app and the API, so a scan matches a typed code.
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
- `src/common/components/ui/**` is vendored shadcn code (kebab-case files, several exports per file) and is the one
  folder exempt from the naming rules. Wrap it; do not restyle it in place.
- A file in `src/types/` that only exports types must end in `.type.ts`.
- E2E tests interact through page objects in `e2e/pages/`, never directly, and never use `waitForTimeout`.
- No snapshot tests.
