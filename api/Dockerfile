# Build stage: full install, type-check and compile to dist/.
FROM node:24-slim AS build
WORKDIR /app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
# The committed Yarn release runs directly: no Corepack download inside the build.
RUN node .yarn/releases/yarn-4.18.1.cjs install --immutable
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN node .yarn/releases/yarn-4.18.1.cjs build \
  && node .yarn/releases/yarn-4.18.1.cjs workspaces focus --production

# Runtime stage: production dependencies (sharp's prebuilt linux-x64 binary included), dist/, the migrations.
FROM node:24-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/package.json ./
COPY --chown=node:node drizzle ./drizzle
# The compose volume mounts over /app/data; the folders exist so a first run without the volume works too.
RUN mkdir -p /app/data/uploads && chown -R node:node /app/data
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
