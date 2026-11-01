// What the submission handlers share: a store row as the API answers it, finding a waiting one, and the
// maybe-double check.
import type { PossibleDoubleApiModel, ReviewSubmissionApiModel, SubmissionApiModel } from '@app-types/models';
import { DoubleMatchFieldUtil, SubmissionStatusUtil } from '@app-types/utility';
import { conflict, mergedIntoOf, notFound, senderOf, toFunkoSummary } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';
import type { MockFunkoRow } from '@mocks/mockStore.type';

// The API's answer, word for word where the page shows it.
const NOT_WAITING_MESSAGE = 'Only a waiting submission can be approved, rejected or merged';

type SubmissionLookup = { funko: MockFunkoRow } | { refusal: Response };

// The submission an admin reviews: 404 when there is none, 409 when it no longer waits.
export function findWaitingSubmission(funkoId: string): SubmissionLookup {
  const funko = mockStore.funkos.find((candidate) => String(candidate.id) === funkoId);

  if (!funko) return { refusal: notFound('Funko', funkoId) };

  if (funko.status !== SubmissionStatusUtil.WAITING) return { refusal: conflict(NOT_WAITING_MESSAGE) };

  return { funko };
}

export function toSubmissionModel(row: MockFunkoRow): SubmissionApiModel {
  return {
    ...toFunkoSummary(row),
    status: row.status,
    reviewedAt: row.reviewedAt,
    rejectionReason: row.rejectionReason,
    changedByAdminAt: row.changedByAdminAt,
    mergedInto: mergedIntoOf(row),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function categoryNameOf(row: MockFunkoRow): string {
  return mockStore.categories.find((category) => category.id === row.categoryId)?.name.toLowerCase() ?? '';
}

function doubleMatchesOf(row: MockFunkoRow, candidate: MockFunkoRow): DoubleMatchFieldUtil[] {
  const isSameBarcode = row.barcode !== null && row.barcode === candidate.barcode;
  const isSameNumber = row.number === candidate.number;
  const isSameCategory = categoryNameOf(row) === categoryNameOf(candidate);
  const matches: DoubleMatchFieldUtil[] = [];

  if (isSameBarcode) matches.push(DoubleMatchFieldUtil.BARCODE);
  if (isSameNumber && isSameCategory) matches.push(DoubleMatchFieldUtil.NUMBER_AND_CATEGORY);

  return matches;
}

function isApprovedOrWaiting(row: MockFunkoRow): boolean {
  return row.status === SubmissionStatusUtil.APPROVED || row.status === SubmissionStatusUtil.WAITING;
}

// "Maybe a double", for a waiting one only: every other approved or waiting funko with the same barcode, or the same
// number in a category of the same name (any case), as the API answers it.
function possibleDoublesOf(row: MockFunkoRow): PossibleDoubleApiModel[] {
  if (row.status !== SubmissionStatusUtil.WAITING) return [];

  return mockStore.funkos
    .filter((candidate) => candidate.id !== row.id && isApprovedOrWaiting(candidate))
    .flatMap((candidate) => {
      const matchedOn = doubleMatchesOf(row, candidate);

      if (matchedOn.length === 0) return [];

      return [
        { id: candidate.id, name: candidate.name, number: candidate.number, status: candidate.status, matchedOn },
      ];
    });
}

export function toReviewSubmissionModel(row: MockFunkoRow): ReviewSubmissionApiModel {
  return { ...toSubmissionModel(row), submittedBy: senderOf(row), possibleDoubles: possibleDoublesOf(row) };
}
