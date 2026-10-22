import fp from 'fastify-plugin';
import { applyPragmas, client, db, type Database } from '../db/client.ts';

declare module 'fastify' {
  interface FastifyInstance {
    db: Database;
  }
}

// Owns the connection's lifecycle: pragmas on start, close on shutdown. Repositories import `db` directly.
export const dbPlugin = fp(async (app) => {
  await applyPragmas(client);

  app.decorate('db', db);

  app.addHook('onClose', () => {
    client.close();
  });
});
