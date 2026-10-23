import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/browser';

// What @simplewebauthn/browser hands back after a ceremony, for tests that stub the browser prompt. The mocks
// accept any well-formed answer; the id is the seeded iPhone passkey's unless overridden.
const MOCK_CREDENTIAL_ID = 'cGFzc2tleS1pcGhvbmU';
const MOCK_CLIENT_DATA = 'eyJ0eXBlIjoid2ViYXV0aG4uZ2V0In0';

export const createAuthenticationResponseMockModel = (
  overrides?: Partial<AuthenticationResponseJSON>,
): AuthenticationResponseJSON => ({
  id: MOCK_CREDENTIAL_ID,
  rawId: MOCK_CREDENTIAL_ID,
  type: 'public-key',
  clientExtensionResults: {},
  authenticatorAttachment: 'platform',
  response: {
    clientDataJSON: MOCK_CLIENT_DATA,
    authenticatorData: 'SZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2MFAAAAAQ',
    signature: 'MEUCIQDmock',
    userHandle: 'bWFyaW8tdXNlci1pZA',
  },
  ...overrides,
});

export const createRegistrationResponseMockModel = (
  overrides?: Partial<RegistrationResponseJSON>,
): RegistrationResponseJSON => ({
  id: 'bmV3LXBhc3NrZXk',
  rawId: 'bmV3LXBhc3NrZXk',
  type: 'public-key',
  clientExtensionResults: {},
  authenticatorAttachment: 'platform',
  response: {
    clientDataJSON: MOCK_CLIENT_DATA,
    attestationObject: 'o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YVjEmock',
    transports: ['internal'],
  },
  ...overrides,
});
