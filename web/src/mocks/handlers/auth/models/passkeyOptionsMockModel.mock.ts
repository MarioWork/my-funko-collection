import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser';

// Base64url of fixed strings, so the options are deterministic: "funko-mock-challenge" and "mario-user-id".
const MOCK_CHALLENGE = 'ZnVua28tbW9jay1jaGFsbGVuZ2U';
const MOCK_USER_ID = 'bWFyaW8tdXNlci1pZA';
const RELYING_PARTY_NAME = 'My Funko Collection';
const CEREMONY_TIMEOUT_MS = 60_000;
// ES256 and RS256, what every authenticator supports.
const ES256 = -7;
const RS256 = -257;

// The relying party is the page's own host (localhost in dev and tests), as the API derives it from its origin.
// A real authenticator (Chrome's virtual one under Playwright) refuses any other.
export const createCreationOptionsMockModel = (
  rpId: string,
  userName: string,
  excludeCredentialIds: string[] = [],
): PublicKeyCredentialCreationOptionsJSON => ({
  challenge: MOCK_CHALLENGE,
  rp: { name: RELYING_PARTY_NAME, id: rpId },
  user: { id: MOCK_USER_ID, name: userName, displayName: userName },
  pubKeyCredParams: [
    { type: 'public-key', alg: ES256 },
    { type: 'public-key', alg: RS256 },
  ],
  timeout: CEREMONY_TIMEOUT_MS,
  attestation: 'none',
  excludeCredentials: excludeCredentialIds.map((id) => ({ id, type: 'public-key' })),
  authenticatorSelection: { residentKey: 'required', userVerification: 'preferred' },
});

// Discoverable credentials: no allow list, the authenticator offers the passkeys it holds for this host.
export const createRequestOptionsMockModel = (rpId: string): PublicKeyCredentialRequestOptionsJSON => ({
  challenge: MOCK_CHALLENGE,
  rpId,
  timeout: CEREMONY_TIMEOUT_MS,
  userVerification: 'preferred',
  allowCredentials: [],
});
