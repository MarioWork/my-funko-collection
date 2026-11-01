// What the admin picked for the catalogue funko a submission merges into (issue #39): the fields it takes from the
// submission, and which images it keeps. The rules that check the picks live here, beside the service, which reads
// both funkos and hands them in; the funkos repository applies the result inside the merge's transaction.
import { BadRequestError } from '../../lib/httpErrors.ts';
import type { ImageFile } from './images/funkoImages.type.ts';
import type { FunkoType, MergeChoices, MergeField } from './funkos.type.ts';

// One side of a merge as the picker compares it: the catalogue fields. The submission's category and series are the
// ones it would have in the catalogue (its own, or the approved one of the same name), as approval would set them.
export type MergeSide = {
  name: string;
  number: string;
  type: FunkoType;
  isChase: boolean;
  exclusive: string;
  barcode: string | null;
  categoryId: number;
  seriesId: number | null;
};

// The values the catalogue funko takes from the submission; every column left out keeps its own.
export type PickedFields = Partial<MergeSide>;

// The images a merge moves onto the catalogue funko (in the submission's order) and the ones it removes from it.
export type MergeImagePlan = { moved: ImageFile[]; removed: ImageFile[] };

const MERGE_FIELD_COLUMNS: Record<MergeField, keyof MergeSide> = {
  NAME: 'name',
  NUMBER: 'number',
  TYPE: 'type',
  CATEGORY: 'categoryId',
  SERIES: 'seriesId',
  CHASE: 'isChase',
  EXCLUSIVE: 'exclusive',
  BARCODE: 'barcode',
};

const MERGE_FIELD_LABELS: Record<MergeField, string> = {
  NAME: 'Name',
  NUMBER: 'Number',
  TYPE: 'Type',
  CATEGORY: 'Category',
  SERIES: 'Series',
  CHASE: 'Chase',
  EXCLUSIVE: 'Exclusive',
  BARCODE: 'Barcode',
};

const ORIGINAL_OWNER = 'the catalogue funko';
const SUBMISSION_OWNER = 'the submission';

// The picked fields' values from the submission. A field that is the same on both has nothing to pick: the client
// shows it once, so asking for it is a mistake (400).
export function pickedFieldsOf(original: MergeSide, submission: MergeSide, fields: MergeField[]): PickedFields {
  let picked: PickedFields = {};

  for (const field of fields) {
    const column = MERGE_FIELD_COLUMNS[field];
    const isSame = original[column] === submission[column];

    if (isSame) throw new BadRequestError(`${MERGE_FIELD_LABELS[field]} is the same on both funkos: nothing to pick`);

    picked = { ...picked, [column]: submission[column] };
  }

  return picked;
}

// The images of `images` that `ids` names, in their own order; an id that is not one of them is the caller's error.
function imagesNamed(images: ImageFile[], ids: number[], owner: string): ImageFile[] {
  const ownIds = new Set(images.map((image) => image.id));
  const strangerId = ids.find((id) => !ownIds.has(id));

  if (strangerId !== undefined) throw new BadRequestError(`Image ${strangerId} is not one of ${owner}'s`);

  const namedIds = new Set(ids);

  return images.filter((image) => namedIds.has(image.id));
}

// Which images move and which go. A picked submission image that is the very same picture as one the catalogue funko
// keeps does not move (a funko never holds a picture twice): it stays with the submission, and the funko looks the
// same either way. The funko still keeps to the image limit afterwards.
export function imagePlanOf(
  originalImages: ImageFile[],
  submissionImages: ImageFile[],
  choices: Pick<MergeChoices, 'imageIdsFromSubmission' | 'removedImageIds'>,
  maxImages: number,
): MergeImagePlan {
  const removed = imagesNamed(originalImages, choices.removedImageIds, ORIGINAL_OWNER);
  const picked = imagesNamed(submissionImages, choices.imageIdsFromSubmission, SUBMISSION_OWNER);
  const removedIds = new Set(removed.map((image) => image.id));
  const keptPictures = new Set(
    originalImages.filter((image) => !removedIds.has(image.id)).map((image) => image.contentHash),
  );
  const moved = picked.filter((image) => !keptPictures.has(image.contentHash));
  const imageCount = keptPictures.size + moved.length;

  if (imageCount > maxImages) throw new BadRequestError(`A funko holds at most ${maxImages} images`);

  return { moved, removed };
}
