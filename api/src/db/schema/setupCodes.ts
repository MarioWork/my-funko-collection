import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { timestamps } from './_columns.ts';

// The one-time code that lets the first passkey be made, printed in the server log. Only its SHA-256 is kept, and
// only while nobody has set the app up yet.
export const setupCodes = sqliteTable(
  'setup_codes',
  {
    id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
    codeHash: text().notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex('setup_codes_code_hash_uidx').on(t.codeHash)],
);

export type SetupCode = typeof setupCodes.$inferSelect;
