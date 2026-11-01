import type { Prisma } from '../../../generated/prisma/client.ts';
import { ID_SELECT, prisma } from '../../../lib/prisma.ts';
import { countUsersWhoCanSignIn, USER_SELECT, type NewSession, type UserRow } from '../auth.repository.ts';

type NewUser = Pick<Prisma.UserUncheckedCreateInput, 'name' | 'role' | 'webauthnUserId'>;

type NewPasskey = Omit<Prisma.PasskeyUncheckedCreateInput, 'id' | 'createdAt' | 'updatedAt' | 'sessions' | 'userId'>;

type NewSessionTimes = Pick<NewSession, 'tokenHash' | 'signedInAt' | 'lastSeenAt'>;

type CompletedSetup = {
  user: NewUser;
  passkey: NewPasskey;
  session: NewSessionTimes;
};

export const setupRepository = {
  // Every way in goes: sessions, passkeys, usernames and passwords, challenges and setup codes. The user rows stay,
  // because their collections and items belong to them (deleting a user deletes those). All or nothing: a reset
  // that fails halfway must not leave, say, the passkeys gone but the old setup code still valid.
  deleteEverySignIn: async (): Promise<void> => {
    await prisma.$transaction([
      prisma.session.deleteMany(),
      prisma.passkey.deleteMany(),
      prisma.user.updateMany({ data: { username: null, passwordHash: null, temporaryPasswordExpiresAt: null } }),
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
};
