import { ID_SELECT, prisma } from '../../../lib/prisma.ts';
import { deleteSession, type NewSession } from '../auth.repository.ts';

type PasskeyUse = { counter: number; isSynced: boolean; lastUsedAt: Date };

type CompletedPasswordSignIn = {
  previousTokenHash: string | undefined;
  session: NewSession;
};

type CompletedSignIn = {
  passkeyId: number;
  passkeyUse: PasskeyUse;
  previousTokenHash: string | undefined;
  session: NewSession;
};

export const signInRepository = {
  // Sessions past either timeout; swept on each sign-in so old rows never pile up.
  deleteExpiredSessions: async (signedInBefore: Date, lastSeenBefore: Date): Promise<void> => {
    await prisma.session.deleteMany({
      where: { OR: [{ signedInAt: { lt: signedInBefore } }, { lastSeenAt: { lt: lastSeenBefore } }] },
    });
  },

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
