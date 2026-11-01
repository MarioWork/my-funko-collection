import type { Prisma } from '../../../generated/prisma/client.ts';
import { toOrderDirection, toSkipTake } from '../../../lib/pagination.ts';
import { ID_SELECT, prisma } from '../../../lib/prisma.ts';
import type { UserRole } from '../../auth/auth.type.ts';
import { USER_SELECT, toRow, type UserRow } from '../users.repository.ts';
import type { ListUsersQuery, UserSortField } from './basics.schema.ts';

const SORT_FIELD_MAP: Record<UserSortField, 'username' | 'name' | 'createdAt'> = {
  USERNAME: 'username',
  NAME: 'name',
  CREATION_DATE: 'createdAt',
};

type NewUser = {
  name: string;
  username: string;
  role: UserRole;
  webauthnUserId: string;
  passwordHash: string;
  temporaryPasswordExpiresAt: Date;
};

// A user with no username (no password yet) sorts last in both directions.
function orderBy(query: ListUsersQuery): Prisma.UserOrderByWithRelationInput[] {
  const field = SORT_FIELD_MAP[query.sorting_fields];
  const direction = toOrderDirection(query.direction);
  const fieldOrder =
    field === 'username' ? { username: { sort: direction, nulls: 'last' as const } } : { [field]: direction };

  return [fieldOrder, { id: 'asc' }];
}

export const basicsRepository = {
  list: async (query: ListUsersQuery) => {
    const [rows, totalResultNumber] = await prisma.$transaction([
      prisma.user.findMany({ select: USER_SELECT, orderBy: orderBy(query), ...toSkipTake(query) }),
      prisma.user.count(),
    ]);

    return { data: rows.map(toRow), totalResultNumber };
  },

  // The database trigger gives the new user their own "Owned" (the default) and "Wishlist". A username taken in
  // between the service's check and this insert fails the unique index, which the error handler answers as a 409.
  create: async (data: NewUser): Promise<UserRow> => toRow(await prisma.user.create({ data, select: USER_SELECT })),

  // Every admin, read-only ones included: they still read what they are told.
  findAdminIds: async (): Promise<number[]> => {
    const rows = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: ID_SELECT });

    return rows.map((row) => row.id);
  },
};
