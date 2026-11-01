import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { HttpError, UnauthorizedError } from '../../../lib/httpErrors.ts';
import { hashPassword, verifyPassword } from '../../../lib/passwordHash.ts';
import { createSecureToken } from '../../../lib/secureToken.ts';
import { authRepository, type PasswordUserRow } from '../auth.repository.ts';
import {
  CEREMONY_TIMEOUT_MS,
  RP_ID,
  SESSION_ABSOLUTE_MS,
  SESSION_IDLE_MS,
  isSetUp,
  log,
  newSessionRow,
  storeChallenge,
  takeSignedChallenge,
  toSignedInResponse,
  verifySignedAnswer,
  type NewSessionToken,
} from '../auth.service.ts';
import type { AuthSession } from '../auth.type.ts';
import { signInRepository } from './signIn.repository.ts';
import type { AuthenticationOptionsResponse, ConfirmPassword, PasswordSignIn, SignInVerify } from './signIn.schema.ts';

// One message for every failed sign-in, so a failure says nothing about why.
const SIGN_IN_FAILED_MESSAGE = "That passkey didn't work. Try again.";
// The same answer for a wrong username, a wrong password and a user with no password: it says nothing about which.
const PASSWORD_SIGN_IN_FAILED_MESSAGE = "That username and password don't match. Try again.";
// Confirming it's you: the same answer for a wrong password and a user with no password.
const PASSWORD_CONFIRM_FAILED_MESSAGE = "That password doesn't match. Try again.";
const TEMPORARY_PASSWORD_EXPIRED_MESSAGE = 'This temporary password has expired. Ask an admin for a new one.';

// No allowCredentials: the browser offers whichever passkey it holds for this site, so there is no name to type.
export async function getSignInOptions(): Promise<AuthenticationOptionsResponse> {
  if (!(await isSetUp())) throw new HttpError('Nobody has set the app up yet', { code: 'NOT_SET_UP', statusCode: 409 });

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    timeout: CEREMONY_TIMEOUT_MS,
    userVerification: 'required',
  });
  await storeChallenge(options.challenge, 'SIGN_IN');

  return { ...options };
}

// Signing in: `previous` is the session this browser had, if any, and a new one always replaces it.
export async function addSession({ response }: SignInVerify, previous: AuthSession | null): Promise<NewSessionToken> {
  const failure = new UnauthorizedError(SIGN_IN_FAILED_MESSAGE, 'SIGN_IN_FAILED');
  const challenge = await takeSignedChallenge(response.response.clientDataJSON, 'SIGN_IN');
  const passkey = await authRepository.findPasskey(response.id);

  if (!challenge || !passkey) throw failure;

  // The passkey row decides whose it is (an admin's or a member's); the browser's userHandle is not signed and may
  // be left out, but when it is sent it must be that user's.
  const user = await authRepository.findUserById(passkey.userId);

  if (!user) throw failure;

  const isOtherUsersHandle =
    response.response.userHandle !== undefined && response.response.userHandle !== user.webauthnUserId;

  if (isOtherUsersHandle) throw failure;

  const authentication = await verifySignedAnswer(response, challenge.challenge, passkey, failure);

  const now = new Date();
  const session = newSessionRow(now);

  await signInRepository.completeSignIn({
    passkeyId: passkey.id,
    passkeyUse: { counter: authentication.newCounter, isSynced: authentication.credentialBackedUp, lastUsedAt: now },
    previousTokenHash: previous?.tokenHash,
    session: { ...session.row, userId: passkey.userId, signInMethod: 'PASSKEY', passkeyId: passkey.id },
  });
  await signInRepository.deleteExpiredSessions(
    new Date(now.getTime() - SESSION_ABSOLUTE_MS),
    new Date(now.getTime() - SESSION_IDLE_MS),
  );

  log.info({ userId: passkey.userId, passkeyId: passkey.id }, 'signed in');

  return { token: session.token, result: toSignedInResponse(user) };
}

// Checked against when the username is unknown, so a wrong username takes as long as a wrong password and the
// answer time says nothing about which usernames exist. Made once, at start-up, so even the first try is not slower.
const timingDecoyHash = hashPassword(createSecureToken());

// The user when the password is theirs; undefined for a wrong password and for a user with none. A missing user or
// password is checked against the decoy, so every failure takes as long as a wrong password.
async function matchPassword(user: PasswordUserRow | undefined, password: string) {
  const storedHash = user?.passwordHash ?? (await timingDecoyHash);
  const isMatch = await verifyPassword(password, storedHash);

  return isMatch && user?.passwordHash ? user : undefined;
}

async function findPasswordUser({ username, password }: PasswordSignIn) {
  const user = await authRepository.findUserByUsername(username);

  return matchPassword(user, password);
}

function isPastExpiry(expiresAt: Date | null): boolean {
  return expiresAt !== null && expiresAt.getTime() <= Date.now();
}

// A temporary password past its 7 days gets its own answer, but only once the password matched: it tells the
// person to ask an admin, and says nothing to someone who doesn't know the password.
function assertTemporaryPasswordUnexpired(user: PasswordUserRow): void {
  if (isPastExpiry(user.temporaryPasswordExpiresAt)) {
    throw new UnauthorizedError(TEMPORARY_PASSWORD_EXPIRED_MESSAGE, 'TEMPORARY_PASSWORD_EXPIRED');
  }
}

// A new password session for the user, in place of this browser's old one (if any).
async function openPasswordSession(user: PasswordUserRow, previous: AuthSession | null): Promise<NewSessionToken> {
  const session = newSessionRow(new Date());

  await signInRepository.completePasswordSignIn({
    previousTokenHash: previous?.tokenHash,
    session: { ...session.row, userId: user.id, signInMethod: 'PASSWORD', passkeyId: null },
  });

  return { token: session.token, result: toSignedInResponse(user) };
}

// Password sign-in: one answer for every failure, and no lockout (anyone could lock the owner out); the route's
// rate limit caps the tries. Like a passkey sign-in, the new session replaces this browser's old one.
export async function addPasswordSession(
  signIn: PasswordSignIn,
  previous: AuthSession | null,
): Promise<NewSessionToken> {
  const user = await findPasswordUser(signIn);

  if (!user) throw new UnauthorizedError(PASSWORD_SIGN_IN_FAILED_MESSAGE, 'SIGN_IN_FAILED');

  assertTemporaryPasswordUnexpired(user);

  const newSession = await openPasswordSession(user, previous);

  log.info({ userId: user.id }, 'signed in with a password');

  return newSession;
}

// "Confirm it's you" with a password. Only the signed-in user's own password counts (the session says whose, so it
// can never switch users), and it opens a fresh password session in place of this one: the recent sign-in is
// renewed just as a passkey sign-in renews it. Signing in's rules hold: one answer for every failure, the route's
// rate limit, no lockout, an expired temporary password refused. A temporary password still has to be replaced.
export async function addRecentSignIn(session: AuthSession, { password }: ConfirmPassword): Promise<NewSessionToken> {
  const signedInUser = await authRepository.findPasswordUserById(session.userId);
  const user = await matchPassword(signedInUser, password);

  if (!user) throw new UnauthorizedError(PASSWORD_CONFIRM_FAILED_MESSAGE, 'SIGN_IN_FAILED');

  assertTemporaryPasswordUnexpired(user);

  const newSession = await openPasswordSession(user, session);

  log.info({ userId: user.id }, 'confirmed with a password');

  return newSession;
}
