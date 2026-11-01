import { array, mixed, object, string, type InferType } from 'yup';
import type { FunkoApiModel, FunkoDetailApiModel } from '@app-types/models';
import { FUNKO_TYPE_LABELS } from '@app-types/utility';
import { SubmissionApiMergeFields } from '@services/submissionService/submissionService';
import type { MergeSubmission } from '@services/submissionService/submissionService.type';
import { funkoLabelOf } from '@utils/funkoUtils';

// Which funko's value the catalogue funko keeps for one field: its own (the original entry, the default) or the
// submission's.
export const MergeSide = {
  ORIGINAL: 'ORIGINAL',
  SUBMISSION: 'SUBMISSION',
} as const;
export type MergeSide = (typeof MergeSide)[keyof typeof MergeSide];

export const MERGE_SIDE_LABELS: Record<MergeSide, string> = {
  [MergeSide.ORIGINAL]: 'Original entry',
  [MergeSide.SUBMISSION]: 'Submission',
};

// One funko a submission can be merged into, as the pick step lists it: a maybe-double first (with why), then search
// results. `label` is funkoLabelOf()'s, so a chase or an exclusive never reads like the regular one.
export type MergeTarget = { id: number; label: string; hint: string };

// The pick step's one choice, as the radio group keeps it: the target funko's id as text.
export const mergePickFormSchema = object({
  targetFunkoId: string().required('Pick the funko it is the same as'),
});

export type MergePickFormValues = InferType<typeof mergePickFormSchema>;

// For each field that differs, which side the catalogue funko keeps.
export type MergeSides = Partial<Record<SubmissionApiMergeFields, MergeSide>>;

// The side-by-side step: the side kept for each differing field, and the ids (as text, as the checkboxes keep them)
// of the images the catalogue funko ends up with, from either funko.
export const mergeCompareFormSchema = object({
  sides: mixed<MergeSides>().required(),
  keptImageIds: array(string().required()).required(),
});

export type MergeCompareFormValues = InferType<typeof mergeCompareFormSchema>;

// What the dialog posts to its action.
export type MergeSubmissionFormData = { merge?: MergeSubmission };

type MergeFieldReader = { label: string; read: (funko: FunkoApiModel) => string };

const NO_VALUE = 'None';

// How each field reads on screen, in the order the dialog lists them. Two funkos have the same value when they read
// the same: the category and series by name, as the API brings a waiting one onto the approved one of that name.
const MERGE_FIELD_READERS: Record<SubmissionApiMergeFields, MergeFieldReader> = {
  [SubmissionApiMergeFields.NAME]: { label: 'Name', read: (funko) => funko.name },
  [SubmissionApiMergeFields.NUMBER]: { label: 'Number', read: (funko) => `#${funko.number}` },
  [SubmissionApiMergeFields.TYPE]: { label: 'Type', read: (funko) => FUNKO_TYPE_LABELS[funko.type] },
  [SubmissionApiMergeFields.CATEGORY]: { label: 'Category', read: (funko) => funko.category.name },
  [SubmissionApiMergeFields.SERIES]: { label: 'Series', read: (funko) => funko.series.name },
  [SubmissionApiMergeFields.CHASE]: { label: 'Chase', read: (funko) => (funko.isChase ? 'Chase' : 'Not a chase') },
  [SubmissionApiMergeFields.EXCLUSIVE]: {
    label: 'Exclusive',
    read: (funko) => funko.exclusive || 'Regular release',
  },
  [SubmissionApiMergeFields.BARCODE]: { label: 'Barcode', read: (funko) => funko.barcode ?? NO_VALUE },
};

// One catalogue field of the two funkos, side by side.
export type MergeFieldRow = {
  field: SubmissionApiMergeFields;
  label: string;
  originalValue: string;
  submissionValue: string;
};

function toFieldRow(field: SubmissionApiMergeFields, original: FunkoApiModel, submission: FunkoApiModel) {
  const { label, read } = MERGE_FIELD_READERS[field];

  return { field, label, originalValue: read(original), submissionValue: read(submission) };
}

// Every field of the two funkos, split into the ones to pick from and the ones that are the same (shown once).
export function compareMergeFields(original: FunkoApiModel, submission: FunkoApiModel) {
  const rows = Object.values(SubmissionApiMergeFields).map((field) => toFieldRow(field, original, submission));
  const differingRows = rows.filter((row) => row.originalValue !== row.submissionValue);
  const sameRows = rows.filter((row) => row.originalValue === row.submissionValue);

  return { differingRows, sameRows };
}

// The original entry's value for every differing field, and its images: what a merge keeps when nothing is
// picked.
export function defaultCompareValues(
  differingRows: MergeFieldRow[],
  original: FunkoDetailApiModel,
): MergeCompareFormValues {
  const sides = Object.fromEntries(differingRows.map((row) => [row.field, MergeSide.ORIGINAL]));

  return { sides, keptImageIds: original.images.map((image) => String(image.id)) };
}

// The form's picks as the merge body: the fields taken from the submission, the submission's images that move over
// and the original entry's images that go.
export function toMergeChoices(
  values: MergeCompareFormValues,
  original: FunkoDetailApiModel,
  submission: FunkoDetailApiModel,
): MergeSubmission {
  const keptIds = new Set(values.keptImageIds);
  const pickedFields = Object.values(SubmissionApiMergeFields).filter(
    (field) => values.sides[field] === MergeSide.SUBMISSION,
  );

  return {
    targetFunkoId: original.id,
    fieldsFromSubmission: pickedFields,
    imageIdsFromSubmission: submission.images.filter((image) => keptIds.has(String(image.id))).map(({ id }) => id),
    removedImageIds: original.images.filter((image) => !keptIds.has(String(image.id))).map(({ id }) => id),
  };
}

// Why the submission's barcode cannot be picked: another catalogue funko already has it.
export function barcodeTakenReason(barcodeOwner: FunkoApiModel | null): string | undefined {
  if (!barcodeOwner) return undefined;

  return `This barcode belongs to ${funkoLabelOf(barcodeOwner)} in the catalogue`;
}
