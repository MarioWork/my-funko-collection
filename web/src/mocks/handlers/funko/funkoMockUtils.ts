import { SubmissionStatusUtil } from '@app-types/utility';
import { canEditMockFunko, canSeeMockRow, isUsableByMockFunko } from '@mocks/mockCatalogueUtils';
import { badRequest, errorResponse, notFound } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';
import type { MockFunkoRow, MockSubmissionColumns } from '@mocks/mockStore.type';
import { AuthApiErrorCodes } from '@services/authService/authService';
import { FORBIDDEN_STATUS } from '@utils/httpStatusUtils';

const ADMIN_ONLY_MESSAGE = 'Only an admin can change a funko in the catalogue';

type BarcodeCandidate = MockSubmissionColumns & { barcode: string | null };
type ReferenceCandidate = MockSubmissionColumns & { categoryId: number; seriesId: number | null };

// The funko a write may change, or the response the API gives instead.
type EditableFunkoLookup = { funko: MockFunkoRow } | { refusal: Response };

// The fields that make two funkos the same one, as the API's unique index has them.
type FunkoIdentity = Pick<MockFunkoRow, 'categoryId' | 'number' | 'name' | 'isChase' | 'exclusive'>;

// Where the unique rules hold, as the API's partial indexes: among the approved funkos, or among one sender's
// waiting submissions. Two members may each wait on the same box.
function isSameUniqueScope(funko: MockSubmissionColumns, candidate: MockSubmissionColumns): boolean {
  if (candidate.status === SubmissionStatusUtil.APPROVED) return funko.status === SubmissionStatusUtil.APPROVED;

  return funko.status === SubmissionStatusUtil.WAITING && funko.submittedById === candidate.submittedById;
}

// The scopes a funko is checked in: an approved one against the catalogue; a waiting one against the catalogue
// (so the member is pointed at the one already there) and its sender's other waiting ones.
function scopesOf(candidate: MockSubmissionColumns): MockSubmissionColumns[] {
  const catalogue = { status: SubmissionStatusUtil.APPROVED, submittedById: null };

  if (candidate.status === SubmissionStatusUtil.APPROVED) return [catalogue];
  if (candidate.status === SubmissionStatusUtil.WAITING) return [catalogue, candidate];

  return [];
}

function inScopes(funko: MockFunkoRow, candidate: MockSubmissionColumns): boolean {
  return scopesOf(candidate).some((scope) => isSameUniqueScope(funko, scope));
}

// Another funko with the same barcode in the candidate's scopes; `selfId` leaves out the funko being edited.
export function findBarcodeTwin(candidate: BarcodeCandidate, selfId?: number): MockFunkoRow | undefined {
  if (!candidate.barcode) return undefined;

  return mockStore.funkos.find(
    (funko) => funko.id !== selfId && funko.barcode === candidate.barcode && inScopes(funko, candidate),
  );
}

// Why this funko may not use the body's category or series (a 400, as the API answers), or undefined.
export function referenceRefusal(candidate: ReferenceCandidate): Response | undefined {
  const category = mockStore.categories.find((row) => row.id === candidate.categoryId);

  if (!category || !isUsableByMockFunko(category, candidate)) {
    return badRequest(`Category ${candidate.categoryId} does not exist`);
  }

  if (candidate.seriesId === null) return undefined;

  const series = mockStore.series.find((row) => row.id === candidate.seriesId);

  if (!series || !isUsableByMockFunko(series, candidate))
    return badRequest(`Series ${candidate.seriesId} does not exist`);

  return undefined;
}

// The funko a write aims at, or the answer the API gives instead: 404 when the user cannot see it, 403 ADMIN_ONLY
// when they see it but may not change it (only their own waiting submission, unless they are an admin).
export function findEditableFunko(funkoId: string): EditableFunkoLookup {
  const funko = mockStore.funkos.find((candidate) => String(candidate.id) === funkoId);

  if (!funko || !canSeeMockRow(funko)) return { refusal: notFound('Funko', funkoId) };

  if (!canEditMockFunko(funko)) {
    return { refusal: errorResponse(FORBIDDEN_STATUS, AuthApiErrorCodes.ADMIN_ONLY, ADMIN_ONLY_MESSAGE) };
  }

  return { funko };
}

// Another funko with the same identity in the candidate's scopes; `selfId` leaves out the funko being edited.
export function findDuplicate(
  candidate: FunkoIdentity & MockSubmissionColumns,
  selfId?: number,
): MockFunkoRow | undefined {
  return mockStore.funkos.find(
    (funko) =>
      funko.id !== selfId &&
      inScopes(funko, candidate) &&
      funko.categoryId === candidate.categoryId &&
      funko.number === candidate.number &&
      funko.name === candidate.name &&
      funko.isChase === candidate.isChase &&
      funko.exclusive === candidate.exclusive,
  );
}
