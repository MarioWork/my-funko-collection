import { env } from '../../../config/env.ts';
import type { SubmitterScope } from '../../../lib/catalogueVisibility.ts';
import { isForeignKeyViolation, isUniqueViolation } from '../../../lib/databaseErrors.ts';
import { BadRequestError, ConflictError, NotFoundError } from '../../../lib/httpErrors.ts';
import { copyImageFiles, removeImageFiles } from '../../../lib/imageStorage.ts';
import { logger } from '../../../lib/logger.ts';
import type { FunkoIdentity, FunkoRow } from '../../funkos/funkos.type.ts';
import { getImageFiles } from '../../funkos/images/funkoImages.service.ts';
import type { ImageFile } from '../../funkos/images/funkoImages.type.ts';
import { notifySubmissionMerged } from '../../notifications/notifications.service.ts';
import { submissionsRepository, type CatalogueReferences } from '../submissions.repository.ts';
import { ENTITY, NOT_WAITING_MESSAGE, findWaitingSubmission, toSingleSubmission } from '../submissions.service.ts';
import type { SubmissionResponse } from '../submissions.type.ts';
import {
  imagePlanOf,
  pickedFieldsOf,
  type MergeComparableFields,
  type MergeImagePlan,
  type PickedFields,
} from './merge.choices.ts';
import { combineClashingItems } from './merge.items.ts';
import { mergeRepository } from './merge.repository.ts';
import type { MergeChange, MergeChoices, MergeOutcome } from './merge.type.ts';

const SELF_MERGE_MESSAGE = 'A submission cannot be merged into itself';
const PICK_HAS_FUNKO_MESSAGE =
  'With the picked details, this would be the same as another funko in the catalogue. Keep more of the original entry';
const PICK_HAS_BARCODE_MESSAGE =
  'The submission’s barcode belongs to another funko in the catalogue. Keep the original entry’s barcode';
const MERGE_CLASH_MESSAGE =
  'The catalogue now has a funko that clashes with the picked details. Reload and check them again';

const CATALOGUE_SCOPE: SubmitterScope = { submittedById: null };

const log = logger.child({ module: 'submissions' });

// A merge target is a funko in the catalogue other than the submission: anything else is the caller's input error.
function targetNotInCatalogue(targetId: number): BadRequestError {
  return new BadRequestError(`Funko ${targetId} is not in the catalogue`);
}

const MERGE_REFUSAL_MAP: Record<Exclude<MergeOutcome, 'MERGED'>, (targetId: number) => Error> = {
  NOT_WAITING: () => new ConflictError(NOT_WAITING_MESSAGE),
  TARGET_NOT_IN_CATALOGUE: targetNotInCatalogue,
};

// The target is checked in the transaction but not locked: one deleted in between makes the item move fail on its
// foreign key, and the merge answers as if the target had never been there. A picked value another admin gave a
// catalogue funko meanwhile is the unique index's 23505, answered in words.
async function mergeOrExplain(id: number, targetId: number, change: MergeChange): Promise<MergeOutcome> {
  try {
    return await mergeRepository.merge(id, targetId, change, combineClashingItems);
  } catch (error: unknown) {
    if (isForeignKeyViolation(error)) return 'TARGET_NOT_IN_CATALOGUE';

    if (isUniqueViolation(error)) throw new ConflictError(MERGE_CLASH_MESSAGE);

    throw error;
  }
}

function mergeSideOf(row: FunkoRow, references: CatalogueReferences): MergeComparableFields {
  return {
    name: row.name,
    number: row.number,
    type: row.type,
    isChase: row.isChase,
    exclusive: row.exclusive,
    barcode: row.barcode,
    ...references,
  };
}

// The fields the target takes from the submission, compared with the submission's category and series as the
// catalogue would have them.
async function pickFields(submission: FunkoRow, target: FunkoRow, choices: MergeChoices): Promise<PickedFields> {
  if (choices.fieldsFromSubmission.length === 0) return {};

  const references = await submissionsRepository.findCatalogueReferences(submission.id);

  if (!references) throw new NotFoundError(ENTITY, submission.id);

  const original = mergeSideOf(target, { categoryId: target.categoryId, seriesId: target.seriesId });

  return pickedFieldsOf(original, mergeSideOf(submission, references), choices.fieldsFromSubmission);
}

// The target with the picked fields must still fit the catalogue: no other catalogue funko with the same identity or
// barcode (409 pointing at it, as approval refuses).
async function assertPickFitsCatalogue(target: FunkoRow, fields: PickedFields): Promise<void> {
  const identity: FunkoIdentity = {
    categoryId: fields.categoryId ?? target.categoryId,
    number: fields.number ?? target.number,
    name: fields.name ?? target.name,
    isChase: fields.isChase ?? target.isChase,
    exclusive: fields.exclusive ?? target.exclusive,
  };
  const sameIdentity = await submissionsRepository.findIdByIdentity(identity, CATALOGUE_SCOPE);

  if (sameIdentity && sameIdentity.id !== target.id) throw new ConflictError(PICK_HAS_FUNKO_MESSAGE, sameIdentity.id);

  const sameBarcode = fields.barcode
    ? await submissionsRepository.findIdByBarcode(fields.barcode, CATALOGUE_SCOPE)
    : undefined;

  if (sameBarcode && sameBarcode.id !== target.id) throw new ConflictError(PICK_HAS_BARCODE_MESSAGE, sameBarcode.id);
}

async function planImages(id: number, targetId: number, choices: MergeChoices): Promise<MergeImagePlan> {
  const [originalImages, submissionImages] = await Promise.all([getImageFiles(targetId), getImageFiles(id)]);

  return imagePlanOf(originalImages, submissionImages, choices, env.MAX_IMAGES_PER_FUNKO);
}

// Best effort, like a normal image delete: the rows are already gone or moved.
async function removeImageFilesOf(funkoId: number, images: ImageFile[]): Promise<void> {
  for (const image of images) await removeImageFiles(funkoId, image.fileKey);
}

// The merge itself, with the moving images' files copied into the target's folder first, so the target never points
// at a missing file. If a copy or the merge fails, the copies go again (removing one never written is a logged no-op)
// and nothing else changed.
async function mergeWithCopiedFiles(
  id: number,
  targetId: number,
  change: MergeChange,
  moved: ImageFile[],
): Promise<void> {
  let outcome: MergeOutcome;

  try {
    for (const image of moved) await copyImageFiles(id, targetId, image.fileKey);

    outcome = await mergeOrExplain(id, targetId, change);
  } catch (error: unknown) {
    await removeImageFilesOf(targetId, moved);
    throw error;
  }

  if (outcome === 'MERGED') return;

  await removeImageFilesOf(targetId, moved);
  throw MERGE_REFUSAL_MAP[outcome](targetId);
}

// Merges, then removes the files no row points at any more: the moved images' originals, and the removed images'.
async function mergeWithImages(
  id: number,
  targetId: number,
  fields: PickedFields,
  plan: MergeImagePlan,
): Promise<void> {
  const change: MergeChange = {
    fields,
    movedImageIds: plan.moved.map((image) => image.id),
    removedImageIds: plan.removed.map((image) => image.id),
  };

  await mergeWithCopiedFiles(id, targetId, change, plan.moved);
  await removeImageFilesOf(id, plan.moved);
  await removeImageFilesOf(targetId, plan.removed);
}

// An admin merges a waiting submission into a funko already in the catalogue: the funko takes the fields and images
// the admin picked (see merge.choices.ts), every item of the submission moves onto it (two in one collection become
// one, see merge.items.ts), and the submission reads as merged into it, still private, as its sender sent it. Its
// sender is told, pointed at the catalogue funko.
export async function mergeSubmission(id: number, choices: MergeChoices): Promise<SubmissionResponse> {
  const targetId = choices.targetFunkoId;

  if (id === targetId) throw new BadRequestError(SELF_MERGE_MESSAGE);

  const row = await findWaitingSubmission(id);
  const target = await submissionsRepository.findById(targetId);

  if (target?.status !== 'APPROVED') throw targetNotInCatalogue(targetId);

  const fields = await pickFields(row, target, choices);

  await assertPickFitsCatalogue(target, fields);
  await mergeWithImages(id, targetId, fields, await planImages(id, targetId, choices));

  log.info({ funkoId: id, targetFunkoId: targetId }, 'submission merged');

  // An orphan submission has no sender left to tell.
  if (row.submittedById !== null)
    await notifySubmissionMerged(row.submittedById, { funkoId: targetId, funkoName: target.name });

  return toSingleSubmission(id);
}
