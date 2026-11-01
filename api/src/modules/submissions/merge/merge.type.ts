// Merging a submission into a catalogue funko (issue #12, #39): what the admin picks and what the merge changes.
import type { PickedFields } from './merge.choices.ts';

// The catalogue fields an admin merging a submission can take from it instead of keeping the original entry's
// (issue #39).
export const MERGE_FIELDS = ['NAME', 'NUMBER', 'TYPE', 'CATEGORY', 'SERIES', 'CHASE', 'EXCLUSIVE', 'BARCODE'] as const;
export type MergeField = (typeof MERGE_FIELDS)[number];

// What the admin picked for the catalogue funko a submission merges into: the fields it takes from the submission,
// the submission's images that move onto it, and its own images that go. Everything else stays the original entry's.
export type MergeChoices = {
  targetFunkoId: number;
  fieldsFromSubmission: MergeField[];
  imageIdsFromSubmission: number[];
  removedImageIds: number[];
};

// What became of a merge: done, or refused because the submission is no longer waiting or the target is not (or no
// longer) in the catalogue. Nothing changes unless it is MERGED.
export type MergeOutcome = 'MERGED' | 'NOT_WAITING' | 'TARGET_NOT_IN_CATALOGUE';

// What a merge changes on the catalogue funko besides the items (issue #39): the fields it takes from the submission,
// the submission's images that move onto it (in this order, after its own), and its own images that go.
export type MergeChange = { fields: PickedFields; movedImageIds: number[]; removedImageIds: number[] };
