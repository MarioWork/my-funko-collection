# My Funko Collection

A self-hosted Funko Pop tracker for one person, run with Docker Compose on a LAN-only home server. No login.
The global React/Node conventions apply; this file holds only what is specific to this repo.

## Layout

- `api/` — Fastify 5 + zod 4 + Drizzle on SQLite, built from `node-fastify-template`. Follow the `node-ts-core`,
  `node-ts-api` and `node-ts-drizzle` skills. Endpoints and env are documented in `api/README.md`.
- `web/` — React 19 + Vite 8 + Tailwind 4 + shadcn/ui (Base UI) app from `react-project-template`. Follow the
  always-on React core and the `react-ts-*`, `ts-api-services` and `shadcn` skills. Pages, flows and scripts are in
  `web/README.md`.
- `compose.yaml` — the deployment: Caddy (`web/`) on 80/443 with a local CA, proxying `/api` and `/uploads` to the
  api container, which is not published. All runtime data lives in `./data` (SQLite file + uploaded images).
- `docs/funko-data-research.md` — why there is no external Funko API. `docs/web-ui-ux-research.md` — the UI
  decisions (image-first grid, scan-first add, filters as a drawer, toast + Undo).

## Vocabulary (easy to get wrong)

- **category** = Funko's own line printed on the box: "Pop! Marvel", "Star Wars". One per funko.
- **collection** = Mario's own list: "Owned" (the default), "Wishlist", ... Many allowed. A funko can be in several.
- **item** = one funko inside one collection: quantity, condition, price, date, notes, tags.
- **tag** = a label on an item, mainly the storage box ("Box 3"). Many per item.

## Product rules

- No external Funko APIs at runtime. Entry is manual; photos are the user's own. Do not propose catalog lookups.
- Images are stored on disk under `data/uploads/funkos/<id>/`: the user uploads one photo, the server makes three
  WebP sizes (2000 / 1200 / 480 px) plus a blur placeholder. Keep them sharp; never shrink below these sizes.
- One search endpoint: `GET /funkos?q=` searches every field, named params narrow one field. No separate `/search`.
- `DELETE /funkos/:id` answers 409 while the funko is in a collection; `?force=true` removes it from all of them.
- Deleting a tag only removes the label from items. Deleting a collection removes its items, never the funkos.
- "Owned" (the default) and "Wishlist" always exist from the first start: reference data in the custom migration
  `api/drizzle/0001_default_collections.sql`, not the seed. Each insert skips one that is already there.
- Barcodes are stored and looked up in the 13-digit EAN form: a 12-digit UPC-A gets a leading zero on both sides
  (`api/src/lib/barcode.ts`, `web/src/common/utils/barcodeUtils.ts`). Keep them in step.

## Commands

Inside `api/`:

```
yarn dev            # http://localhost:3000, OpenAPI at /docs
yarn test           # Vitest, in-memory SQLite + temp uploads folder per test file
yarn typecheck && yarn lint && yarn test   # the definition of green
yarn db:migrate     # apply migrations; yarn db:generate --name=<change> after a schema edit (commit drizzle/)
yarn db:seed        # example data with placeholder images
yarn images:prune   # delete image files no row references
```

Inside `web/`:

```
yarn dev                         # http://localhost:5173/home, API mocked by MSW (VITE_USE_MOCKS=false for the real one)
yarn tsc -b && yarn lint && yarn test && yarn test-e2e   # the definition of green (e2e starts its own dev server on 5173)
yarn dlx shadcn@latest add <component>                   # vendors into src/common/components/ui/ (root tsconfig holds the paths)
```

## Gotchas

- Yarn 4.18 has a package age gate: the newest point releases are refused ("quarantined"). Pick an older range.
- No `.then()` chains, no `process.env` outside `config/env.ts` (the one exception is commented in
  `src/setupTests.ts`), no cross-module `.repository.ts` imports: go through the other module's service.
- `src/lib/imageStorage.ts` is the only file that imports `sharp` or touches the uploads folder.
- Run the `node-ts-audit` skill on `api/` and `react-ts-audit` on `web/` before calling a change done.

## Web specifics

- `src/common/components/ui/**` is vendored shadcn code: kebab-case files, several named exports, lint overrides.
  The one exception to "file name = default export". Wrap it in team-named components; never restyle it in place.
- Colours are semantic tokens only (`bg-background`, `text-primary`, `ring-ring`), defined in `src/index.css` from
  Mario's five blue ramps. No `dark:` colour overrides, no hex in a component. Sapphire 500 never carries text or a
  fill in dark mode.
- Every write is a React Router action through `useFetcher`; `fetcher.submit` returns a promise, so `void` it.
  Forms use `useFormCompat` (`'use no memo'`) with `<Field>` + `<Controller>` + `yupResolver`.
- List state (q, filters, sort, page) lives in the URL through `useListParams` / `useItemListParams`; the loader
  reads it and the mocks filter, sort and page the same way.
- The React Compiler lint forbids setState in an effect: derive state during render (the previous-prop pattern) or
  move the write into the event handler.
- `VITE_BASE_API_URL` is always `/api` (same origin): Vite proxies it in dev, Caddy in production. Image URLs from
  the API are `/uploads/...` and need no rewriting.
- `LinkButton` keeps `role="link"` (Base UI would announce a button); the desktop `<main>` is shadcn's
  `SidebarInset`, so the content wrapper is a `div`.
- Mock mode: `src/mocks/mockStore.ts` is an in-memory copy of the API seed; `resetMockStore()` runs after each
  Vitest test and before each Playwright test.
