import type { AuthChallengePurpose, Prisma, UserRole as DbUserRole } from '../../generated/prisma/client.ts';
import { deletedIdOrUndefined, ID_SELECT, prisma, type DbExecutor } from '../../lib/prisma.ts';
import type { UserRole } from './auth.schema.ts';

// USER_ROLES (auth.schema.ts) and the Prisma `UserRole` enum must hold the same values: this fails to compile when
// either side has a role the other lacks. The tuples stop TypeScript from checking each role on its own.
type RolesMatch = [DbUserRole] extends [UserRole] ? ([UserRole] extends [DbUserRole] ? true : false) : false;
const ROLES_MATCH: RolesMatch = true;
void ROLES_MATCH;

const USER_SELECT = {
  id: true,
  name: true,
  username: true,
  role: true,
  webauthnUserId: true,
} as const satisfies Prisma.UserSelect;

const PASSKEY_SELECT = {
  id: true,
  credentialId: true,
  userId: true,
  name: true,
  publicKey: true,
  counter: true,
  transports: true,
  isSynced: true,
  lastUsedAt: true,
  createdAt: true,
} as const satisfies Prisma.PasskeySelect;

const SESSION_SELECT = {
  tokenHash: true,
  userId: true,
  signedInAt: true,
  lastSeenAt: true,
  user: { select: { name: true, username: true, role: true } },
} as const satisfies Prisma.SessionSelect;

const PASSWORD_USER_SELECT = { ...USER_SELECT, passwordHash: true } as const satisfies Prisma.UserSelect;

const CHALLENGE_SELECT = { challenge: true, webauthnUserId: true } as const satisfies Prisma.AuthChallengeSelect;

type NewUser = Pick<Prisma.UserUncheckedCreateInput, 'name' | 'role' | 'webauthnUserId'>;

type NewPasskey = Omit<Prisma.PasskeyUncheckedCreateInput, 'id' | 'createdAt' | 'updatedAt' | 'sessions'>;

type NewSession = Pick<
  Prisma.SessionUncheckedCreateInput,
  'tokenHash' | 'userId' | 'signInMethod' | 'passkeyId' | 'signedInAt' | 'lastSeenAt'
>;

type NewAuthChallenge = Pick<
  Prisma.AuthChallengeUncheckedCreateInput,
  'challenge' | 'purpose' | 'webauthnUserId' | 'expiresAt'
>;

type PasskeyUse = { counter: number; isSynced: boolean; lastUsedAt: Date };

type NewSessionTimes = Pick<NewSession, 'tokenHash' | 'signedInAt' | 'lastSeenAt'>;

type CompletedSetup = {
  user: NewUser;
  passkey: Omit<NewPasskey, 'userId'>;
  session: NewSessionTimes;
};

type CompletedPasswordSignIn = {
  previousTokenHash: string | undefined;
  session: NewSession;
};

type NewPassword = { userId: number; username: string; passwordHash: string; keepTokenHash: string };

type CompletedSignIn = {
  passkeyId: number;
  passkeyUse: PasskeyUse;
  previousTokenHash: string | undefined;
  session: NewSession;
};

type UserRow = Prisma.UserGetPayload<{ select: typeof USER_SELECT }>;

type TakenChallenge = { challenge: string; webauthnUserId: string | null };

// The app is set up once someone can sign in: a user with a passkey or a password. A user row alone is not enough:
// yarn auth:reset keeps the users (their collections hang off them) and takes away every way in.
function countUsersWhoCanSignIn(executor: DbExecutor = prisma): Promise<number> {
  return executor.user.count({ where: { OR: [{ passkeys: { some: {} } }, { passwordHash: { not: null } }] } });
}

async function deleteSession(tokenHash: string, executor: DbExecutor = prisma): Promise<void> {
  await executor.session.deleteMany({ where: { tokenHash } });
}

async function findSession(tokenHash: string) {
  const session = await prisma.session.findUnique({ where: { tokenHash }, select: SESSION_SELECT });

  if (!session) return undefined;

  const { user, ...times } = session;

  return { ...times, userName: user.name, username: user.username, userRole: user.role };
}

async function findPasskey(credentialId: string) {
  return (await prisma.passkey.findUnique({ where: { credentialId }, select: PASSKEY_SELECT })) ?? undefined;
}

export const authRepository = {
  // There is one user at most; the app is single-person by design.
  findUser: async (): Promise<UserRow | undefined> =>
    (await prisma.user.findFirst({ select: USER_SELECT })) ?? undefined,

  countUsersWhoCanSignIn,

  // Every way in goes: sessions, passkeys, usernames and passwords, challenges and setup codes. The user rows stay,
  // because their collections and items belong to them (deleting a user deletes those). All or nothing: a reset
  // that fails halfway must not leave, say, the passkeys gone but the old setup code still valid.
  deleteEverySignIn: async (): Promise<void> => {
    await prisma.$transaction([
      prisma.session.deleteMany(),
      prisma.passkey.deleteMany(),
      prisma.user.updateMany({ data: { username: null, passwordHash: null } }),
      prisma.authChallenge.deleteMany(),
      prisma.setupCode.deleteMany(),
    ]);
  },

  replaceSetupCode: async (codeHash: string): Promise<void> => {
    await prisma.$transaction([
      prisma.setupCode.deleteMany(),
      prisma.setupCode.create({ data: { codeHash }, select: ID_SELECT }),
    ]);
  },

  hasSetupCode: async (codeHash: string): Promise<boolean> => {
    const row = await prisma.setupCode.findUnique({ where: { codeHash }, select: ID_SELECT });

    return row !== null;
  },

  // Expired challenges are swept whenever a new one is made, so the table stays a handful of rows.
  createChallenge: async (data: NewAuthChallenge): Promise<void> => {
    await prisma.$transaction([
      prisma.authChallenge.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
      prisma.authChallenge.create({ data, select: ID_SELECT }),
    ]);
  },

  // Single use: only an unexpired one of the right purpose counts, and only the caller whose delete removed the row
  // gets it back, so two requests racing with the same challenge cannot both use it.
  takeChallenge: (challenge: string, purpose: AuthChallengePurpose): Promise<TakenChallenge | undefined> =>
    prisma.$transaction(async (tx) => {
      const where = { challenge, purpose, expiresAt: { gt: new Date() } };
      const found = await tx.authChallenge.findFirst({ where, select: CHALLENGE_SELECT });

      if (!found) return undefined;

      const { count } = await tx.authChallenge.deleteMany({ where });

      return count === 0 ? undefined : found;
    }),

  findPasskey,

  // Usernames are stored lower-case, so the caller lower-cases what was typed.
  findUserByUsername: async (username: string) =>
    (await prisma.user.findUnique({ where: { username }, select: PASSWORD_USER_SELECT })) ?? undefined,

  // A new password ends every other session a password opened (one may have used the old password), all or
  // nothing. Passkey sessions stay: a leaked password could not have opened them. The service checks the username
  // first; one taken in between fails the unique index, which the error handler answers as a 409.
  setPassword: (password: NewPassword): Promise<UserRow> =>
    prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: password.userId },
        data: { username: password.username, passwordHash: password.passwordHash },
        select: USER_SELECT,
      });
      await tx.session.deleteMany({
        where: { userId: password.userId, signInMethod: 'PASSWORD', tokenHash: { not: password.keepTokenHash } },
      });

      return user;
    }),

  listPasskeys: (userId: number) =>
    prisma.passkey.findMany({
      where: { userId },
      select: PASSKEY_SELECT,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    }),

  countPasskeys: (userId: number): Promise<number> => prisma.passkey.count({ where: { userId } }),

  createPasskey: (data: NewPasskey) => prisma.passkey.create({ data, select: PASSKEY_SELECT }),

  // The sessions it opened go with it (foreign key cascade).
  deletePasskey: async (id: number): Promise<{ id: number } | undefined> => {
    const write = await prisma.passkey.deleteMany({ where: { id } });

    return deletedIdOrUndefined(id, write);
  },

  findSession,

  touchSession: async (tokenHash: string, lastSeenAt: Date): Promise<void> => {
    await prisma.session.updateMany({ where: { tokenHash }, data: { lastSeenAt } });
  },

  deleteSession,

  deleteUserSessions: async (userId: number): Promise<void> => {
    await prisma.session.deleteMany({ where: { userId } });
  },

  // Sessions past either timeout; swept on each sign-in so old rows never pile up.
  deleteExpiredSessions: async (signedInBefore: Date, lastSeenBefore: Date): Promise<void> => {
    await prisma.session.deleteMany({
      where: { OR: [{ signedInAt: { lt: signedInBefore } }, { lastSeenAt: { lt: lastSeenBefore } }] },
    });
  },

  // First run, all or nothing: the user, their first passkey and session appear together and the setup code goes.
  // After yarn auth:reset the first user is still there, with their collections: setup gives them back a way in
  // (the new passkey's user handle, the name typed now) instead of making a second user. A brand-new user gets
  // their "Owned" and "Wishlist" from the database trigger.
  // Returns undefined when someone else finished setup first (the count is checked inside the transaction).
  completeSetup: (setup: CompletedSetup): Promise<UserRow | undefined> =>
    prisma.$transaction(async (tx) => {
      // Two setups racing would both count 0 under Postgres's default isolation. The lock makes the second wait
      // for the first to commit, then it counts 1 and stops. It ends with the transaction. Passkeys are locked
      // too: the count reads them, and the first setup inserts one.
      await tx.$executeRaw`lock table users, passkeys in share row exclusive mode`;

      const isAlreadySetUp = (await countUsersWhoCanSignIn(tx)) > 0;

      if (isAlreadySetUp) return undefined;

      const firstUser = await tx.user.findFirst({ orderBy: { id: 'asc' }, select: ID_SELECT });
      const user = firstUser
        ? await tx.user.update({ where: { id: firstUser.id }, data: setup.user, select: USER_SELECT })
        : await tx.user.create({ data: setup.user, select: USER_SELECT });
      const passkey = await tx.passkey.create({ data: { ...setup.passkey, userId: user.id }, select: ID_SELECT });

      await tx.session.create({
        data: { ...setup.session, userId: user.id, signInMethod: 'PASSKEY', passkeyId: passkey.id },
        select: ID_SELECT,
      });
      await tx.setupCode.deleteMany();

      return user;
    }),

  // A password sign-in: the old session of this browser (if any) out, the new one in.
  completePasswordSignIn: (signIn: CompletedPasswordSignIn): Promise<void> =>
    prisma.$transaction(async (tx) => {
      if (signIn.previousTokenHash) await deleteSession(signIn.previousTokenHash, tx);

      await tx.session.create({ data: signIn.session, select: ID_SELECT });
    }),

  // A sign-in: the passkey's new counter, the old session of this browser (if any) out, the new one in.
  completeSignIn: (signIn: CompletedSignIn): Promise<void> =>
    prisma.$transaction(async (tx) => {
      await tx.passkey.updateMany({ where: { id: signIn.passkeyId }, data: signIn.passkeyUse });

      if (signIn.previousTokenHash) await deleteSession(signIn.previousTokenHash, tx);

      await tx.session.create({ data: signIn.session, select: ID_SELECT });
    }),
};

// Re-exported so the service can name a challenge's purpose without importing the generated client.
export type { AuthChallengePurpose };

export type PasskeyRow = NonNullable<Awaited<ReturnType<typeof findPasskey>>>;
export type SessionRow = NonNullable<Awaited<ReturnType<typeof findSession>>>;
