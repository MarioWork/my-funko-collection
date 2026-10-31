import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type WebAuthnCredential,
} from '@simplewebauthn/server';
import { randomBytes, randomInt } from 'node:crypto';
import { z } from 'zod';
import { env } from '../../config/env.ts';
import { ConflictError, ForbiddenError, HttpError, NotFoundError, UnauthorizedError } from '../../lib/httpErrors.ts';
import { logger } from '../../lib/logger.ts';
import { hashPassword, verifyPassword } from '../../lib/passwordHash.ts';
import { createSecureToken, hashSecureToken } from '../../lib/secureToken.ts';
import { authRepository, type AuthChallengePurpose, type PasskeyRow, type SessionRow } from './auth.repository.ts';
import type {
  AddPasskeyVerify,
  AuthStatusResponse,
  AuthenticationOptionsResponse,
  PasskeyListResponse,
  PasskeyResponse,
  PasswordSignIn,
  RegistrationOptionsResponse,
  SetPassword,
  SetupOptions,
  SetupVerify,
  SignInVerify,
  SignedInResponse,
} from './auth.schema.ts';
import type { UserRole } from './auth.type.ts';
import { isCommonPassword } from './commonPasswords.ts';

const log = logger.child({ module: 'auth' });

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

// NIST SP 800-63B-4 caps a session at 30 days; a week unused ends it sooner.
const SESSION_ABSOLUTE_MS = 30 * DAY_MS;
const SESSION_IDLE_MS = 7 * DAY_MS;
// lastSeenAt is written at most this often, so reading a page is not a database write.
const SESSION_TOUCH_INTERVAL_MS = HOUR_MS;
// Adding or removing a passkey, or setting a password, needs a sign-in this recent (either way).
const RECENT_SIGN_IN_MS = 10 * MINUTE_MS;
// The browser gives up after CEREMONY_TIMEOUT_MS; the challenge outlives it a little.
const CEREMONY_TIMEOUT_MS = 2 * MINUTE_MS;
const CHALLENGE_TTL_MS = 5 * MINUTE_MS;

const RP_NAME = 'My Funko Collection';
const WEBAUTHN_USER_ID_BYTES = 32;
const DEFAULT_PASSKEY_NAME = 'Passkey';
const SETUP_PATH = '/setup';
// An unused temporary password stops working this long after it was made (ADR 0002).
const TEMPORARY_PASSWORD_LIFETIME_MS = 7 * DAY_MS;
// Temporary passwords: 4 groups of 5 characters from an alphabet with no look-alikes (no 0/o, 1/l/i), joined by
// dashes so they are easy to read out and type. 20 characters from 31 is ~99 bits of entropy, far past guessing.
const TEMPORARY_PASSWORD_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
const TEMPORARY_PASSWORD_GROUPS = 4;
const TEMPORARY_PASSWORD_GROUP_LENGTH = 5;
const TEMPORARY_PASSWORD_SEPARATOR = '-';

const APP_ORIGIN = new URL(env.APP_ORIGIN).origin;
// A passkey belongs to a host name for good: it never works on another one, and never on a bare IP address.
const RP_ID = new URL(env.APP_ORIGIN).hostname;

// One message for every failed sign-in, so a failure says nothing about why.
const SIGN_IN_FAILED_MESSAGE = "That passkey didn't work. Try again.";
// The same answer for a wrong username, a wrong password and a user with no password: it says nothing about which.
const PASSWORD_SIGN_IN_FAILED_MESSAGE = "That username and password don't match. Try again.";
const COMMON_PASSWORD_MESSAGE = 'That password is too common. Pick one nobody would guess.';
const USERNAME_TAKEN_MESSAGE = 'That username is taken. Pick another one.';
const PASSKEY_FAILED_MESSAGE = "The passkey couldn't be saved. Try again.";
const SETUP_CODE_MESSAGE = 'This setup link is wrong or was already used';
const ALREADY_SET_UP_MESSAGE = 'The app is already set up. Sign in instead.';
const REAUTH_MESSAGE = 'Confirm it’s you first';
const TEMPORARY_PASSWORD_EXPIRED_MESSAGE = 'This temporary password has expired. Ask an admin for a new one.';
const PASSWORD_REUSED_MESSAGE = 'Pick a new password, not the temporary one.';

const ClientDataSchema = z.object({ challenge: z.string().min(1) });

// What the rest of the API knows about a signed-in request.
export type AuthSession = {
  tokenHash: string;
  userId: number;
  userName: string;
  username: string | null;
  userRole: UserRole;
  // Signed in with a temporary password: every route but changing it and signing out is refused until it is.
  mustChangePassword: boolean;
  signedInAt: Date;
};

// A new temporary password: the clear text is shown to the admin once and never stored.
export type TemporaryPassword = { password: string; passwordHash: string; expiresAt: Date };

// A new session: the raw token goes in the cookie and nowhere else.
export type NewSessionToken = { token: string; result: SignedInResponse };

function toAuthSession(row: SessionRow): AuthSession {
  return {
    tokenHash: row.tokenHash,
    userId: row.userId,
    userName: row.userName,
    username: row.username,
    userRole: row.userRole,
    mustChangePassword: row.mustChangePassword,
    signedInAt: row.signedInAt,
  };
}

function toPasskeyResponse(row: PasskeyRow): PasskeyResponse {
  return {
    id: row.credentialId,
    name: row.name,
    isSynced: row.isSynced,
    createdAt: row.createdAt.toISOString(),
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
  };
}

function toWebAuthnCredential(row: PasskeyRow): WebAuthnCredential {
  return {
    id: row.credentialId,
    publicKey: new Uint8Array(row.publicKey),
    counter: row.counter,
    transports: row.transports,
  };
}

function newSessionRow(now: Date) {
  const token = createSecureToken();

  return { token, row: { tokenHash: hashSecureToken(token), signedInAt: now, lastSeenAt: now } };
}

function isSessionExpired(row: SessionRow, now: number): boolean {
  const isPastAbsolute = now - row.signedInAt.getTime() > SESSION_ABSOLUTE_MS;
  const isPastIdle = now - row.lastSeenAt.getTime() > SESSION_IDLE_MS;

  return isPastAbsolute || isPastIdle;
}

// The challenge the browser signed, read from its client data. Undefined when the data is not what a browser sends.
function readSignedChallenge(clientDataJSON: string): string | undefined {
  try {
    const decoded: unknown = JSON.parse(Buffer.from(clientDataJSON, 'base64url').toString('utf8'));

    return ClientDataSchema.safeParse(decoded).data?.challenge;
  } catch {
    return undefined;
  }
}

// The challenge must be one this server handed out, for this ceremony, unexpired and unused; it is spent here.
async function takeSignedChallenge(clientDataJSON: string, purpose: AuthChallengePurpose) {
  const challenge = readSignedChallenge(clientDataJSON);

  if (!challenge) return undefined;

  return authRepository.takeChallenge(challenge, purpose);
}

async function storeChallenge(challenge: string, purpose: AuthChallengePurpose, webauthnUserId?: string) {
  await authRepository.createChallenge({
    challenge,
    purpose,
    webauthnUserId: webauthnUserId ?? null,
    expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
  });
}

async function assertSetupCode(code: string): Promise<void> {
  const isValid = await authRepository.hasSetupCode(hashSecureToken(code));

  if (!isValid) throw new UnauthorizedError(SETUP_CODE_MESSAGE, 'INVALID_SETUP_CODE');
}

async function assertNotSetUp(): Promise<void> {
  const isSetUp = (await authRepository.countUsersWhoCanSignIn()) > 0;

  if (isSetUp) throw new HttpError(ALREADY_SET_UP_MESSAGE, { code: 'ALREADY_SET_UP', statusCode: 409 });
}

type SignedInUser = { name: string; username: string | null; role: UserRole; temporaryPasswordExpiresAt: Date | null };

function toSignedInResponse(user: SignedInUser): SignedInResponse {
  return {
    user: {
      name: user.name,
      username: user.username,
      role: user.role,
      mustChangePassword: user.temporaryPasswordExpiresAt !== null,
    },
  };
}

// A stolen, still-open session must not be able to swap the owner's passkeys or password, or create a user:
// these need a sign-in from the last few minutes. Otherwise a thief could add their own way in and keep coming back.
export function assertRecentSignIn(session: AuthSession): void {
  const isRecentSignIn = Date.now() - session.signedInAt.getTime() <= RECENT_SIGN_IN_MS;

  if (!isRecentSignIn) throw new ForbiddenError(REAUTH_MESSAGE, 'REAUTH_REQUIRED');
}

// Registration options shared by first run and "add a passkey": a discoverable passkey (no user name to type)
// that needs Face ID / Touch ID / a PIN, and no attestation (any passkey manager is welcome, Bitwarden included).
function buildRegistrationOptions(userName: string, webauthnUserId: string, existing: PasskeyRow[] = []) {
  return generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userName,
    userDisplayName: userName,
    userID: Buffer.from(webauthnUserId, 'base64url'),
    timeout: CEREMONY_TIMEOUT_MS,
    attestationType: 'none',
    excludeCredentials: existing.map((passkey) => ({ id: passkey.credentialId, transports: passkey.transports })),
    authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
  });
}

// Checks a new passkey against the challenge it was made for. Any failure is the same "couldn't be saved".
async function verifyNewPasskey(response: SetupVerify['response'], expectedChallenge: string, failure: HttpError) {
  try {
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: APP_ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: true,
    });

    if (!verification.verified) throw failure;

    return verification.registrationInfo;
  } catch (error) {
    log.warn({ err: error }, 'passkey registration failed');
    throw failure;
  }
}

// Checks a sign-in answer against the stored passkey: signature, challenge, site, Face ID / Touch ID, counter.
// Any failure is the same "didn't work".
async function verifySignedAnswer(
  response: SignInVerify['response'],
  expectedChallenge: string,
  passkey: PasskeyRow,
  failure: HttpError,
) {
  try {
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: APP_ORIGIN,
      expectedRPID: RP_ID,
      credential: toWebAuthnCredential(passkey),
      requireUserVerification: true,
    });

    if (!verification.verified) throw failure;

    return verification.authenticationInfo;
  } catch (error) {
    log.warn({ err: error, passkeyId: passkey.id }, 'passkey sign-in failed');
    throw failure;
  }
}

// --- Status and sessions ---------------------------------------------------------------------------------------

export async function getAuthStatus(session: AuthSession | null): Promise<AuthStatusResponse> {
  if (session) {
    const user = {
      name: session.userName,
      username: session.username,
      role: session.userRole,
      mustChangePassword: session.mustChangePassword,
    };

    return { state: 'signedIn', user };
  }

  const isSetUp = (await authRepository.countUsersWhoCanSignIn()) > 0;

  return { state: isSetUp ? 'signedOut' : 'setup' };
}

// The session a cookie token stands for, or null. Expired ones are deleted on sight; a used one is kept alive.
export async function getSession(token: string): Promise<AuthSession | null> {
  const tokenHash = hashSecureToken(token);
  const row = await authRepository.findSession(tokenHash);

  if (!row) return null;

  const now = Date.now();

  if (isSessionExpired(row, now)) {
    await authRepository.deleteSession(tokenHash);

    return null;
  }

  const isTouchDue = now - row.lastSeenAt.getTime() > SESSION_TOUCH_INTERVAL_MS;

  if (isTouchDue) await authRepository.touchSession(tokenHash, new Date(now));

  return toAuthSession(row);
}

export async function deleteSession(session: AuthSession): Promise<void> {
  await authRepository.deleteSession(session.tokenHash);
}

export async function deleteAllSessions(session: AuthSession): Promise<void> {
  await authRepository.deleteUserSessions(session.userId);
}

// --- First run ---------------------------------------------------------------------------------------------------

// When nobody has set the app up, a fresh one-time code (the old one stops working). Undefined otherwise.
// Called on every boot, and by yarn auth:reset after deleteSignIns.
export async function addSetupCode(): Promise<string | undefined> {
  const isSetUp = (await authRepository.countUsersWhoCanSignIn()) > 0;

  if (isSetUp) return undefined;

  const code = createSecureToken();
  await authRepository.replaceSetupCode(hashSecureToken(code));

  return code;
}

// The lockout way back (yarn auth:reset): every passkey, password and session goes. The users stay, and with them
// their collections; the next setup gives the first user a way back in.
export async function deleteSignIns(): Promise<void> {
  await authRepository.deleteEverySignIn();
}

export function getSetupLink(code: string): string {
  const link = new URL(SETUP_PATH, APP_ORIGIN);
  link.searchParams.set('code', code);

  return link.toString();
}

export async function getSetupOptions({ code, name }: SetupOptions): Promise<RegistrationOptionsResponse> {
  await assertNotSetUp();
  await assertSetupCode(code);

  const webauthnUserId = createWebauthnUserId();
  const options = await buildRegistrationOptions(name, webauthnUserId);
  await storeChallenge(options.challenge, 'SETUP', webauthnUserId);

  return { ...options };
}

export async function addFirstUser(setup: SetupVerify): Promise<NewSessionToken> {
  await assertNotSetUp();
  await assertSetupCode(setup.code);

  const failure = new UnauthorizedError(PASSKEY_FAILED_MESSAGE, 'PASSKEY_FAILED');
  const challenge = await takeSignedChallenge(setup.response.response.clientDataJSON, 'SETUP');

  if (!challenge?.webauthnUserId) throw failure;

  const registration = await verifyNewPasskey(setup.response, challenge.challenge, failure);
  const now = new Date();
  const session = newSessionRow(now);

  const user = await authRepository.completeSetup({
    // Whoever sets the app up runs it: the first user is always an admin.
    user: { name: setup.name, role: 'ADMIN', webauthnUserId: challenge.webauthnUserId },
    passkey: {
      credentialId: registration.credential.id,
      name: setup.passkeyName ?? DEFAULT_PASSKEY_NAME,
      publicKey: Buffer.from(registration.credential.publicKey),
      counter: registration.credential.counter,
      transports: registration.credential.transports ?? [],
      isSynced: registration.credentialBackedUp,
    },
    session: session.row,
  });

  if (!user) throw new HttpError(ALREADY_SET_UP_MESSAGE, { code: 'ALREADY_SET_UP', statusCode: 409 });

  log.info({ userId: user.id }, 'first user set up');

  return { token: session.token, result: toSignedInResponse(user) };
}

// --- Sign in -----------------------------------------------------------------------------------------------------

// No allowCredentials: the browser offers whichever passkey it holds for this site, so there is no name to type.
export async function getSignInOptions(): Promise<AuthenticationOptionsResponse> {
  const isSetUp = (await authRepository.countUsersWhoCanSignIn()) > 0;

  if (!isSetUp) throw new HttpError('Nobody has set the app up yet', { code: 'NOT_SET_UP', statusCode: 409 });

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

  await authRepository.completeSignIn({
    passkeyId: passkey.id,
    passkeyUse: { counter: authentication.newCounter, isSynced: authentication.credentialBackedUp, lastUsedAt: now },
    previousTokenHash: previous?.tokenHash,
    session: { ...session.row, userId: passkey.userId, signInMethod: 'PASSKEY', passkeyId: passkey.id },
  });
  await authRepository.deleteExpiredSessions(
    new Date(now.getTime() - SESSION_ABSOLUTE_MS),
    new Date(now.getTime() - SESSION_IDLE_MS),
  );

  log.info({ userId: passkey.userId, passkeyId: passkey.id }, 'signed in');

  return { token: session.token, result: toSignedInResponse(user) };
}

// Checked against when the username is unknown, so a wrong username takes as long as a wrong password and the
// answer time says nothing about which usernames exist. Made once, at start-up, so even the first try is not slower.
const timingDecoyHash = hashPassword(createSecureToken());

async function findPasswordUser({ username, password }: PasswordSignIn) {
  const user = await authRepository.findUserByUsername(username);
  const storedHash = user?.passwordHash ?? (await timingDecoyHash);
  const isMatch = await verifyPassword(password, storedHash);

  return isMatch && user?.passwordHash ? user : undefined;
}

function isPastExpiry(expiresAt: Date | null): boolean {
  return expiresAt !== null && expiresAt.getTime() <= Date.now();
}

// Password sign-in: one answer for every failure, and no lockout (anyone could lock the owner out); the route's
// rate limit caps the tries. Like a passkey sign-in, the new session replaces this browser's old one.
// A temporary password past its 7 days gets its own answer, but only once the password matched: it tells the
// person to ask an admin, and says nothing to someone who doesn't know the password.
export async function addPasswordSession(
  signIn: PasswordSignIn,
  previous: AuthSession | null,
): Promise<NewSessionToken> {
  const user = await findPasswordUser(signIn);

  if (!user) throw new UnauthorizedError(PASSWORD_SIGN_IN_FAILED_MESSAGE, 'SIGN_IN_FAILED');

  if (isPastExpiry(user.temporaryPasswordExpiresAt)) {
    throw new UnauthorizedError(TEMPORARY_PASSWORD_EXPIRED_MESSAGE, 'TEMPORARY_PASSWORD_EXPIRED');
  }

  const now = new Date();
  const session = newSessionRow(now);

  await authRepository.completePasswordSignIn({
    previousTokenHash: previous?.tokenHash,
    session: { ...session.row, userId: user.id, signInMethod: 'PASSWORD', passkeyId: null },
  });

  log.info({ userId: user.id }, 'signed in with a password');

  return { token: session.token, result: toSignedInResponse(user) };
}

// --- Password ----------------------------------------------------------------------------------------------------

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

  const user = await authRepository.setPassword({
    userId: session.userId,
    username,
    passwordHash: await hashPassword(password),
    keepTokenHash: session.tokenHash,
  });

  log.info({ userId: session.userId }, 'password set');

  return toSignedInResponse(user);
}

// --- Users made by an admin --------------------------------------------------------------------------------------

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

// An app-made temporary password for a new user: random, past the length rule and never on the common list, dead
// 7 days from now unless the user replaces it first. The clear text goes to the admin once.
export async function createTemporaryPassword(): Promise<TemporaryPassword> {
  let password = randomTemporaryPassword();

  while (isCommonPassword(password)) password = randomTemporaryPassword();

  return {
    password,
    passwordHash: await hashPassword(password),
    expiresAt: new Date(Date.now() + TEMPORARY_PASSWORD_LIFETIME_MS),
  };
}

// The random WebAuthn user handle a new user's passkeys will carry. Never the row id.
export function createWebauthnUserId(): string {
  return randomBytes(WEBAUTHN_USER_ID_BYTES).toString('base64url');
}

// --- Passkeys ----------------------------------------------------------------------------------------------------

export async function getPasskeys(session: AuthSession): Promise<PasskeyListResponse> {
  const rows = await authRepository.listPasskeys(session.userId);

  return { data: rows.map(toPasskeyResponse) };
}

export async function getAddPasskeyOptions(session: AuthSession): Promise<RegistrationOptionsResponse> {
  assertRecentSignIn(session);

  const user = await authRepository.findUserById(session.userId);

  if (!user) throw new UnauthorizedError('Sign in first');

  const existing = await authRepository.listPasskeys(session.userId);
  const options = await buildRegistrationOptions(user.name, user.webauthnUserId, existing);
  await storeChallenge(options.challenge, 'ADD_PASSKEY');

  return { ...options };
}

export async function addPasskey(session: AuthSession, { name, response }: AddPasskeyVerify): Promise<PasskeyResponse> {
  assertRecentSignIn(session);

  const failure = new HttpError(PASSKEY_FAILED_MESSAGE, { code: 'PASSKEY_FAILED', statusCode: 400 });
  const challenge = await takeSignedChallenge(response.response.clientDataJSON, 'ADD_PASSKEY');

  if (!challenge) throw failure;

  const registration = await verifyNewPasskey(response, challenge.challenge, failure);
  const row = await authRepository.createPasskey({
    credentialId: registration.credential.id,
    userId: session.userId,
    name,
    publicKey: Buffer.from(registration.credential.publicKey),
    counter: registration.credential.counter,
    transports: registration.credential.transports ?? [],
    isSynced: registration.credentialBackedUp,
  });

  log.info({ userId: session.userId, passkeyId: row.id }, 'passkey added');

  return toPasskeyResponse(row);
}

// Needs a recent sign-in, and the last passkey can never go (that would lock everyone out). Every session the
// passkey opened ends with it, this browser's included when it signed in with that passkey.
export async function deletePasskey(session: AuthSession, credentialId: string): Promise<void> {
  assertRecentSignIn(session);

  const passkey = await authRepository.findPasskey(credentialId);

  if (!passkey || passkey.userId !== session.userId) throw new NotFoundError('Passkey', credentialId);

  const passkeyCount = await authRepository.countPasskeys(session.userId);

  if (passkeyCount <= 1) {
    throw new HttpError('You need at least one passkey', { code: 'LAST_PASSKEY', statusCode: 409 });
  }

  await authRepository.deletePasskey(passkey.id);

  log.info({ userId: session.userId, passkeyId: passkey.id }, 'passkey removed');
}
