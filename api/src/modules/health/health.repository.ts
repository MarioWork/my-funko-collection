import { prisma } from '../../lib/prisma.ts';

export const healthRepository = {
  // The readiness probe's one query.
  ping: async (): Promise<void> => {
    await prisma.$queryRaw`select 1`;
  },
};
