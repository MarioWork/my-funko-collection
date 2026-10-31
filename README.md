<p align="center">
  <img src="assets/logos/my-funko-collection-logo.png" alt="MyFunkoCollection" width="240" />
</p>

<p align="center">
  <strong>Your Funko Pop shelf, in your pocket.</strong><br />
  A small, self-hosted app to catalog your Pops, snap their photos, and always know which box they're in.
</p>

<p align="center">
  <img alt="React 19" src="https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-6-3178c6?logo=typescript&logoColor=white" />
  <img alt="Fastify" src="https://img.shields.io/badge/Fastify-5-000000?logo=fastify&logoColor=white" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-18-4169e1?logo=postgresql&logoColor=white" />
  <img alt="Docker Compose" src="https://img.shields.io/badge/Docker-Compose-2496ed?logo=docker&logoColor=white" />
</p>

<p align="center">
  <img src="docs/screenshots/funkos.webp" alt="The Funkos page: a grid of funko photos with search, sort, filters and quick filters" width="900" />
</p>

---

## Contents

- [Why this exists](#why-this-exists)
- [What it does](#what-it-does)
- [A quick tour](#a-quick-tour)
- [Get it running at home](#get-it-running-at-home)
  - [Trust the certificate](#trust-the-certificate-once-per-device)
  - [Sign in with a passkey](#sign-in-with-a-passkey)
  - [Where your data lives](#where-your-data-lives)
  - [Using it away from home](#using-it-away-from-home)
- [Try it without a server](#try-it-without-a-server)
- [Run it locally (development)](#run-it-locally-development)
- [How it's built](#how-its-built)
  - [How it works](#how-it-works)
  - [Why no automatic Funko lookup?](#why-no-automatic-funko-lookup)

## Why this exists

Spreadsheets get messy, and catalog apps want an account, a subscription, or your data. **MyFunkoCollection**
runs on a machine in your house, keeps everything in one folder you can back up, and works great on your phone,
right next to the shelf.

- **Yours, not a cloud's.** No sign-up, no tracking, no external Funko database. Your photos stay on your server.
- **Locked with a passkey.** Face ID, Touch ID or your passkey manager. No password to guess or leak.
- **Phone-first, desktop-friendly.** Scan a box with the camera on the go, browse a wide grid at your desk.
- **Built for real shelves.** Tag each Pop with the box it lives in, so "where's my Grogu?" takes two seconds.

## What it does

|                            |                                                                                                    |
| -------------------------- | -------------------------------------------------------------------------------------------------- |
| 📷 **Scan to add**         | Point the camera at the barcode: already have it? +1. New one? The form opens with the code in.    |
| 🖼️ **Your own photos**     | Upload a photo and it's stored sharp in three sizes, with a blurred preview while it loads.        |
| 🗂️ **Collections**         | Owned, Wishlist, Display, For sale… one funko can be in several, each with its own price and date. |
| 🏷️ **Tags**                | Mark where each one is stored ("Box 3", "Display shelf"), plus anything else you like.             |
| 🎬 **Categories & series** | The line on the box (Pop! Marvel) and the show or film it's from (Stranger Things).                |
| 🔎 **Search everything**   | One box finds names, numbers, barcodes, series, tags and boxes. <kbd>⌘K</kbd> from anywhere.       |
| 🎛️ **Filter & sort**       | By category, series, collection, tag, chase, images… or what's missing: no series, no collection.  |
| 💾 **Images page**         | See what your photos take up, grouped by funko, and spot files nothing uses.                       |
| 📤 **Export**              | Any list, one entry or one funko (with its photos) as a spreadsheet, CSV or JSON.                  |
| 🌙 **Light & dark**        | Follows your system, with smooth, calm motion that switches off if you prefer reduced motion.      |
| ♿ **Accessible**          | Keyboard and screen-reader friendly, aiming at WCAG 2.2 AA.                                        |
| 🔐 **Passkey sign-in**     | Face ID, Touch ID, Bitwarden or any passkey manager. Photos stay private too.                      |

## A quick tour

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/funko.webp" alt="A funko's page with its photo gallery, details and collections" /></td>
    <td width="50%"><img src="docs/screenshots/images.webp" alt="The Images page grouped by funko, with image counts and total sizes" /></td>
  </tr>
  <tr>
    <td align="center"><sub>Every funko gets its own page: photos, details and the collections it's in.</sub></td>
    <td align="center"><sub>The Images page shows what your photos take up, per funko.</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/screenshots/home.webp" alt="The home page with totals, recent funkos and collections" /></td>
    <td width="50%"><img src="docs/screenshots/funkos-dark.webp" alt="The Funkos page in dark mode" /></td>
  </tr>
  <tr>
    <td align="center"><sub>Home: your collection at a glance.</sub></td>
    <td align="center"><sub>Dark mode, for late-night shelf sorting.</sub></td>
  </tr>
</table>

<p align="center">
  <img src="docs/screenshots/phone-funkos.webp" alt="The Funkos page on a phone" width="260" />
  &nbsp;&nbsp;
  <img src="docs/screenshots/phone-add.webp" alt="Adding a new funko on a phone" width="260" />
</p>
<p align="center"><sub>On your phone: browse with one thumb, add a new Pop in one save.</sub></p>

## Get it running at home

You need a machine that stays on (a mini PC, a NAS, a Raspberry Pi 5) with **Docker** installed.

```bash
git clone https://github.com/MarioWork/my-funko-collection.git
cd my-funko-collection

# Set the address you'll open it at: x-app-address at the top of compose.yaml.
# It must be a name, not an IP address (passkeys refuse IPs), and you pick it once: passkeys are tied to it.

# A password for the database, kept in .env (never committed):
echo "POSTGRES_PASSWORD=$(openssl rand -hex 24)" > .env

docker compose up --build -d
```

The database is created on first start, with an **Owned** and a **Wishlist** collection ready to go. Then make your
passkey (below).

### Trust the certificate (once per device)

The app is served over HTTPS by Caddy with its own local certificate. HTTPS is what lets the phone camera scan
barcodes. To stop the browser warning, install Caddy's root certificate on each device:

```bash
docker compose cp web:/data/caddy/pki/authorities/local/root.crt ./my-funko-collection-ca.crt
```

- **iPhone / iPad:** AirDrop or email the file to yourself, open it, then install it in _Settings → Profile
  Downloaded_, and switch it on in _Settings → General → About → Certificate Trust Settings_.
- **Android:** _Settings → Security → Encryption & credentials → Install a certificate → CA certificate_.
- **Mac:** double-click it, then set it to _Always Trust_ in Keychain Access.

Tip: on your phone, use _Add to Home Screen_, and it opens like a regular app.

### Sign in with a passkey

The first start prints a one-time setup link in the log:

```bash
docker compose logs api | grep -A1 'Open this link'
```

Open it, tell the app your name, and save a passkey: your phone or Mac asks for Face ID / Touch ID and keeps it
(Apple Passwords, Bitwarden, Google Password Manager... all work). Nobody can claim the app without that link.

After that, signing in is one button and Face ID. A sign-in lasts 30 days, or 7 days without use. In
_Settings → Security_ you can add a spare passkey (do it: a second device or manager), remove one, or sign out
everywhere.

**Locked out?** On the server:

```bash
docker compose exec api node dist/cli/resetAuth.js
```

It removes every passkey and sign-in (never your collection) and prints a new setup link.

### Where your data lives

Everything is in `./data`. That one folder is your whole collection:

```
data/postgres/         the PostgreSQL database files
data/uploads/funkos/   your photos, three WebP sizes each
```

**Back it up** while it runs:

```bash
docker compose exec db pg_dump -U funko -Fc funko > backup-$(date +%F).dump
rsync -a data/uploads/ /path/to/backup/uploads/
```

Or grab a copy from inside the app: _Settings → Data_ downloads everything as JSON, or your items as a
spreadsheet (CSV).

### Using it away from home

Don't open a port on your router. Put the server on [Tailscale](https://tailscale.com) instead: only your own
devices can reach it, and the passkey is the second lock. A Tailscale name (`https://funko.<your-tailnet>.ts.net`)
also comes with a real certificate, so no device needs Caddy's certificate installed.

## Try it without a server

Want a look first? The web app can run on built-in sample data, right in your browser:

```bash
cd web
corepack enable && yarn install
yarn dev:big        # http://localhost:5173 with 330 sample funkos
```

Changes live in that browser tab only, so play as much as you like.

## Run it locally (development)

The real thing on your own computer: the API, its database and the web app. It runs on macOS, Linux and Windows.
You need **Node 26** for the api (`web/` is still on 24; fnm switches per folder) and **PostgreSQL 18**, listening on `localhost:5432` with a `funko` user that may create
databases (the tests make their own).

**1. Get Postgres** (once). The easiest way, on any system with Docker:

```bash
docker run -d --name funko-postgres -p 5432:5432 \
  -e POSTGRES_USER=funko -e POSTGRES_PASSWORD=funko -e POSTGRES_DB=funko_dev postgres:18
```

Or install it on the machine itself:

- **macOS:** `brew install postgresql@18 && brew services run postgresql@18`
- **Linux:** your distro's `postgresql` package, or the [official packages](https://www.postgresql.org/download/linux/)
  for version 18
- **Windows:** the installer from [postgresql.org](https://www.postgresql.org/download/windows/)

Then make the app's user and database (on Linux, put `sudo -u postgres` in front of both):

```bash
psql -d postgres -c "create role funko login password 'funko' createdb"
createdb -O funko funko_dev
```

**2. Set up the API and the web app** (once):

```bash
cd api
corepack enable && yarn install
cp .env.example .env     # already points at postgresql://funko:funko@localhost:5432/funko_dev
yarn db:migrate          # creates the tables, with Owned and Wishlist
yarn db:seed             # optional: 32 example funkos with photos

cd ../web && yarn install
```

**3. Work on it**, with Postgres started, in two terminals:

```bash
cd api && yarn dev   # the API on http://localhost:3000 (OpenAPI docs at /docs)
cd web && yarn dev   # the app on http://localhost:5173
```

Open http://localhost:5173. The first start prints a setup link in the API terminal, as on the server.

Postgres keeps running until you stop it: `docker stop funko-postgres` / `docker start funko-postgres` with Docker,
`yarn postgres:stop` / `yarn postgres:start` in `api/` with Homebrew (those two scripts are Homebrew only), or your
system's service manager.

Before calling a change done, check that everything is green:

```bash
cd api && yarn typecheck && yarn lint && yarn test        # needs Postgres on
cd web && yarn tsc -b && yarn lint && yarn test && yarn test-e2e
```

The API tests make their own throwaway databases, so they never touch `funko_dev`.

## How it's built

```
api/          Fastify 5 + zod + Prisma on PostgreSQL, sharp for images (Node 26, TypeScript)
web/          React 19 + Vite 8 + Tailwind 4 + shadcn/ui (Base UI), React Router data mode
compose.yaml  the home-server deploy: Caddy (HTTPS, serves the app) in front of the API and Postgres
docs/         the testing checklist and the screenshots above
assets/       logo and illustrations
```

Developing? Each half has its own guide: [`api/README.md`](api/README.md) and [`web/README.md`](web/README.md).

### How it works

```
your phone or laptop
        │  HTTPS
        ▼
      Caddy ─────────── serves the web app (the screens)
        │
        │  /api and /uploads
        ▼
       API ──────────── Postgres       your funkos, collections, items, tags
        └────────────── data/uploads/  your photos, three sizes each
```

- **Caddy** is the front door: the only part your devices talk to. It adds HTTPS, which the camera scanner and
  passkeys need.
- **The web app** is what you see. It stores nothing itself: every screen asks the API.
- **The API** checks that you're signed in and that a request makes sense, then reads or saves.
- **Postgres** keeps the list. **`data/uploads/`** keeps the photos.

Searching for "Groot": your phone asks Caddy, Caddy passes it to the API, the API checks your sign-in and asks
Postgres which funkos match, and the web app shows the cards. The photos load straight from `/uploads`.

Inside the API, every request goes down the same three steps:

```
route  ─▶  service  ─▶  repository  ─▶  Postgres
checks the   applies the     the only part that
request      rules           talks to the database (Prisma)
```

On the home server, `docker compose up` starts it in order: Postgres, then `migrate` (sets up or updates the
tables, then stops), then the API, then Caddy. On your computer the Vite dev server plays Caddy's part: it sends
`/api` and `/uploads` to the API on port 3000.

### Why no automatic Funko lookup?

Funko has never published an API (and its terms forbid apps that talk to its services), the one real catalog
charges at least $1,200 for access, and product photos are Funko's copyright wherever they're hosted. So entry is
manual (scanning makes it quick) and the photos are your own.

---

<p align="center">
  <img src="assets/logos/logo-face.png" alt="" width="48" /><br />
  <sub>A fan-made hobby project. Funko and Pop! are trademarks of Funko, LLC. This project is not affiliated with or endorsed by Funko.</sub>
</p>
