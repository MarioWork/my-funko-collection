import { sql } from 'drizzle-orm';
import { db } from '../../db/client.ts';

export const healthRepository = {
  // The readiness probe's one query.
  ping: async (): Promise<void> => {
    await db.run(sql`select 1`);
  },
};
