import type { Prisma } from '../../generated/prisma/client.ts';
import { toOrderDirection, toSkipTake } from '../../lib/pagination.ts';
import { prisma } from '../../lib/prisma.ts';
import type { UserRole } from '../auth/auth.type.ts';
import type { ListUsersQuery, UserSortField } from './users.schema.ts';

// Never the password hash itself: only whether there is one, through `hasPassword` below.
const USER_SELECT = {
  id: true,
  name: true,
  username: true,
  role: true,
  temporaryPasswordExpiresAt: true,
  createdAt: true,
  passwordHash: true,
  _count: { select: { passkeys: true } },
} as const satisfies Prisma.UserSelect;

const SORT_FIELD_MAP: Record<UserSortField, 'username' | 'name' | 'createdAt'> = {
  USERNAME: 'username',
  NAME: 'name',
  CREATION_DATE: 'createdAt',
};

type SelectedUser = Prisma.UserGetPayload<{ select: typeof USER_SELECT }>;

export type UserRow = Omit<SelectedUser, '_count' | 'passwordHash'> & { hasPassword: boolean; passkeyCount: number };

type NewUser = {
  name: string;
  username: string;
  role: UserRole;
  webauthnUserId: string;
  passwordHash: string;
  temporaryPasswordExpiresAt: Date;
};

function toRow({ _count, passwordHash, ...user }: SelectedUser): UserRow {
  return { ...user, hasPassword: passwordHash !== null, passkeyCount: _count.passkeys };
}

// A user with no username (no password yet) sorts last in both directions.
function orderBy(query: ListUsersQuery): Prisma.UserOrderByWithRelationInput[] {
  const field = SORT_FIELD_MAP[query.sorting_fields];
  const direction = toOrderDirection(query.direction);
  const fieldOrder =
    field === 'username' ? { username: { sort: direction, nulls: 'last' as const } } : { [field]: direction };

  return [fieldOrder, { id: 'asc' }];
}

export const usersRepository = {
  list: async (query: ListUsersQuery) => {
    const [rows, totalResultNumber] = await prisma.$transaction([
      prisma.user.findMany({ select: USER_SELECT, orderBy: orderBy(query), ...toSkipTake(query) }),
      prisma.user.count(),
    ]);

    return { data: rows.map(toRow), totalResultNumber };
  },

  // Usernames are stored lower-case, so the caller lower-cases what was typed.
  isUsernameTaken: async (username: string): Promise<boolean> => (await prisma.user.count({ where: { username } })) > 0,

  // The database trigger gives the new user their own "Owned" (the default) and "Wishlist". A username taken in
  // between the service's check and this insert fails the unique index, which the error handler answers as a 409.
  create: async (data: NewUser): Promise<UserRow> => toRow(await prisma.user.create({ data, select: USER_SELECT })),
};
