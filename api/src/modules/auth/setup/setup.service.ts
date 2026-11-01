import { HttpError, UnauthorizedError } from '../../../lib/httpErrors.ts';
import { createSecureToken, hashSecureToken } from '../../../lib/secureToken.ts';
import type { RegistrationOptionsResponse } from '../auth.schema.ts';
import {
  APP_ORIGIN,
  PASSKEY_FAILED_MESSAGE,
  buildRegistrationOptions,
  createWebauthnUserId,
  isSetUp,
  log,
  newSessionRow,
  storeChallenge,
  takeSignedChallenge,
  toSignedInResponse,
  verifyNewPasskey,
  type NewSessionToken,
} from '../auth.service.ts';
import { setupRepository } from './setup.repository.ts';
import type { SetupOptions, SetupVerify } from './setup.schema.ts';

const DEFAULT_PASSKEY_NAME = 'Passkey';
const SETUP_PATH = '/setup';
const SETUP_CODE_MESSAGE = 'This setup link is wrong or was already used';
const ALREADY_SET_UP_MESSAGE = 'The app is already set up. Sign in instead.';

async function assertSetupCode(code: string): Promise<void> {
  const isValid = await setupRepository.hasSetupCode(hashSecureToken(code));

  if (!isValid) throw new UnauthorizedError(SETUP_CODE_MESSAGE, 'INVALID_SETUP_CODE');
}

async function assertNotSetUp(): Promise<void> {
  if (await isSetUp()) throw new HttpError(ALREADY_SET_UP_MESSAGE, { code: 'ALREADY_SET_UP', statusCode: 409 });
}

// When nobody has set the app up, a fresh one-time code (the old one stops working). Undefined otherwise.
// Called on every boot, and by yarn auth:reset after deleteSignIns.
export async function addSetupCode(): Promise<string | undefined> {
  if (await isSetUp()) return undefined;

  const code = createSecureToken();
  await setupRepository.replaceSetupCode(hashSecureToken(code));

  return code;
}

// The lockout way back (yarn auth:reset): every passkey, password and session goes. The users stay, and with them
// their collections; the next setup gives the first user a way back in.
export async function deleteSignIns(): Promise<void> {
  await setupRepository.deleteEverySignIn();
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

  const user = await setupRepository.completeSetup({
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
