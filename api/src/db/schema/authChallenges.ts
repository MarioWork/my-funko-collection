import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { timestamps } from './_columns.ts';

export const AUTH_CHALLENGE_PURPOSES = ['SETUP', 'SIGN_IN', 'ADD_PASSKEY'] as const;
export type AuthChallengePurpose = (typeof AUTH_CHALLENGE_PURPOSES)[number];

// `in (...)` for the check constraint, built from the same list the type uses.
const AUTH_CHALLENGE_PURPOSES_SQL_LIST = sql.raw(AUTH_CHALLENGE_PURPOSES.map((purpose) => `'${purpose}'`).join(', '));

// A random value handed to the browser for one passkey ceremony. Used once, then deleted; it expires in minutes.
export const authChallenges = sqliteTable(
  'auth_challenges',
  {
    id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
    challenge: text().notNull(),
    purpose: text({ enum: AUTH_CHALLENGE_PURPOSES }).notNull(),
    // SETUP only: the WebAuthn user handle the new passkey is made for, kept until the user row exists.
    webauthnUserId: text(),
    expiresAt: integer({ mode: 'timestamp_ms' }).notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('auth_challenges_challenge_uidx').on(t.challenge),
    index('auth_challenges_expires_at_idx').on(t.expiresAt),
    check('auth_challenges_purpose_chk', sql`${t.purpose} in (${AUTH_CHALLENGE_PURPOSES_SQL_LIST})`),
  ],
);

export type AuthChallenge = typeof authChallenges.$inferSelect;
export type NewAuthChallenge = typeof authChallenges.$inferInsert;
