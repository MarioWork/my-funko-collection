// A software passkey for tests: it answers registration and sign-in the way a phone or Bitwarden would, with a
// real Ed25519 key, so the server's checks run for real. Options let a test break one thing at a time.
import { isoCBOR } from '@simplewebauthn/server/helpers';
import { createHash, generateKeyPairSync, randomBytes, sign, type KeyObject } from 'node:crypto';
import { z } from 'zod';
import type { AuthenticationOptionsResponse, RegistrationOptionsResponse } from './auth.schema.ts';

const TEST_ORIGIN = 'http://localhost:5173';
const TEST_RP_ID = 'localhost';
const CREDENTIAL_ID_BYTES = 16;
const AAGUID = new Uint8Array(16);

// Authenticator data flags (WebAuthn §6.1): user present, user verified, backup eligible, backed up, has a key.
const FLAG_USER_PRESENT = 0x01;
const FLAG_USER_VERIFIED = 0x04;
const FLAG_BACKUP_ELIGIBLE = 0x08;
const FLAG_BACKED_UP = 0x10;
const FLAG_ATTESTED_CREDENTIAL = 0x40;

// COSE key for Ed25519: kty OKP (1), alg EdDSA (-8), crv Ed25519 (6), x = the raw public key.
const COSE_KTY = 1;
const COSE_ALG = 3;
const COSE_CRV = -1;
const COSE_X = -2;
const COSE_KTY_OKP = 1;
const COSE_ALG_EDDSA = -8;
const COSE_CRV_ED25519 = 6;

export type CeremonyOverrides = {
  origin?: string;
  rpId?: string;
  isUserVerified?: boolean;
  challenge?: string;
  userHandle?: string;
};

// The user handle the server put in the options; the passkey hands it back on every sign-in.
const OptionsUserSchema = z.object({ user: z.object({ id: z.string() }) });

function toBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64url');
}

function sha256(data: Uint8Array | string): Buffer {
  return createHash('sha256').update(data).digest();
}

function counterBytes(counter: number): Buffer {
  const bytes = Buffer.alloc(4);
  bytes.writeUInt32BE(counter);

  return bytes;
}

function flagsFor(overrides: CeremonyOverrides, hasCredential: boolean): number {
  const verified = overrides.isUserVerified === false ? 0 : FLAG_USER_VERIFIED;
  const credential = hasCredential ? FLAG_ATTESTED_CREDENTIAL : 0;

  return FLAG_USER_PRESENT | verified | FLAG_BACKUP_ELIGIBLE | FLAG_BACKED_UP | credential;
}

function clientData(type: string, challenge: string, overrides: CeremonyOverrides): string {
  const data = { type, challenge: overrides.challenge ?? challenge, origin: overrides.origin ?? TEST_ORIGIN };

  return JSON.stringify({ ...data, crossOrigin: false });
}

export class TestPasskey {
  readonly credentialId = toBase64Url(randomBytes(CREDENTIAL_ID_BYTES));
  private readonly privateKey: KeyObject;
  private readonly publicKeyX: Buffer;
  private counter = 0;
  private userHandle: string | undefined;

  constructor() {
    const { privateKey, publicKey } = generateKeyPairSync('ed25519');
    const jwk = publicKey.export({ format: 'jwk' });

    this.privateKey = privateKey;
    this.publicKeyX = Buffer.from(jwk.x ?? '', 'base64url');
  }

  private coseKey(): Uint8Array {
    return isoCBOR.encode(
      new Map<number, number | Uint8Array>([
        [COSE_KTY, COSE_KTY_OKP],
        [COSE_ALG, COSE_ALG_EDDSA],
        [COSE_CRV, COSE_CRV_ED25519],
        [COSE_X, new Uint8Array(this.publicKeyX)],
      ]),
    );
  }

  private authenticatorData(overrides: CeremonyOverrides, attested?: Uint8Array): Buffer {
    const rpIdHash = sha256(overrides.rpId ?? TEST_RP_ID);
    const flags = Buffer.from([flagsFor(overrides, attested !== undefined)]);
    const parts = [rpIdHash, flags, counterBytes(this.counter)];

    if (attested) parts.push(Buffer.from(attested));

    return Buffer.concat(parts);
  }

  // What the browser sends after navigator.credentials.create() with the server's options.
  register(options: RegistrationOptionsResponse, overrides: CeremonyOverrides = {}) {
    this.userHandle = OptionsUserSchema.safeParse(options).data?.user.id;

    const credentialId = Buffer.from(this.credentialId, 'base64url');
    const idLength = Buffer.alloc(2);
    idLength.writeUInt16BE(credentialId.length);
    const attested = Buffer.concat([AAGUID, idLength, credentialId, this.coseKey()]);
    const authData = this.authenticatorData(overrides, attested);
    const attestationObject = isoCBOR.encode(
      new Map<string, string | Map<string, string> | Uint8Array>([
        ['fmt', 'none'],
        ['attStmt', new Map<string, string>()],
        ['authData', new Uint8Array(authData)],
      ]),
    );

    return {
      id: this.credentialId,
      rawId: this.credentialId,
      type: 'public-key' as const,
      clientExtensionResults: {},
      response: {
        clientDataJSON: toBase64Url(Buffer.from(clientData('webauthn.create', options.challenge, overrides))),
        attestationObject: toBase64Url(attestationObject),
        transports: ['internal' as const],
      },
    };
  }

  // What the browser sends after navigator.credentials.get(): a signature over authData + hash(clientData).
  authenticate(options: AuthenticationOptionsResponse, overrides: CeremonyOverrides = {}) {
    this.counter += 1;

    const authData = this.authenticatorData(overrides);
    const clientDataJSON = Buffer.from(clientData('webauthn.get', options.challenge, overrides));
    const signature = sign(null, Buffer.concat([authData, sha256(clientDataJSON)]), this.privateKey);
    const userHandle = overrides.userHandle ?? this.userHandle;

    return {
      id: this.credentialId,
      rawId: this.credentialId,
      type: 'public-key' as const,
      clientExtensionResults: {},
      response: {
        clientDataJSON: toBase64Url(clientDataJSON),
        authenticatorData: toBase64Url(authData),
        signature: toBase64Url(signature),
        ...(userHandle ? { userHandle } : {}),
      },
    };
  }
}
