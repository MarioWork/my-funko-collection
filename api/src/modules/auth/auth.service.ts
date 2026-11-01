// What the auth jobs share: session lifetimes, a new session's token, the signed-in answer, the recent sign-in rule,
// and the passkey ceremony (challenges, options, checking what the browser sent).
import {
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type WebAuthnCredential,
} from '@simplewebauthn/server';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { env } from '../../config/env.ts';
import { ForbiddenError, type HttpError } from '../../lib/httpErrors.ts';
import { logger } from '../../lib/logger.ts';
import { createSecureToken, hashSecureToken } from '../../lib/secureToken.ts';
import { authRepository, type AuthChallengePurpose, type PasskeyRow } from './auth.repository.ts';
import type { AuthenticationResponse, RegistrationResponse, SignedInResponse } from './auth.schema.ts';
import type { AuthSession, UserRole } from './auth.type.ts';

export const log = logger.child({ module: 'auth' });

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;

// NIST SP 800-63B-4 caps a session at 30 days; a week unused ends it sooner.
export const SESSION_ABSOLUTE_MS = 30 * DAY_MS;
export const SESSION_IDLE_MS = 7 * DAY_MS;
// lastSeenAt is written at most this often, so reading a page is not a database write.
export const SESSION_TOUCH_INTERVAL_MS = HOUR_MS;
// Adding or removing a passkey, or setting a password, needs a sign-in this recent (either way).
const RECENT_SIGN_IN_MS = 10 * MINUTE_MS;
// The browser gives up after CEREMONY_TIMEOUT_MS; the challenge outlives it a little.
export const CEREMONY_TIMEOUT_MS = 2 * MINUTE_MS;
const CHALLENGE_TTL_MS = 5 * MINUTE_MS;

const RP_NAME = 'My Funko Collection';
const WEBAUTHN_USER_ID_BYTES = 32;

export const APP_ORIGIN = new URL(env.APP_ORIGIN).origin;
// A passkey belongs to a host name for good: it never works on another one, and never on a bare IP address.
export const RP_ID = new URL(env.APP_ORIGIN).hostname;

export const PASSKEY_FAILED_MESSAGE = "The passkey couldn't be saved. Try again.";
const REAUTH_MESSAGE = 'Confirm it’s you first';

const ClientDataSchema = z.object({ challenge: z.string().min(1) });

// A new session: the raw token goes in the cookie and nowhere else.
export type NewSessionToken = { token: string; result: SignedInResponse };

type SignedInUserFields = {
  name: string;
  username: string | null;
  role: UserRole;
  isReadOnly: boolean;
  temporaryPasswordExpiresAt: Date | null;
};

function toWebAuthnCredential(row: PasskeyRow): WebAuthnCredential {
  return {
    id: row.credentialId,
    publicKey: new Uint8Array(row.publicKey),
    counter: row.counter,
    transports: row.transports,
  };
}

export function newSessionRow(now: Date) {
  const token = createSecureToken();

  return { token, row: { tokenHash: hashSecureToken(token), signedInAt: now, lastSeenAt: now } };
}

export function toSignedInResponse(user: SignedInUserFields): SignedInResponse {
  return {
    user: {
      name: user.name,
      username: user.username,
      role: user.role,
      isReadOnly: user.isReadOnly,
      mustChangePassword: user.temporaryPasswordExpiresAt !== null,
    },
  };
}

// The random WebAuthn user handle a new user's passkeys will carry. Never the row id.
export function createWebauthnUserId(): string {
  return randomBytes(WEBAUTHN_USER_ID_BYTES).toString('base64url');
}

// A stolen, still-open session must not be able to swap the owner's passkeys or password, or create a user:
// these need a sign-in from the last few minutes. Otherwise a thief could add their own way in and keep coming back.
export function assertRecentSignIn(session: AuthSession): void {
  const isRecentSignIn = Date.now() - session.signedInAt.getTime() <= RECENT_SIGN_IN_MS;

  if (!isRecentSignIn) throw new ForbiddenError(REAUTH_MESSAGE, 'REAUTH_REQUIRED');
}

// The app is set up once someone can sign in.
export async function isSetUp(): Promise<boolean> {
  return (await authRepository.countUsersWhoCanSignIn()) > 0;
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
export async function takeSignedChallenge(clientDataJSON: string, purpose: AuthChallengePurpose) {
  const challenge = readSignedChallenge(clientDataJSON);

  if (!challenge) return undefined;

  return authRepository.takeChallenge(challenge, purpose);
}

export async function storeChallenge(challenge: string, purpose: AuthChallengePurpose, webauthnUserId?: string) {
  await authRepository.createChallenge({
    challenge,
    purpose,
    webauthnUserId: webauthnUserId ?? null,
    expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
  });
}

// Registration options shared by first run and "add a passkey": a discoverable passkey (no user name to type)
// that needs Face ID / Touch ID / a PIN, and no attestation (any passkey manager is welcome, Bitwarden included).
export function buildRegistrationOptions(userName: string, webauthnUserId: string, existing: PasskeyRow[] = []) {
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
export async function verifyNewPasskey(response: RegistrationResponse, expectedChallenge: string, failure: HttpError) {
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
export async function verifySignedAnswer(
  response: AuthenticationResponse,
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
