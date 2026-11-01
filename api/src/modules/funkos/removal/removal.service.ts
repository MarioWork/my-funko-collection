import { BadRequestError, HeldByUsersError, NotFoundError } from '../../../lib/httpErrors.ts';
import { removeFunkoFolder } from '../../../lib/imageStorage.ts';
import { logger } from '../../../lib/logger.ts';
import type { SignedInUser } from '../../auth/auth.type.ts';
import { notifyFunkoRemoved } from '../../notifications/notifications.service.ts';
import { assertCanEditFunko } from '../funkos.access.ts';
import { funkosRepository } from '../funkos.repository.ts';
import { removalRepository, type ForcedDeleter } from './removal.repository.ts';
import type { DeleteFunko, DeleteFunkoQuery } from './removal.schema.ts';

const ENTITY = 'Funko';
const REASON_NEEDED_MESSAGE = 'Removing a funko other users have needs a reason to tell them';

const log = logger.child({ module: 'funkos' });

// The user's own collections by name; anyone else's only as how many other users have it, never whose.
function describeCollections(ownCollectionNames: string[], otherHolderCount: number): string {
  const places = ownCollectionNames.map((name) => `"${name}"`);
  const otherUsers = otherHolderCount === 1 ? '1 other user' : `${otherHolderCount} other users`;

  if (otherHolderCount > 0) places.push(`the collections of ${otherUsers}`);

  return places.join(', ');
}

// Where the funko sits, seen from the user deleting it: their own collections by name, and every other user only
// as a number.
type FunkoHolders = { ownCollectionNames: string[]; holderIds: number[]; otherHolderCount: number };

async function findHolders(userId: number, funkoId: number): Promise<FunkoHolders> {
  const [collectionsByFunko, holderIds] = await Promise.all([
    funkosRepository.collectionsByFunkoIds(userId, [funkoId]),
    funkosRepository.findHolderIds(funkoId),
  ]);
  const ownCollectionNames = (collectionsByFunko.get(funkoId) ?? []).map((collection) => collection.name);
  const otherHolderCount = holderIds.filter((holderId) => holderId !== userId).length;

  return { ownCollectionNames, holderIds, otherHolderCount };
}

// A funko in a collection stays unless `force` is set, and taking it from other users needs a reason to tell them.
function assertCanDeleteFrom(holders: FunkoHolders, force: boolean, reason: string | undefined): void {
  const isInCollections = holders.holderIds.length > 0;
  const isInOtherUsersCollections = holders.otherHolderCount > 0;

  if (isInCollections && !force) {
    const places = describeCollections(holders.ownCollectionNames, holders.otherHolderCount);
    const howToForce = isInOtherUsersCollections ? 'force=true and a reason' : 'force=true';

    throw new HeldByUsersError(
      `The funko is in ${places}. Send ${howToForce} to remove it from them and delete it`,
      holders.holderIds.length,
    );
  }

  if (isInOtherUsersCollections && !reason) throw new BadRequestError(REASON_NEEDED_MESSAGE);
}

// Deletes the funko (with its items when it has any) and answers the users whose items went.
async function deleteRows(id: number, isInCollections: boolean, deleter: ForcedDeleter): Promise<number[]> {
  if (!isInCollections) {
    const deleted = await removalRepository.delete(id);

    if (!deleted) throw new NotFoundError(ENTITY, id);

    return [];
  }

  const deleted = await removalRepository.deleteWithItems(id, deleter);

  if (!deleted) throw new NotFoundError(ENTITY, id);

  if (deleted.isRefused) throw new BadRequestError(REASON_NEEDED_MESSAGE);

  return deleted.holderIds;
}

// A funko inside anyone's collection is kept unless `force` is set; then every item of it goes with it, and when
// other users had it, each user who had it (the one deleting too, if they had it) is told why. Files go after the
// rows. An admin deletes any funko; a member only their own submission (which only sits in their own collections).
export async function deleteFunko(
  user: SignedInUser,
  id: number,
  { force }: DeleteFunkoQuery,
  body: DeleteFunko | null,
): Promise<void> {
  const funko = assertCanEditFunko(user, id, await funkosRepository.findById(id));
  const holders = await findHolders(user.userId, id);
  const reason = body?.reason;

  assertCanDeleteFrom(holders, force, reason);

  const isInCollections = holders.holderIds.length > 0;
  const removedFrom = await deleteRows(id, isInCollections, { userId: user.userId, hasReason: reason !== undefined });

  await removeFunkoFolder(id);
  log.info({ funkoId: id, force, holderCount: removedFrom.length }, 'funko deleted');

  const isRemovedFromOthers = removedFrom.some((holderId) => holderId !== user.userId);

  if (isRemovedFromOthers && reason) await notifyFunkoRemoved(removedFrom, funko.name, reason);
}
