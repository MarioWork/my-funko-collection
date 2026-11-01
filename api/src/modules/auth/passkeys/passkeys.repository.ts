import type { Prisma } from '../../../generated/prisma/client.ts';
import { deletedIdOrUndefined, prisma } from '../../../lib/prisma.ts';
import { PASSKEY_SELECT } from '../auth.repository.ts';

type NewPasskey = Omit<Prisma.PasskeyUncheckedCreateInput, 'id' | 'createdAt' | 'updatedAt' | 'sessions'>;

export const passkeysRepository = {
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
};
