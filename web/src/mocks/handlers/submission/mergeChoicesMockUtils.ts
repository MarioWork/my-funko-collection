// What the admin picked for the catalogue funko a submission merges into (issue #39), checked and applied as the API
// does (api/src/modules/funkos/funkos.mergeChoices.ts): the fields it takes from the submission and which images it
// keeps. The API also leaves a picked image that is the very same picture as one the funko keeps with the
// submission; the mock store keeps no picture hashes, so that one rule is not mirrored.
import { SubmissionStatusUtil } from '@app-types/utility';
import { findBarcodeTwin, findDuplicate } from '@mocks/handlers/funko/funkoMockUtils';
import { badRequest, conflict } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';
import type { MockFunkoRow, MockImageRow, MockSubmissionColumns } from '@mocks/mockStore.type';
import { nowIso } from '@mocks/mockStoreUtils';
import { SubmissionApiMergeFields } from '@services/submissionService/submissionService';
import type { MergeSubmission } from '@services/submissionService/submissionService.type';
import { approveReference, catalogueReferenceIdOf } from './submissionMockUtils';

// The API's answers, word for word where the page shows them.
const PICK_HAS_FUNKO_MESSAGE =
  'With the picked details, this would be the same as another funko in the catalogue. Keep more of the original entry';
const PICK_HAS_BARCODE_MESSAGE =
  'The submission’s barcode belongs to another funko in the catalogue. Keep the original entry’s barcode';
const VALIDATION_MESSAGE = 'Request validation failed';
// The API's default MAX_IMAGES_PER_FUNKO.
const MAX_IMAGES_PER_FUNKO = 10;

type MergeSide = Pick<
  MockFunkoRow,
  'name' | 'number' | 'type' | 'isChase' | 'exclusive' | 'barcode' | 'categoryId' | 'seriesId'
>;

type PickedFields = Partial<MergeSide>;

// What a merge changes on the catalogue funko besides the items.
export type MockMergePlan = { fields: PickedFields; movedImages: MockImageRow[]; removedImages: MockImageRow[] };

type MergePlanLookup = { plan: MockMergePlan } | { refusal: Response };

type FieldPick = { picked: PickedFields } | { refusal: Response };

type ImagePlan = Pick<MockMergePlan, 'movedImages' | 'removedImages'> | { refusal: Response };

const APPROVED: MockSubmissionColumns = { status: SubmissionStatusUtil.APPROVED, submittedById: null };

const MERGE_FIELD_COLUMNS: Record<SubmissionApiMergeFields, keyof MergeSide> = {
  [SubmissionApiMergeFields.NAME]: 'name',
  [SubmissionApiMergeFields.NUMBER]: 'number',
  [SubmissionApiMergeFields.TYPE]: 'type',
  [SubmissionApiMergeFields.CATEGORY]: 'categoryId',
  [SubmissionApiMergeFields.SERIES]: 'seriesId',
  [SubmissionApiMergeFields.CHASE]: 'isChase',
  [SubmissionApiMergeFields.EXCLUSIVE]: 'exclusive',
  [SubmissionApiMergeFields.BARCODE]: 'barcode',
};

const MERGE_FIELD_LABELS: Record<SubmissionApiMergeFields, string> = {
  [SubmissionApiMergeFields.NAME]: 'Name',
  [SubmissionApiMergeFields.NUMBER]: 'Number',
  [SubmissionApiMergeFields.TYPE]: 'Type',
  [SubmissionApiMergeFields.CATEGORY]: 'Category',
  [SubmissionApiMergeFields.SERIES]: 'Series',
  [SubmissionApiMergeFields.CHASE]: 'Chase',
  [SubmissionApiMergeFields.EXCLUSIVE]: 'Exclusive',
  [SubmissionApiMergeFields.BARCODE]: 'Barcode',
};

function hasRepeats(values: readonly unknown[]): boolean {
  return new Set(values).size !== values.length;
}

// The submission as the catalogue would have it: its category and series moved onto the approved ones of the same
// name.
function catalogueSideOf(submission: MockFunkoRow): MergeSide {
  return {
    ...submission,
    categoryId: catalogueReferenceIdOf(mockStore.categories, submission.categoryId),
    seriesId: catalogueReferenceIdOf(mockStore.series, submission.seriesId),
  };
}

function pickFields(target: MockFunkoRow, submission: MockFunkoRow, fields: SubmissionApiMergeFields[]): FieldPick {
  const submissionSide = catalogueSideOf(submission);
  let picked: PickedFields = {};

  for (const field of fields) {
    const column = MERGE_FIELD_COLUMNS[field];

    if (target[column] === submissionSide[column]) {
      return { refusal: badRequest(`${MERGE_FIELD_LABELS[field]} is the same on both funkos: nothing to pick`) };
    }

    picked = { ...picked, [column]: submissionSide[column] };
  }

  return { picked };
}

// The target with the picked fields must still fit the catalogue, as approval checks it.
function catalogueClashOf(target: MockFunkoRow, fields: PickedFields): Response | undefined {
  const candidate = { ...target, ...fields, ...APPROVED };
  const duplicate = findDuplicate(candidate, target.id);

  if (duplicate) return conflict(PICK_HAS_FUNKO_MESSAGE, duplicate.id);

  const sameBarcode = fields.barcode ? findBarcodeTwin(candidate, target.id) : undefined;

  return sameBarcode ? conflict(PICK_HAS_BARCODE_MESSAGE, sameBarcode.id) : undefined;
}

function imagesOf(funkoId: number): MockImageRow[] {
  return mockStore.images
    .filter((image) => image.funkoId === funkoId)
    .sort((first, second) => first.position - second.position);
}

// The images of a funko the ids name, or the id that is not one of them.
function imagesNamed(images: MockImageRow[], ids: number[]) {
  const strangerId = ids.find((id) => !images.some((image) => image.id === id));

  return { named: images.filter((image) => ids.includes(image.id)), strangerId };
}

function planImages(target: MockFunkoRow, submission: MockFunkoRow, choices: MergeSubmission): ImagePlan {
  const originalImages = imagesOf(target.id);
  const removed = imagesNamed(originalImages, choices.removedImageIds);
  const moved = imagesNamed(imagesOf(submission.id), choices.imageIdsFromSubmission);

  if (removed.strangerId !== undefined) {
    return { refusal: badRequest(`Image ${removed.strangerId} is not one of the catalogue funko's`) };
  }

  if (moved.strangerId !== undefined) {
    return { refusal: badRequest(`Image ${moved.strangerId} is not one of the submission's`) };
  }

  const imageCount = originalImages.length - removed.named.length + moved.named.length;

  if (imageCount > MAX_IMAGES_PER_FUNKO) {
    return { refusal: badRequest(`A funko holds at most ${MAX_IMAGES_PER_FUNKO} images`) };
  }

  return { movedImages: moved.named, removedImages: removed.named };
}

// The picks checked in the API's order: the fields (each once, only ones that differ), the catalogue clash, then the
// images. Nothing changes here.
export function planMockMerge(
  target: MockFunkoRow,
  submission: MockFunkoRow,
  choices: MergeSubmission,
): MergePlanLookup {
  const hasRepeatedPicks = hasRepeats(choices.fieldsFromSubmission) || hasRepeats(choices.imageIdsFromSubmission);

  if (hasRepeatedPicks || hasRepeats(choices.removedImageIds)) return { refusal: badRequest(VALIDATION_MESSAGE) };

  const fieldPick = pickFields(target, submission, choices.fieldsFromSubmission);

  if ('refusal' in fieldPick) return { refusal: fieldPick.refusal };

  const clash = catalogueClashOf(target, fieldPick.picked);

  if (clash) return { refusal: clash };

  const imagePlan = planImages(target, submission, choices);

  if ('refusal' in imagePlan) return { refusal: imagePlan.refusal };

  return { plan: { fields: fieldPick.picked, ...imagePlan } };
}

// The target takes the picked fields (a picked waiting category or series joins the catalogue first) and images: its
// unticked ones go, the picked ones of the submission come after its own.
export function applyMockMerge(target: MockFunkoRow, submission: MockFunkoRow, plan: MockMergePlan): void {
  if (plan.fields.categoryId !== undefined) approveReference(mockStore.categories, submission.categoryId);

  if (plan.fields.seriesId !== undefined) {
    approveReference(mockStore.series, submission.seriesId);
  }

  Object.assign(target, plan.fields, { updatedAt: nowIso() });

  const removedIds = new Set(plan.removedImages.map((image) => image.id));

  mockStore.images = mockStore.images.filter((image) => !removedIds.has(image.id));

  const firstPosition = Math.max(-1, ...imagesOf(target.id).map((image) => image.position)) + 1;

  for (const [index, image] of plan.movedImages.entries()) {
    Object.assign(image, { funkoId: target.id, position: firstPosition + index });
  }
}
