// The other users of the mock app, next to the signed-in one (mockAuth.ts): what the Users page lists. One of each
// state an admin can meet, with fixed dates so tests can name them.
import { UserRoleUtil, UserStateUtil } from '@app-types/utility';
import { MOCK_USER_ID } from './mockAuth';
import type { UserApiModel } from '@app-types/models';
import type { MockAuth, MockUserRow } from './mockStore.type';
import { mockDate, nowIso } from './mockStoreUtils';
import { DEV_SIGN_IN_PASSWORD } from '@utils/devPasswordUtils';

const DAY_MS = 24 * 60 * 60 * 1000;
// A temporary password stops working this long after it was made, as on the API.
const TEMPORARY_PASSWORD_LIFETIME_MS = 7 * DAY_MS;
// The temporary password Luke was given; a password sign-in with it works in mock mode until it expires.
export const MOCK_TEMPORARY_PASSWORD = 'hjkmn-pqrst-vwxyz-23456';
// Luke, a member: the other user tests name when they need someone who is not the signed-in user.
export const MOCK_MEMBER_ID = MOCK_USER_ID + 2;
// Han, the other member (his temporary password has run out).
export const MOCK_SECOND_MEMBER_ID = MOCK_USER_ID + 3;
// The dev sign-in personas (@utils/devSignInUtils), next to leia: rey (a member with submissions in every state),
// poe (a read-only member), lando (a read-only admin) and finn (a new user who must still replace his temporary
// password).
export const MOCK_OTHER_ADMIN_ID = MOCK_USER_ID + 1;
export const MOCK_PERSONA_MEMBER_ID = MOCK_USER_ID + 4;
export const MOCK_READ_ONLY_MEMBER_ID = MOCK_USER_ID + 5;
export const MOCK_READ_ONLY_ADMIN_ID = MOCK_USER_ID + 6;
export const MOCK_NEW_USER_ID = MOCK_USER_ID + 7;

// The personas sign in with the dev password only in a dev server, Vitest and Playwright (which loads the mocks in
// plain Node, with no import.meta.env). Written inline so a build folds it away: the demo build never holds it.
const PERSONA_PASSWORD = import.meta.env === undefined || import.meta.env.DEV ? DEV_SIGN_IN_PASSWORD : null;
// Far in the future, so the mock clock never reaches it.
const NEVER_EXPIRES = '2099-01-01T00:00:00.000Z';

type PersonaRowOptions = Pick<MockUserRow, 'id' | 'username' | 'role' | 'isReadOnly'> & { day: number };

// A persona who has their own password: active, signing in with the dev password.
function personaRow({ id, username, role, isReadOnly, day }: PersonaRowOptions): MockUserRow {
  return {
    id,
    name: username ?? '',
    username,
    role,
    isReadOnly,
    state: UserStateUtil.ACTIVE,
    temporaryPasswordExpiresAt: null,
    createdAt: mockDate(day),
    password: PERSONA_PASSWORD,
  };
}

export function createMockUsers(): MockUserRow[] {
  return [
    personaRow({ id: MOCK_OTHER_ADMIN_ID, username: 'leia', role: UserRoleUtil.ADMIN, isReadOnly: false, day: 30 }),
    {
      id: MOCK_MEMBER_ID,
      name: 'luke',
      username: 'luke',
      role: UserRoleUtil.MEMBER,
      isReadOnly: false,
      state: UserStateUtil.TEMPORARY_PASSWORD,
      temporaryPasswordExpiresAt: NEVER_EXPIRES,
      createdAt: mockDate(60),
      password: MOCK_TEMPORARY_PASSWORD,
    },
    {
      id: MOCK_SECOND_MEMBER_ID,
      name: 'han',
      username: 'han',
      role: UserRoleUtil.MEMBER,
      isReadOnly: false,
      state: UserStateUtil.TEMPORARY_PASSWORD_EXPIRED,
      temporaryPasswordExpiresAt: mockDate(97),
      createdAt: mockDate(90),
      password: 'scruffy-looking-nerf-herder',
    },
    personaRow({ id: MOCK_PERSONA_MEMBER_ID, username: 'rey', role: UserRoleUtil.MEMBER, isReadOnly: false, day: 33 }),
    personaRow({ id: MOCK_READ_ONLY_MEMBER_ID, username: 'poe', role: UserRoleUtil.MEMBER, isReadOnly: true, day: 34 }),
    personaRow({ id: MOCK_READ_ONLY_ADMIN_ID, username: 'lando', role: UserRoleUtil.ADMIN, isReadOnly: true, day: 35 }),
    {
      id: MOCK_NEW_USER_ID,
      name: 'finn',
      username: 'finn',
      role: UserRoleUtil.MEMBER,
      isReadOnly: false,
      state: UserStateUtil.TEMPORARY_PASSWORD,
      temporaryPasswordExpiresAt: NEVER_EXPIRES,
      createdAt: mockDate(36),
      password: PERSONA_PASSWORD,
    },
  ];
}

// The signed-in user as a row of the list.
export function mockUserRowOf(auth: MockAuth): MockUserRow {
  const hasOwnSignIn = auth.password !== null || auth.passkeys.length > 0;
  const ownState = hasOwnSignIn ? UserStateUtil.ACTIVE : UserStateUtil.NO_SIGN_IN;

  return {
    id: auth.userId,
    name: auth.userName,
    username: auth.username,
    role: auth.role,
    isReadOnly: auth.isReadOnly,
    state: auth.mustChangePassword ? UserStateUtil.TEMPORARY_PASSWORD : ownState,
    temporaryPasswordExpiresAt: null,
    createdAt: mockDate(0),
    password: auth.password,
  };
}

// When a temporary password made now stops working: 7 days from the mock clock's now.
export function temporaryPasswordExpiryFrom(madeAt: string): string {
  return new Date(new Date(madeAt).getTime() + TEMPORARY_PASSWORD_LIFETIME_MS).toISOString();
}

// The app-made temporary password the mocks hand out for a user id: fixed, so tests can name it.
export function mockTemporaryPasswordFor(id: number): string {
  return `vinyl-${String(id).padStart(5, '0')}-shelf-heads`;
}

// What the last-admin rule looks at on a user, before or after a change.
export type MockAdminStanding = Pick<MockUserRow, 'role' | 'isReadOnly'>;

// An admin who can still make changes: there is always at least one, as on the API.
export function isWorkingMockAdmin({ role, isReadOnly }: MockAdminStanding): boolean {
  return role === UserRoleUtil.ADMIN && !isReadOnly;
}

// A row as the API answers it: never a password, and whether it is the only admin left who can make changes.
export function toMockUserModel({ password: _password, ...user }: MockUserRow, everyone: MockUserRow[]): UserApiModel {
  const adminCount = everyone.filter(isWorkingMockAdmin).length;

  return { ...user, isLastAdmin: isWorkingMockAdmin(user) && adminCount === 1 };
}

// A new user with an app-made temporary password, dead 7 days from the mock clock's now.
export function newMockUserRow(id: number, username: string, role: UserRoleUtil): MockUserRow {
  const createdAt = nowIso();
  const expiresAt = temporaryPasswordExpiryFrom(createdAt);

  return {
    id,
    name: username,
    username,
    role,
    isReadOnly: false,
    state: UserStateUtil.TEMPORARY_PASSWORD,
    temporaryPasswordExpiresAt: expiresAt,
    createdAt,
    password: mockTemporaryPasswordFor(id),
  };
}
