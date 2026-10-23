import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { timestamps } from './_columns.ts';

// The one person who signs in. A table (not a setting) so passkeys and sessions have something to point at.
export const users = sqliteTable(
  'users',
  {
    id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
    name: text().notNull(),
    // The random WebAuthn user handle (base64url), stored in every passkey made for this user. Never the row id.
    webauthnUserId: text().notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex('users_webauthn_user_id_uidx').on(t.webauthnUserId)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
