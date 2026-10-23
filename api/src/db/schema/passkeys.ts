import { blob, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { timestamps } from './_columns.ts';
import { users } from './users.ts';

// One passkey. Only its public key lives here; the private key never leaves the person's device or passkey manager.
export const passkeys = sqliteTable(
  'passkeys',
  {
    id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
    // The credential id the authenticator chose (base64url): what the browser names it by, and the API's id for it.
    credentialId: text().notNull(),
    userId: integer({ mode: 'number' })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    publicKey: blob({ mode: 'buffer' }).notNull(),
    // The signature counter the authenticator reported last; a lower one later means a cloned key.
    counter: integer({ mode: 'number' }).notNull(),
    // How the browser can reach it ("internal", "hybrid", "usb"...), as JSON.
    transports: text({ mode: 'json' }).$type<string[]>().notNull(),
    // Backed up by a passkey manager (iCloud Keychain, Bitwarden...), so it survives losing one device.
    isSynced: integer({ mode: 'boolean' }).notNull(),
    lastUsedAt: integer({ mode: 'timestamp_ms' }),
    ...timestamps,
  },
  (t) => [uniqueIndex('passkeys_credential_id_uidx').on(t.credentialId), index('passkeys_user_id_idx').on(t.userId)],
);

export type Passkey = typeof passkeys.$inferSelect;
export type NewPasskey = typeof passkeys.$inferInsert;
