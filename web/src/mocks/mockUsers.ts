// The other users of the mock app, next to the signed-in one (mockAuth.ts): what the Users page lists. One of each
// state an admin can meet, with fixed dates so tests can name them.
import { UserRoleUtil, UserStateUtil } from '@app-types/utility';
import { MOCK_USER_ID } from './mockAuth';
import type { UserApiModel } from '@app-types/models';
import type { MockAuth, MockUserRow } from './mockStore.type';
import { mockDate, nowIso } from './mockStoreUtils';

const DAY_MS = 24 * 60 * 60 * 1000;
// A temporary password stops working this long after it was made, as on the API.
const TEMPORARY_PASSWORD_LIFETIME_MS = 7 * DAY_MS;
// The temporary password Luke was given; a password sign-in with it works in mock mode until it expires.
export const MOCK_TEMPORARY_PASSWORD = 'hjkmn-pqrst-vwxyz-23456';

export function createMockUsers(): MockUserRow[] {
  return [
    {
      id: MOCK_USER_ID + 1,
      name: 'leia',
      username: 'leia',
      role: UserRoleUtil.ADMIN,
      state: UserStateUtil.ACTIVE,
      temporaryPasswordExpiresAt: null,
      createdAt: mockDate(30),
      password: 'a princess of tiny vinyl heads',
    },
    {
      id: MOCK_USER_ID + 2,
      name: 'luke',
      username: 'luke',
      role: UserRoleUtil.MEMBER,
      state: UserStateUtil.TEMPORARY_PASSWORD,
      // Far in the future, so the mock clock never reaches it.
      temporaryPasswordExpiresAt: '2099-01-01T00:00:00.000Z',
      createdAt: mockDate(60),
      password: MOCK_TEMPORARY_PASSWORD,
    },
    {
      id: MOCK_USER_ID + 3,
      name: 'han',
      username: 'han',
      role: UserRoleUtil.MEMBER,
      state: UserStateUtil.TEMPORARY_PASSWORD_EXPIRED,
      temporaryPasswordExpiresAt: mockDate(97),
      createdAt: mockDate(90),
      password: 'scruffy-looking-nerf-herder',
    },
  ];
}

// The signed-in user as a row of the list.
export function mockUserRowOf(auth: MockAuth): MockUserRow {
  const hasOwnSignIn = auth.password !== null || auth.passkeys.length > 0;
  const ownState = hasOwnSignIn ? UserStateUtil.ACTIVE : UserStateUtil.NO_SIGN_IN;

  return {
    id: MOCK_USER_ID,
    name: auth.userName,
    username: auth.username,
    role: auth.role,
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

// A row as the API answers it: never a password, and whether it is the only admin left.
export function toMockUserModel({ password: _password, ...user }: MockUserRow, everyone: MockUserRow[]): UserApiModel {
  const adminCount = everyone.filter((row) => row.role === UserRoleUtil.ADMIN).length;

  return { ...user, isLastAdmin: user.role === UserRoleUtil.ADMIN && adminCount === 1 };
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
    state: UserStateUtil.TEMPORARY_PASSWORD,
    temporaryPasswordExpiresAt: expiresAt,
    createdAt,
    password: mockTemporaryPasswordFor(id),
  };
}
