import { randomInt } from 'node:crypto';
import { ConflictError, HttpError } from '../../../lib/httpErrors.ts';
import { hashPassword, verifyPassword } from '../../../lib/passwordHash.ts';
import { authRepository } from '../auth.repository.ts';
import type { SignedInResponse } from '../auth.schema.ts';
import { DAY_MS, assertRecentSignIn, log, toSignedInResponse } from '../auth.service.ts';
import type { AuthSession } from '../auth.type.ts';
import { isCommonPassword } from './password.commonPasswords.ts';
import { passwordRepository } from './password.repository.ts';
import type { SetPassword } from './password.schema.ts';

// An unused temporary password stops working this long after it was made (ADR 0002).
const TEMPORARY_PASSWORD_LIFETIME_MS = 7 * DAY_MS;
// Temporary passwords: 4 groups of 5 characters from an alphabet with no look-alikes (no 0/o, 1/l/i), joined by
// dashes so they are easy to read out and type. 20 characters from 31 is ~99 bits of entropy, far past guessing.
const TEMPORARY_PASSWORD_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
const TEMPORARY_PASSWORD_GROUPS = 4;
const TEMPORARY_PASSWORD_GROUP_LENGTH = 5;
const TEMPORARY_PASSWORD_SEPARATOR = '-';

const COMMON_PASSWORD_MESSAGE = 'That password is too common. Pick one nobody would guess.';
const USERNAME_TAKEN_MESSAGE = 'That username is taken. Pick another one.';
const PASSWORD_REUSED_MESSAGE = 'Pick a new password, not the temporary one.';

// A new temporary password: the clear text is shown to the admin once and never stored.
export type TemporaryPassword = { password: string; passwordHash: string; expiresAt: Date };

// Replacing a temporary password with itself is not replacing it.
async function assertNotTemporaryPassword(userId: number, password: string): Promise<void> {
  const user = await authRepository.findPasswordUserById(userId);
  const temporaryHash = user?.passwordHash;

  if (!temporaryHash) return;

  const isSamePassword = await verifyPassword(password, temporaryHash);

  if (isSamePassword) throw new HttpError(PASSWORD_REUSED_MESSAGE, { code: 'PASSWORD_REUSED', statusCode: 400 });
}

// Sets or changes the username and password. Needs a recent sign-in; the length is checked by the schema, the
// common-password list here. Every other session a password opened ends; this one stays. A temporary password
// becomes the user's own: it no longer expires, and the rest of the app opens.
export async function setPassword(
  session: AuthSession,
  { username, password }: SetPassword,
): Promise<SignedInResponse> {
  assertRecentSignIn(session);

  if (isCommonPassword(password)) {
    throw new HttpError(COMMON_PASSWORD_MESSAGE, { code: 'COMMON_PASSWORD', statusCode: 400 });
  }

  const holder = await authRepository.findUserByUsername(username);

  if (holder && holder.id !== session.userId) throw new ConflictError(USERNAME_TAKEN_MESSAGE);

  if (session.mustChangePassword) await assertNotTemporaryPassword(session.userId, password);

  const user = await passwordRepository.setPassword({
    userId: session.userId,
    username,
    passwordHash: await hashPassword(password),
    keepTokenHash: session.tokenHash,
  });

  log.info({ userId: session.userId }, 'password set');

  return toSignedInResponse(user);
}

function randomGroup(): string {
  const characters = Array.from(
    { length: TEMPORARY_PASSWORD_GROUP_LENGTH },
    () => TEMPORARY_PASSWORD_ALPHABET[randomInt(TEMPORARY_PASSWORD_ALPHABET.length)],
  );

  return characters.join('');
}

function randomTemporaryPassword(): string {
  const groups = Array.from({ length: TEMPORARY_PASSWORD_GROUPS }, randomGroup);

  return groups.join(TEMPORARY_PASSWORD_SEPARATOR);
}

// For the users module: an app-made temporary password for a new user, random, past the length rule and never on
// the common list, dead 7 days from now unless the user replaces it first. The clear text goes to the admin once.
export async function createTemporaryPassword(): Promise<TemporaryPassword> {
  let password = randomTemporaryPassword();

  while (isCommonPassword(password)) password = randomTemporaryPassword();

  return {
    password,
    passwordHash: await hashPassword(password),
    expiresAt: new Date(Date.now() + TEMPORARY_PASSWORD_LIFETIME_MS),
  };
}
