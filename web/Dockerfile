# Build stage: install, type-check, bundle. `yarn build` copies the scanner's .wasm into public/ first and fails if
# dist/ ends up without it (scripts/checkProductionBundle.ts).
FROM node:24-slim AS build
WORKDIR /app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
# The committed Yarn release runs directly: no Corepack download inside the build.
RUN node .yarn/releases/yarn-4.18.1.cjs install --immutable
COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html components.json .env ./
COPY scripts ./scripts
COPY public ./public
COPY src ./src
RUN node .yarn/releases/yarn-4.18.1.cjs build

# Runtime stage: Caddy serves dist/ over HTTPS and proxies /api and /uploads to the api container.
FROM caddy:2-alpine
COPY --from=build /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 80 443
