import { HttpError, NotFoundError, UnauthorizedError } from '../../../lib/httpErrors.ts';
import { authRepository, type PasskeyRow } from '../auth.repository.ts';
import type { RegistrationOptionsResponse } from '../auth.schema.ts';
import {
  PASSKEY_FAILED_MESSAGE,
  assertRecentSignIn,
  buildRegistrationOptions,
  log,
  storeChallenge,
  takeSignedChallenge,
  verifyNewPasskey,
} from '../auth.service.ts';
import type { AuthSession } from '../auth.type.ts';
import { passkeysRepository } from './passkeys.repository.ts';
import type { AddPasskeyVerify, PasskeyListResponse, PasskeyResponse } from './passkeys.schema.ts';

function toPasskeyResponse(row: PasskeyRow): PasskeyResponse {
  return {
    id: row.credentialId,
    name: row.name,
    isSynced: row.isSynced,
    createdAt: row.createdAt.toISOString(),
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
  };
}

export async function getPasskeys(session: AuthSession): Promise<PasskeyListResponse> {
  const rows = await passkeysRepository.listPasskeys(session.userId);

  return { data: rows.map(toPasskeyResponse) };
}

export async function getAddPasskeyOptions(session: AuthSession): Promise<RegistrationOptionsResponse> {
  assertRecentSignIn(session);

  const user = await authRepository.findUserById(session.userId);

  if (!user) throw new UnauthorizedError('Sign in first');

  const existing = await passkeysRepository.listPasskeys(session.userId);
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
  const row = await passkeysRepository.createPasskey({
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

  const passkeyCount = await passkeysRepository.countPasskeys(session.userId);

  if (passkeyCount <= 1) {
    throw new HttpError('You need at least one passkey', { code: 'LAST_PASSKEY', statusCode: 409 });
  }

  await passkeysRepository.deletePasskey(passkey.id);

  log.info({ userId: session.userId, passkeyId: passkey.id }, 'passkey removed');
}
