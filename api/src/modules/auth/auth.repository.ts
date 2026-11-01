// What the auth jobs share: the users, passkeys and challenges every sign-in reads.
import type { AuthChallengePurpose, Prisma, UserRole as DbUserRole } from '../../generated/prisma/client.ts';
import { ID_SELECT, prisma, type DbExecutor } from '../../lib/prisma.ts';
import type { UserRole } from './auth.type.ts';

// USER_ROLES (auth.type.ts) and the Prisma `UserRole` enum must hold the same values: this fails to compile when
// either side has a role the other lacks. The tuples stop TypeScript from checking each role on its own.
type RolesMatch = [DbUserRole] extends [UserRole] ? ([UserRole] extends [DbUserRole] ? true : false) : false;
const ROLES_MATCH: RolesMatch = true;
void ROLES_MATCH;

export const USER_SELECT = {
  id: true,
  name: true,
  username: true,
  role: true,
  isReadOnly: true,
  webauthnUserId: true,
  temporaryPasswordExpiresAt: true,
} as const satisfies Prisma.UserSelect;

export const PASSKEY_SELECT = {
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

const PASSWORD_USER_SELECT = { ...USER_SELECT, passwordHash: true } as const satisfies Prisma.UserSelect;

const CHALLENGE_SELECT = { challenge: true, webauthnUserId: true } as const satisfies Prisma.AuthChallengeSelect;

type NewAuthChallenge = Pick<
  Prisma.AuthChallengeUncheckedCreateInput,
  'challenge' | 'purpose' | 'webauthnUserId' | 'expiresAt'
>;

// A new session row, as every sign-in writes it.
export type NewSession = Pick<
  Prisma.SessionUncheckedCreateInput,
  'tokenHash' | 'userId' | 'signInMethod' | 'passkeyId' | 'signedInAt' | 'lastSeenAt'
>;

export type UserRow = Prisma.UserGetPayload<{ select: typeof USER_SELECT }>;

type TakenChallenge = { challenge: string; webauthnUserId: string | null };

// The app is set up once someone can sign in: a user with a passkey or a password. A user row alone is not enough:
// yarn auth:reset keeps the users (their collections hang off them) and takes away every way in.
export function countUsersWhoCanSignIn(executor: DbExecutor = prisma): Promise<number> {
  return executor.user.count({ where: { OR: [{ passkeys: { some: {} } }, { passwordHash: { not: null } }] } });
}

export async function deleteSession(tokenHash: string, executor: DbExecutor = prisma): Promise<void> {
  await executor.session.deleteMany({ where: { tokenHash } });
}

async function findPasskey(credentialId: string) {
  return (await prisma.passkey.findUnique({ where: { credentialId }, select: PASSKEY_SELECT })) ?? undefined;
}

export const authRepository = {
  findUserById: async (id: number): Promise<UserRow | undefined> =>
    (await prisma.user.findUnique({ where: { id }, select: USER_SELECT })) ?? undefined,

  countUsersWhoCanSignIn,

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

  findPasswordUserById: async (id: number) =>
    (await prisma.user.findUnique({ where: { id }, select: PASSWORD_USER_SELECT })) ?? undefined,
};

// Re-exported so the services can name a challenge's purpose without importing the generated client.
export type { AuthChallengePurpose };

export type PasskeyRow = NonNullable<Awaited<ReturnType<typeof findPasskey>>>;
export type PasswordUserRow = Prisma.UserGetPayload<{ select: typeof PASSWORD_USER_SELECT }>;
