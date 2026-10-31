import fp from 'fastify-plugin';
import { prisma } from '../lib/prisma.ts';

// Owns the connection pool's lifecycle: closed on shutdown. Repositories import `prisma` directly, so there is no
// `app.prisma` decorator.
export const prismaPlugin = fp(async (app) => {
  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
});
