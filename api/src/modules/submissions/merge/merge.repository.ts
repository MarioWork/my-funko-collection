import type { Prisma } from '../../../generated/prisma/client.ts';
import { ID_SELECT, prisma } from '../../../lib/prisma.ts';
import type { PickedFields } from './merge.choices.ts';
import type { ItemCombiner, MergedItem } from './merge.items.ts';
import type { MergeChange, MergeOutcome } from './merge.type.ts';

// What a merge reads of each item it moves: where it is, and what a clash combines (its tags in the order it got them).
const MERGED_ITEM_SELECT = {
  id: true,
  collectionId: true,
  quantity: true,
  notes: true,
  createdAt: true,
  itemTags: { select: { tagId: true }, orderBy: [{ createdAt: 'asc' }, { tagId: 'asc' }] },
} as const satisfies Prisma.CollectionItemSelect;

type MergedItemRow = Prisma.CollectionItemGetPayload<{ select: typeof MERGED_ITEM_SELECT }>;

// The older of two items first: created first, the lower id on a tie.
function olderFirst(first: MergedItemRow, second: MergedItemRow): [MergedItemRow, MergedItemRow] {
  const isFirstOlder =
    first.createdAt.getTime() < second.createdAt.getTime() ||
    (first.createdAt.getTime() === second.createdAt.getTime() && first.id < second.id);

  return isFirstOlder ? [first, second] : [second, first];
}

function toMergedItem(row: MergedItemRow): MergedItem {
  return { quantity: row.quantity, notes: row.notes, tagIds: row.itemTags.map(({ tagId }) => tagId) };
}

// Two items of the same funko in one collection become the older one: it takes `combine`'s quantity, notes and tags,
// then the newer one goes. The newer one is deleted before the kept one moves, so the collection never holds the
// target funko twice (collection_items_collection_id_funko_id_uidx).
async function combineItems(
  tx: Prisma.TransactionClient,
  pair: { moving: MergedItemRow; staying: MergedItemRow },
  targetId: number,
  combine: ItemCombiner,
): Promise<void> {
  const [older, newer] = olderFirst(pair.moving, pair.staying);
  const { tagIds, ...combined } = combine(toMergedItem(older), toMergedItem(newer));

  await tx.collectionItem.delete({ where: { id: newer.id } });
  await tx.collectionItemTag.deleteMany({ where: { collectionItemId: older.id, tagId: { notIn: tagIds } } });
  await tx.collectionItemTag.createMany({
    data: tagIds.map((tagId) => ({ collectionItemId: older.id, tagId })),
    skipDuplicates: true,
  });
  await tx.collectionItem.update({ where: { id: older.id }, data: { ...combined, funkoId: targetId } });
}

// One of the submission's items moves onto the target funko, or combines with the target's item in its collection.
async function moveItem(
  tx: Prisma.TransactionClient,
  moving: MergedItemRow,
  targetId: number,
  combine: ItemCombiner,
): Promise<void> {
  const staying = await tx.collectionItem.findUnique({
    where: { collectionId_funkoId: { collectionId: moving.collectionId, funkoId: targetId } },
    select: MERGED_ITEM_SELECT,
  });

  if (!staying) {
    await tx.collectionItem.update({ where: { id: moving.id }, data: { funkoId: targetId } });

    return;
  }

  await combineItems(tx, { moving, staying }, targetId, combine);
}

// A picked waiting category or series of the submission joins the catalogue, as approval brings it in. An approved
// one (the submission's own, or the approved one of the same name the service resolved) is left as it is.
async function bringIntoCatalogue(tx: Prisma.TransactionClient, fields: PickedFields): Promise<void> {
  if (fields.categoryId !== undefined) {
    await tx.category.updateMany({ where: { id: fields.categoryId, status: 'WAITING' }, data: { status: 'APPROVED' } });
  }

  if (fields.seriesId !== undefined) {
    await tx.series.updateMany({ where: { id: fields.seriesId, status: 'WAITING' }, data: { status: 'APPROVED' } });
  }
}

// The target's unticked images go, then the picked images of the submission become the target's, after its own. Their
// files were copied into the target's folder under the same key before the transaction (the service's job).
async function moveImages(
  tx: Prisma.TransactionClient,
  pair: { id: number; targetId: number },
  change: MergeChange,
): Promise<void> {
  if (change.removedImageIds.length > 0) {
    await tx.funkoImage.deleteMany({ where: { id: { in: change.removedImageIds }, funkoId: pair.targetId } });
  }

  if (change.movedImageIds.length === 0) return;

  const totals = await tx.funkoImage.aggregate({ where: { funkoId: pair.targetId }, _max: { position: true } });
  const firstPosition = (totals._max.position ?? -1) + 1;

  for (const [index, imageId] of change.movedImageIds.entries()) {
    await tx.funkoImage.updateMany({
      where: { id: imageId, funkoId: pair.id },
      data: { funkoId: pair.targetId, position: firstPosition + index },
    });
  }
}

// The catalogue funko takes the picked fields (a waiting category or series picked joins the catalogue first) and
// images. A unique index the new values clash with throws 23505, and the whole merge rolls back.
async function changeTarget(
  tx: Prisma.TransactionClient,
  pair: { id: number; targetId: number },
  change: MergeChange,
): Promise<void> {
  const hasFields = Object.keys(change.fields).length > 0;

  await bringIntoCatalogue(tx, change.fields);

  if (hasFields) await tx.funko.update({ where: { id: pair.targetId }, data: change.fields, select: ID_SELECT });

  await moveImages(tx, pair, change);
}

// Merging, all or nothing: the target must still be in the catalogue, the submission still waiting; then the target
// takes the picked fields and images, every item of the submission (whoever's collection) moves onto the target, and
// it is marked merged into it. It keeps its own fields, category, series and the images not picked, as a record.
async function mergeInTransaction(
  id: number,
  targetId: number,
  change: MergeChange,
  combine: ItemCombiner,
): Promise<MergeOutcome> {
  return prisma.$transaction(async (tx) => {
    const target = await tx.funko.findFirst({ where: { id: targetId, status: 'APPROVED' }, select: ID_SELECT });

    if (!target) return 'TARGET_NOT_IN_CATALOGUE';

    const write = await tx.funko.updateMany({
      where: { id, status: 'WAITING' },
      data: { status: 'MERGED', mergedIntoId: targetId, reviewedAt: new Date() },
    });

    if (write.count === 0) return 'NOT_WAITING';

    await changeTarget(tx, { id, targetId }, change);

    const items = await tx.collectionItem.findMany({
      where: { funkoId: id },
      select: MERGED_ITEM_SELECT,
      orderBy: { id: 'asc' },
    });

    for (const item of items) await moveItem(tx, item, targetId, combine);

    return 'MERGED';
  });
}

export const mergeRepository = {
  // Only a waiting funko is merged, only into an approved one, which takes `change`; `combine` decides what a clash
  // in one collection becomes.
  merge: mergeInTransaction,
};
