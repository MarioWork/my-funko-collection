# Build stage: full install (which runs `prisma generate`), type-check and compile to dist/.
FROM node:26-slim AS build
# Prisma's engines need OpenSSL; the slim image ships without it.
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
# `prisma generate` reads prisma.config.ts, which needs some DATABASE_URL; no database is contacted while building.
# Build stage only: the runtime stage gets the real one from compose.yaml.
ENV DATABASE_URL=postgresql://build:unused@localhost:5432/unused
COPY package.json yarn.lock .yarnrc.yml prisma.config.ts ./
COPY .yarn ./.yarn
COPY prisma ./prisma
# The committed Yarn release runs directly: no Corepack download inside the build.
RUN node .yarn/releases/yarn-4.18.1.cjs install --immutable
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN node .yarn/releases/yarn-4.18.1.cjs build \
  && node .yarn/releases/yarn-4.18.1.cjs workspaces focus --production
# Prisma fetches its schema engine (used by `migrate deploy`) on first use. Fetch it now, so the container never
# downloads anything at start-up. Comparing the schema with an empty one needs the engine but no database.
RUN node_modules/.bin/prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script > /dev/null

# Shared base of the two images below: slim Node with OpenSSL (Prisma's engines need it).
FROM node:26-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
WORKDIR /app

# Migrate image: production dependencies (the Prisma CLI and its engine) plus the migrations. compose.yaml runs it
# once before the api starts; it applies pending migrations (a no-op when there are none) and exits.
FROM base AS migrate
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json /app/prisma.config.ts ./
COPY --chown=node:node prisma/schema.prisma ./prisma/schema.prisma
COPY --chown=node:node prisma/migrations ./prisma/migrations
USER node
CMD ["node", "node_modules/prisma/build/index.js", "migrate", "deploy"]

# Runtime image (the default target): production dependencies (sharp's prebuilt binary included) and dist/ only.
FROM base AS runtime
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/package.json ./
# The compose volume mounts over /app/data/uploads; the folder exists so a first run without the volume works too.
RUN mkdir -p /app/data/uploads && chown -R node:node /app/data
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
