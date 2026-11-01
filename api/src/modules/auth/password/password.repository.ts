import { prisma } from '../../../lib/prisma.ts';
import { USER_SELECT, type UserRow } from '../auth.repository.ts';

type NewPassword = { userId: number; username: string; passwordHash: string; keepTokenHash: string };

export const passwordRepository = {
  // A new password ends every other session a password opened (one may have used the old password), all or
  // nothing. Passkey sessions stay: a leaked password could not have opened them. The service checks the username
  // first; one taken in between fails the unique index, which the error handler answers as a 409.
  setPassword: (password: NewPassword): Promise<UserRow> =>
    prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: password.userId },
        data: { username: password.username, passwordHash: password.passwordHash, temporaryPasswordExpiresAt: null },
        select: USER_SELECT,
      });
      await tx.session.deleteMany({
        where: { userId: password.userId, signInMethod: 'PASSWORD', tokenHash: { not: password.keepTokenHash } },
      });

      return user;
    }),
};
