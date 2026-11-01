import { deletedIdOrUndefined, prisma } from '../../../lib/prisma.ts';
import { findHolderIdsIn } from '../funkos.repository.ts';

// How a forced delete went: the users whose items went with the funko, or refused (nothing changed) because users
// other than the deleter have it and no reason was given. Undefined when the funko was not there.
export type DeletedWithItems = { isRefused: false; holderIds: number[] } | { isRefused: true };

// Who deletes, and whether they gave a reason that lets the delete take the funko from other users.
export type ForcedDeleter = { userId: number; hasReason: boolean };

export const removalRepository = {
  delete: async (id: number): Promise<{ id: number } | undefined> => {
    const write = await prisma.funko.deleteMany({ where: { id } });

    return deletedIdOrUndefined(id, write);
  },

  // The forced delete: its collection items go first (their tags cascade), then the funko, all or nothing. The users
  // who have it are read in the same transaction, so a user who added it after the service's check is still
  // refused without a reason, and the ones told are the ones who lost it.
  deleteWithItems: (id: number, deleter: ForcedDeleter): Promise<DeletedWithItems | undefined> =>
    prisma.$transaction(async (tx) => {
      const holderIds = await findHolderIdsIn(tx, id);
      const isInOtherUsersCollections = holderIds.some((holderId) => holderId !== deleter.userId);

      if (isInOtherUsersCollections && !deleter.hasReason) return { isRefused: true };

      await tx.collectionItem.deleteMany({ where: { funkoId: id } });

      const deleted = await tx.funko.deleteMany({ where: { id } });

      if (deleted.count === 0) return undefined;

      return { isRefused: false, holderIds };
    }),
};
