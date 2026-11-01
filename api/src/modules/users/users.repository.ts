import type { Prisma } from '../../generated/prisma/client.ts';
import { toOrderDirection, toSkipTake } from '../../lib/pagination.ts';
import { prisma } from '../../lib/prisma.ts';
import type { UserRole } from '../auth/auth.type.ts';
import type { ListUsersQuery, UpdateUser, UserSortField } from './users.schema.ts';

// Never the password hash itself: only whether there is one, through `hasPassword` below.
const USER_SELECT = {
  id: true,
  name: true,
  username: true,
  role: true,
  isReadOnly: true,
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

type NewPassword = {
  username: string;
  passwordHash: string;
  temporaryPasswordExpiresAt: Date;
};

// What a guarded change did: the user as it is now, missing (no such user), or refused because it would leave
// no admin.
export type GuardedChange<Result> = { result: Result } | { isMissing: true } | { isLastAdmin: true };

type Transaction = Prisma.TransactionClient;

// What the last-admin rule looks at on a user, before or after a change.
type AdminStanding = { role: UserRole; isReadOnly: boolean };

// An admin who can still change things: the rule keeps at least one.
const WORKING_ADMIN_WHERE = { role: 'ADMIN', isReadOnly: false } as const satisfies Prisma.UserWhereInput;

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

// Two admins demoting or deleting each other at once would both count two admins under Postgres's default
// isolation. The lock makes the second wait for the first to commit, then count again. It ends with the
// transaction (the same lock auth.repository.ts takes for first-run setup).
async function lockUsers(tx: Transaction): Promise<void> {
  await tx.$executeRaw`lock table users in share row exclusive mode`;
}

// Admins who are not read-only: a read-only admin can't change anything, so they don't count towards the rule.
async function countAdmins(client: Transaction | typeof prisma = prisma): Promise<number> {
  return client.user.count({ where: WORKING_ADMIN_WHERE });
}

// An admin who is not read-only: the last-admin rule keeps at least one. The service marks that user `isLastAdmin`.
export function isWorkingAdmin({ role, isReadOnly }: AdminStanding): boolean {
  return role === 'ADMIN' && !isReadOnly;
}

// Runs `change` on an existing user inside one locked transaction, unless it would take away the last admin who
// can change things: that is when the user is one, `isLeavingAdmins` says the change ends that, and they are the
// only one.
async function guardLastAdmin<Result>(
  userId: number,
  isLeavingAdmins: (current: AdminStanding) => boolean,
  change: (tx: Transaction, current: AdminStanding) => Promise<Result>,
): Promise<GuardedChange<Result>> {
  return prisma.$transaction(async (tx) => {
    await lockUsers(tx);

    const user = await tx.user.findUnique({ where: { id: userId }, select: { role: true, isReadOnly: true } });

    if (!user) return { isMissing: true };

    const isOnlyAdmin = isWorkingAdmin(user) && (await countAdmins(tx)) === 1;

    if (isOnlyAdmin && isLeavingAdmins(user)) return { isLastAdmin: true };

    return { result: await change(tx, user) };
  });
}

// The user as a change leaves them: what it sends replaces what is there, what it leaves out stays.
function standingAfter(current: AdminStanding, change: UpdateUser): AdminStanding {
  return { role: change.role ?? current.role, isReadOnly: change.isReadOnly ?? current.isReadOnly };
}

function isSameStanding(current: AdminStanding, next: AdminStanding): boolean {
  return current.role === next.role && current.isReadOnly === next.isReadOnly;
}

export const usersRepository = {
  list: async (query: ListUsersQuery) => {
    const [rows, totalResultNumber] = await prisma.$transaction([
      prisma.user.findMany({ select: USER_SELECT, orderBy: orderBy(query), ...toSkipTake(query) }),
      prisma.user.count(),
    ]);

    return { data: rows.map(toRow), totalResultNumber };
  },

  // Usernames are stored lower-case, so the caller lower-cases what was typed. `exceptUserId` is the user the
  // username is for: their own does not count as taken.
  isUsernameTaken: async (username: string, exceptUserId?: number): Promise<boolean> => {
    const holders = await prisma.user.count({ where: { username, id: { not: exceptUserId } } });

    return holders > 0;
  },

  // The database trigger gives the new user their own "Owned" (the default) and "Wishlist". A username taken in
  // between the service's check and this insert fails the unique index, which the error handler answers as a 409.
  create: async (data: NewUser): Promise<UserRow> => toRow(await prisma.user.create({ data, select: USER_SELECT })),

  findById: async (id: number): Promise<UserRow | undefined> => {
    const row = await prisma.user.findUnique({ where: { id }, select: USER_SELECT });

    return row ? toRow(row) : undefined;
  },

  countAdmins: (): Promise<number> => countAdmins(),

  // A new role or read-only setting, and every session of the user ends with it, in one go. A change that leaves
  // both as they were keeps the sessions.
  update: (userId: number, change: UpdateUser): Promise<GuardedChange<UserRow>> =>
    guardLastAdmin(
      userId,
      (current) => !isWorkingAdmin(standingAfter(current, change)),
      async (tx, current) => {
        const next = standingAfter(current, change);

        if (!isSameStanding(current, next)) {
          await tx.user.update({ where: { id: userId }, data: next, select: { id: true } });
          await tx.session.deleteMany({ where: { userId } });
        }

        return toRow(await tx.user.findUniqueOrThrow({ where: { id: userId }, select: USER_SELECT }));
      },
    ),

  // A new temporary password (and username, when one is given) replaces the old password, and every session of
  // the user ends, in one go. Undefined when there is no such user.
  setTemporaryPassword: (userId: number, password: NewPassword): Promise<UserRow | undefined> =>
    prisma.$transaction(async (tx) => {
      const updated = await tx.user.updateMany({ where: { id: userId }, data: password });

      if (updated.count === 0) return undefined;

      await tx.session.deleteMany({ where: { userId } });

      return toRow(await tx.user.findUniqueOrThrow({ where: { id: userId }, select: USER_SELECT }));
    }),

  // The database removes what belongs to the user with them: sessions, passkeys, collections (and their items),
  // tags. Images they uploaded stay, with no uploader (a removed user); catalogue funkos are nobody's.
  delete: (userId: number): Promise<GuardedChange<true>> =>
    guardLastAdmin(
      userId,
      () => true,
      async (tx) => {
        await tx.user.delete({ where: { id: userId }, select: { id: true } });

        return true as const;
      },
    ),
};
