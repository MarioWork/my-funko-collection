import { and, count, desc, eq, gt, lt, or } from 'drizzle-orm';
import { db, type DbExecutor } from '../../db/client.ts';
import {
  authChallenges,
  passkeys,
  sessions,
  setupCodes,
  users,
  type AuthChallengePurpose,
  type NewAuthChallenge,
  type NewPasskey,
  type NewSession,
  type NewUser,
} from '../../db/schema/index.ts';

const USER_COLUMNS = { id: users.id, name: users.name, webauthnUserId: users.webauthnUserId } as const;

const PASSKEY_COLUMNS = {
  id: passkeys.id,
  credentialId: passkeys.credentialId,
  userId: passkeys.userId,
  name: passkeys.name,
  publicKey: passkeys.publicKey,
  counter: passkeys.counter,
  transports: passkeys.transports,
  isSynced: passkeys.isSynced,
  lastUsedAt: passkeys.lastUsedAt,
  createdAt: passkeys.createdAt,
} as const;

const SESSION_COLUMNS = {
  tokenHash: sessions.tokenHash,
  userId: sessions.userId,
  signedInAt: sessions.signedInAt,
  lastSeenAt: sessions.lastSeenAt,
  userName: users.name,
} as const;

type PasskeyUse = { counter: number; isSynced: boolean; lastUsedAt: Date };

type NewSessionTimes = Pick<NewSession, 'tokenHash' | 'signedInAt' | 'lastSeenAt'>;

type CompletedSetup = {
  user: NewUser;
  passkey: Omit<NewPasskey, 'userId'>;
  session: NewSessionTimes;
};

type CompletedSignIn = {
  passkeyId: number;
  passkeyUse: PasskeyUse;
  previousTokenHash: string | undefined;
  session: NewSession;
};

type UserRow = { id: number; name: string; webauthnUserId: string };

async function countUsers(executor: DbExecutor = db): Promise<number> {
  const row = await executor.select({ total: count() }).from(users).get();

  return row?.total ?? 0;
}

async function deleteSession(tokenHash: string, executor: DbExecutor = db): Promise<void> {
  await executor.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
}

export const authRepository = {
  // There is one user at most; the app is single-person by design.
  findUser: (executor: DbExecutor = db): Promise<UserRow | undefined> =>
    executor.select(USER_COLUMNS).from(users).limit(1).get(),

  countUsers,

  // Users cascade to their passkeys and sessions; challenges and setup codes go with them. All or nothing: a reset
  // that fails halfway must not leave, say, the passkeys gone but the old setup code still valid.
  deleteEverything: (): Promise<void> =>
    db.transaction(async (tx) => {
      await tx.delete(users);
      await tx.delete(authChallenges);
      await tx.delete(setupCodes);
    }),

  replaceSetupCode: async (codeHash: string, executor: DbExecutor = db): Promise<void> => {
    await executor.delete(setupCodes);
    await executor.insert(setupCodes).values({ codeHash });
  },

  hasSetupCode: async (codeHash: string, executor: DbExecutor = db): Promise<boolean> => {
    const row = await executor
      .select({ id: setupCodes.id })
      .from(setupCodes)
      .where(eq(setupCodes.codeHash, codeHash))
      .get();

    return row !== undefined;
  },

  // Expired challenges are swept whenever a new one is made, so the table stays a handful of rows.
  createChallenge: async (data: NewAuthChallenge, executor: DbExecutor = db): Promise<void> => {
    await executor.delete(authChallenges).where(lt(authChallenges.expiresAt, new Date()));
    await executor.insert(authChallenges).values(data);
  },

  // Single use: the row is deleted as it is read, and only an unexpired one of the right purpose counts.
  takeChallenge: (challenge: string, purpose: AuthChallengePurpose, executor: DbExecutor = db) =>
    executor
      .delete(authChallenges)
      .where(
        and(
          eq(authChallenges.challenge, challenge),
          eq(authChallenges.purpose, purpose),
          gt(authChallenges.expiresAt, new Date()),
        ),
      )
      .returning({ challenge: authChallenges.challenge, webauthnUserId: authChallenges.webauthnUserId })
      .get(),

  findPasskey: (credentialId: string, executor: DbExecutor = db) =>
    executor.select(PASSKEY_COLUMNS).from(passkeys).where(eq(passkeys.credentialId, credentialId)).get(),

  listPasskeys: (userId: number, executor: DbExecutor = db) =>
    executor
      .select(PASSKEY_COLUMNS)
      .from(passkeys)
      .where(eq(passkeys.userId, userId))
      .orderBy(desc(passkeys.createdAt), desc(passkeys.id)),

  countPasskeys: (userId: number, executor: DbExecutor = db): Promise<number> =>
    executor.$count(passkeys, eq(passkeys.userId, userId)),

  createPasskey: (data: NewPasskey, executor: DbExecutor = db) =>
    executor.insert(passkeys).values(data).returning(PASSKEY_COLUMNS).get(),

  // The sessions it opened go with it (foreign key cascade).
  deletePasskey: (id: number, executor: DbExecutor = db) =>
    executor.delete(passkeys).where(eq(passkeys.id, id)).returning({ id: passkeys.id }).get(),

  findSession: (tokenHash: string, executor: DbExecutor = db) =>
    executor
      .select(SESSION_COLUMNS)
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(eq(sessions.tokenHash, tokenHash))
      .get(),

  touchSession: async (tokenHash: string, lastSeenAt: Date, executor: DbExecutor = db): Promise<void> => {
    await executor.update(sessions).set({ lastSeenAt }).where(eq(sessions.tokenHash, tokenHash));
  },

  deleteSession,

  deleteUserSessions: async (userId: number, executor: DbExecutor = db): Promise<void> => {
    await executor.delete(sessions).where(eq(sessions.userId, userId));
  },

  // Sessions past either timeout; swept on each sign-in so old rows never pile up.
  deleteExpiredSessions: async (signedInBefore: Date, lastSeenBefore: Date, executor: DbExecutor = db) => {
    await executor
      .delete(sessions)
      .where(or(lt(sessions.signedInAt, signedInBefore), lt(sessions.lastSeenAt, lastSeenBefore)));
  },

  // First run, all or nothing: the user, their first passkey and session appear together and the setup code goes.
  // Returns undefined when someone else finished setup first (the user count is checked inside the transaction).
  completeSetup: (setup: CompletedSetup): Promise<UserRow | undefined> =>
    db.transaction(async (tx) => {
      const isAlreadySetUp = (await countUsers(tx)) > 0;

      if (isAlreadySetUp) return undefined;

      const user = await tx.insert(users).values(setup.user).returning(USER_COLUMNS).get();
      const passkey = await tx
        .insert(passkeys)
        .values({ ...setup.passkey, userId: user.id })
        .returning({ id: passkeys.id })
        .get();
      await tx.insert(sessions).values({ ...setup.session, userId: user.id, passkeyId: passkey.id });
      await tx.delete(setupCodes);

      return user;
    }),

  // A sign-in: the passkey's new counter, the old session of this browser (if any) out, the new one in.
  completeSignIn: (signIn: CompletedSignIn): Promise<void> =>
    db.transaction(async (tx) => {
      await tx.update(passkeys).set(signIn.passkeyUse).where(eq(passkeys.id, signIn.passkeyId));

      if (signIn.previousTokenHash) await deleteSession(signIn.previousTokenHash, tx);

      await tx.insert(sessions).values(signIn.session);
    }),
};

// Re-exported so the service can name a challenge's purpose without importing the schema.
export type { AuthChallengePurpose };

export type PasskeyRow = NonNullable<Awaited<ReturnType<typeof authRepository.findPasskey>>>;
export type SessionRow = NonNullable<Awaited<ReturnType<typeof authRepository.findSession>>>;
