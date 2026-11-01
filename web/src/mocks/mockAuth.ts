// The mock sign-in: the one user, their passkeys, password and which page the app opens on.
import { AuthStateUtil, UserRoleUtil, type AuthStateUtil as AuthState } from '@app-types/utility';
import type { MockAuth, MockPasskeyRow } from './mockStore.type';
import { mockDate, mockEnv } from './mockStoreUtils';

// The first-run code the mocks accept, as the server would print it in /setup?code=...
export const MOCK_SETUP_CODE = 'funko-first-run';
const MOCK_USER_NAME = 'Mario';
// The one mock user's id: what the images they upload record as their uploader.
export const MOCK_USER_ID = 1;

const SEED_PASSKEYS: MockPasskeyRow[] = [
  {
    id: 'cGFzc2tleS1pcGhvbmU',
    name: 'iPhone',
    isSynced: true,
    createdAt: mockDate(20),
    lastUsedAt: mockDate(40),
  },
  {
    id: 'cGFzc2tleS15dWJpa2V5',
    name: 'YubiKey',
    isSynced: false,
    createdAt: mockDate(3),
    lastUsedAt: null,
  },
];

const AUTH_STATES = Object.values(AuthStateUtil);

function isAuthState(value: string | undefined): value is AuthState {
  return AUTH_STATES.some((state) => state === value);
}

// Mock mode can open on the login or the first-run page (VITE_MOCK_AUTH_STATE=signedOut / setup); signed in
// otherwise, so dev, Vitest and Playwright see the app as before.
export const initialAuthState = isAuthState(mockEnv.VITE_MOCK_AUTH_STATE)
  ? mockEnv.VITE_MOCK_AUTH_STATE
  : AuthStateUtil.SIGNED_IN;

export function createMockAuth(state: AuthState): MockAuth {
  const hasUser = state !== AuthStateUtil.SETUP;

  return {
    state,
    userName: hasUser ? MOCK_USER_NAME : '',
    username: null,
    role: UserRoleUtil.ADMIN,
    isReadOnly: false,
    password: null,
    mustChangePassword: false,
    isSignInRecent: true,
    passkeys: hasUser ? SEED_PASSKEYS.map((passkey) => ({ ...passkey })) : [],
  };
}
