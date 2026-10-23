import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { timestamps } from './_columns.ts';
import { passkeys } from './passkeys.ts';
import { users } from './users.ts';

// One signed-in browser. The cookie holds a random token; only its SHA-256 is stored, so a leaked database copy
// cannot be turned back into a working cookie.
export const sessions = sqliteTable(
  'sessions',
  {
    id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
    tokenHash: text().notNull(),
    userId: integer({ mode: 'number' })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // The passkey that opened it: removing a passkey ends every session it opened.
    passkeyId: integer({ mode: 'number' })
      .notNull()
      .references(() => passkeys.id, { onDelete: 'cascade' }),
    // When the passkey was used for it: the absolute lifetime and "signed in recently" are measured from here.
    signedInAt: integer({ mode: 'timestamp_ms' }).notNull(),
    // Moved forward at most once an hour while the session is used; the idle timeout is measured from here.
    lastSeenAt: integer({ mode: 'timestamp_ms' }).notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('sessions_token_hash_uidx').on(t.tokenHash),
    index('sessions_user_id_idx').on(t.userId),
    index('sessions_passkey_id_idx').on(t.passkeyId),
    index('sessions_last_seen_at_idx').on(t.lastSeenAt),
  ],
);

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
