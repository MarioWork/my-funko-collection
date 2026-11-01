// Who the mock app is signed in as: the mock user (an admin), or a persona who shows another set of UI states. Picked
// at page load with VITE_MOCK_PERSONA (`yarn dev:member`, `yarn dev:read-only`...), by a test through
// setMockPersona(), or later by a password sign-in (the dev sign-in picker on the sign-in page).
import { AuthStateUtil, UserStateUtil } from '@app-types/utility';
import type { MockAuth, MockStore, MockUserRow } from './mockStore.type';
import { mockEnv } from './mockStoreUtils';
import {
  isWorkingMockAdmin,
  MOCK_NEW_USER_ID,
  MOCK_OTHER_ADMIN_ID,
  MOCK_PERSONA_MEMBER_ID,
  MOCK_READ_ONLY_ADMIN_ID,
  MOCK_READ_ONLY_MEMBER_ID,
  mockUserRowOf,
} from './mockUsers';

// With none picked (Vitest, Playwright, plain VITE_USE_MOCKS), the mock user is signed in: an admin tests can lean on.
export const MockPersona = {
  // leia: an admin with every notification kind, who reviews every submission status.
  ADMIN: 'admin',
  // rey: submissions in every state and every notification a member gets.
  MEMBER: 'member',
  // poe: a read-only member.
  READ_ONLY: 'read-only',
  // lando: a read-only admin.
  READ_ONLY_ADMIN: 'read-only-admin',
  // finn: a new user who must still replace his temporary password, so the app opens on /set-password.
  NEW_USER: 'new-user',
  // leia, with every other admin read-only: the controls locked for the last admin.
  LAST_ADMIN: 'last-admin',
} as const;
export type MockPersona = (typeof MockPersona)[keyof typeof MockPersona];

type SignIn = Pick<MockStore, 'auth' | 'users'>;

const PERSONA_USER_ID_MAP: Record<MockPersona, number> = {
  [MockPersona.ADMIN]: MOCK_OTHER_ADMIN_ID,
  [MockPersona.LAST_ADMIN]: MOCK_OTHER_ADMIN_ID,
  [MockPersona.MEMBER]: MOCK_PERSONA_MEMBER_ID,
  [MockPersona.READ_ONLY]: MOCK_READ_ONLY_MEMBER_ID,
  [MockPersona.READ_ONLY_ADMIN]: MOCK_READ_ONLY_ADMIN_ID,
  [MockPersona.NEW_USER]: MOCK_NEW_USER_ID,
};

const PERSONAS = Object.values(MockPersona);

function isMockPersona(value: string | undefined): value is MockPersona {
  return PERSONAS.some((persona) => persona === value);
}

export const initialMockPersona = isMockPersona(mockEnv.VITE_MOCK_PERSONA) ? mockEnv.VITE_MOCK_PERSONA : undefined;

// The browser becomes `user`'s, as signing in with their password does: their name, role, read-only setting and the
// temporary password still to replace. The user leaving goes back among the others, with what changed while they
// were signed in, so `users` stays everyone but the signed-in one.
export function signedInAs({ auth, users }: SignIn, user: MockUserRow): SignIn {
  const hasLeavingUser = auth.state !== AuthStateUtil.SETUP;
  const others = users.filter((row) => row.id !== user.id);
  const everyoneElse = hasLeavingUser ? [...others, mockUserRowOf(auth)] : others;
  const signedInAuth: MockAuth = {
    ...auth,
    userId: user.id,
    userName: user.name,
    username: user.username,
    role: user.role,
    isReadOnly: user.isReadOnly,
    password: user.password,
    mustChangePassword: user.state === UserStateUtil.TEMPORARY_PASSWORD,
    passkeys: [],
  };

  return { auth: signedInAuth, users: everyoneElse.toSorted((first, second) => first.id - second.id) };
}

// Every other admin made read-only, so the signed-in admin is the last one who can make changes.
function withOnlyAdminLeft({ auth, users }: SignIn): SignIn {
  const lockedUsers = users.map((user) => (isWorkingMockAdmin(user) ? { ...user, isReadOnly: true } : user));

  return { auth, users: lockedUsers };
}

// The sign-in a persona starts with; the mock user's with none. Before the first run there is nobody to be.
export function withMockPersona(signIn: SignIn, persona: MockPersona | undefined): SignIn {
  if (persona === undefined || signIn.auth.state === AuthStateUtil.SETUP) return signIn;

  const personaUser = signIn.users.find((user) => user.id === PERSONA_USER_ID_MAP[persona]);
  const personaSignIn = personaUser ? signedInAs(signIn, personaUser) : signIn;

  return persona === MockPersona.LAST_ADMIN ? withOnlyAdminLeft(personaSignIn) : personaSignIn;
}
