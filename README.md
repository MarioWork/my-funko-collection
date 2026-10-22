# My Funko Collection

A small self-hosted app to track a Funko Pop collection: the catalog of figures you care about, your own photos of
them, the collections you sort them into (Owned, Wishlist, ...) and the tags that say which box they live in.

```
api/          Fastify + SQLite API (Node 24, TypeScript, Drizzle, sharp)    ← this is what runs today
web/          React app (planned)
compose.yaml  one-command deploy on the home server
docs/         research notes (why there is no external Funko API)
```

## Run it at home (Docker Compose)

```bash
# 1. Set the browser origin of the (future) web app in compose.yaml: CORS_ORIGINS
# 2. Build and start
docker compose up --build -d

# 3. Check
curl http://<server-ip>:3000/ready        # {"status":"ok"}
```

The API listens on port 3000. Migrations run at boot (`MIGRATE_ON_START=true`). All data lives in `./data`:

```
data/app.db            SQLite database
data/uploads/funkos/   images, three WebP sizes per photo
```

### Backups

Everything is in `./data`. Copy it while the container runs with:

```bash
sqlite3 data/app.db ".backup data/backup-$(date +%F).db"
rsync -a data/uploads/ /path/to/backup/uploads/
```

Or download a snapshot from the API: `GET /export` (JSON of everything) and `GET /export/items.csv` (a spreadsheet of
your items).

### Remote access

There is no login. Keep the port on your LAN. If you want it from outside, put the server on Tailscale (or another
VPN) rather than forwarding the port.

## Develop

See [`api/README.md`](api/README.md).
