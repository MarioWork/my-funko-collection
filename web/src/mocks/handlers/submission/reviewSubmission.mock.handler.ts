import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { NotificationKindUtil, SubmissionStatusUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import {
  DUPLICATE_BARCODE_MESSAGE,
  DUPLICATE_FUNKO_MESSAGE,
  findBarcodeTwin,
  findDuplicate,
  findEditableFunko,
} from '@mocks/handlers/funko/funkoMockUtils';
import {
  forgetNotifiedFunkos,
  notifyMockAdmins,
  notifyMockSender,
} from '@mocks/handlers/notification/notificationMockUtils';
import { badRequest, conflict, noContent } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';
import type { MockFunkoRow, MockSubmissionColumns } from '@mocks/mockStore.type';
import { nowIso } from '@mocks/mockStoreUtils';
import type { RejectSubmission } from '@services/submissionService/submissionService.type';
import { REJECTION_REASON_MAX_LENGTH } from '@utils/submissionUtils';
import {
  approveReference,
  catalogueReferenceIdOf,
  findWaitingSubmission,
  toSubmissionModel,
  type NamedSubmissionRow,
} from './submissionMockUtils';

// The API's answers, word for word where the page shows them.
const NOT_REJECTED_MESSAGE = 'Only a rejected submission can be sent again';
const CATALOGUE_HAS_FUNKO_MESSAGE = 'The catalogue already has this funko. Reject this submission, or change it first';
const CATALOGUE_HAS_BARCODE_MESSAGE =
  'This barcode belongs to another funko in the catalogue. Reject this submission, or change it first';

const APPROVED: MockSubmissionColumns = { status: SubmissionStatusUtil.APPROVED, submittedById: null };

// A waiting category or series the funko left for an approved twin goes once no funko uses it.
function dropUnused<Row extends NamedSubmissionRow>(rows: Row[], id: number, isUsed: (id: number) => boolean) {
  return rows.filter((row) => row.id !== id || row.status === SubmissionStatusUtil.APPROVED || isUsed(row.id));
}

// The never-approved category and series a funko left (approved onto a twin, or deleted) go once no funko uses them.
function dropUnusedReferencesOf(categoryId: number, seriesId: number): void {
  mockStore.categories = dropUnused(mockStore.categories, categoryId, (id) =>
    mockStore.funkos.some((row) => row.categoryId === id),
  );
  mockStore.series = dropUnused(mockStore.series, seriesId, (id) =>
    mockStore.funkos.some((row) => row.seriesId === id),
  );
}

function approve(funko: MockFunkoRow): void {
  const leftCategoryId = funko.categoryId;
  const leftSeriesId = funko.seriesId;

  funko.categoryId = approveReference(mockStore.categories, funko.categoryId);
  funko.seriesId = approveReference(mockStore.series, funko.seriesId);
  Object.assign(funko, { status: SubmissionStatusUtil.APPROVED, reviewedAt: nowIso(), updatedAt: nowIso() });

  dropUnusedReferencesOf(leftCategoryId, leftSeriesId);
}

// The same funko or barcode already in the catalogue refuses the approval, pointing at it.
function catalogueClashOf(funko: MockFunkoRow): Response | undefined {
  const candidate = {
    ...funko,
    ...APPROVED,
    categoryId: catalogueReferenceIdOf(mockStore.categories, funko.categoryId),
  };
  const duplicate = findDuplicate(candidate, funko.id);

  if (duplicate) return conflict(CATALOGUE_HAS_FUNKO_MESSAGE, duplicate.id);

  const sameBarcode = findBarcodeTwin(candidate, funko.id);

  if (sameBarcode) return conflict(CATALOGUE_HAS_BARCODE_MESSAGE, sameBarcode.id);

  return undefined;
}

// Sending a rejected one again checks it as a waiting one: against the catalogue and the sender's other waiting ones.
function waitingClashOf(funko: MockFunkoRow): Response | undefined {
  const candidate = { ...funko, status: SubmissionStatusUtil.WAITING };
  const duplicate = findDuplicate(candidate, funko.id);

  if (duplicate) return conflict(DUPLICATE_FUNKO_MESSAGE, duplicate.id);

  const sameBarcode = findBarcodeTwin(candidate, funko.id);

  return sameBarcode ? conflict(DUPLICATE_BARCODE_MESSAGE, sameBarcode.id) : undefined;
}

// An orphan submission (its sender removed) is deleted on reject, as the API does: with any items, and the removed
// user's never-approved category and series no funko uses any more. Its image rows go; the API keeps the files.
function deleteOrphan(funko: MockFunkoRow): void {
  mockStore.funkos = mockStore.funkos.filter((row) => row.id !== funko.id);
  forgetNotifiedFunkos(new Set([funko.id]));
  mockStore.items = mockStore.items.filter((item) => item.funkoId !== funko.id);
  mockStore.images = mockStore.images.filter((image) => image.funkoId !== funko.id);
  dropUnusedReferencesOf(funko.categoryId, funko.seriesId);
}

function rejectionReasonOf(body: Partial<RejectSubmission>): string | undefined {
  const reason = body.reason?.trim() ?? '';
  const isValid = reason.length > 0 && reason.length <= REJECTION_REASON_MAX_LENGTH;

  return isValid ? reason : undefined;
}

// Approving, rejecting (admins only: requireAdmin refuses members first) and sending a rejected one again (its
// sender), like the API, each with its notification: to the sender, or to every admin.
export default (baseUrl: string) => [
  http.post(`${baseUrl}/submissions/:funkoId/approval`, async ({ params }) => {
    await delay(MOCK_DELAY);

    const target = findWaitingSubmission(String(params.funkoId));

    if ('refusal' in target) return target.refusal;

    const clash = catalogueClashOf(target.funko);

    if (clash) return clash;

    approve(target.funko);
    notifyMockSender(NotificationKindUtil.SUBMISSION_APPROVED, target.funko);

    return HttpResponse.json(toSubmissionModel(target.funko));
  }),
  http.post(`${baseUrl}/submissions/:funkoId/rejection`, async ({ params, request }) => {
    await delay(MOCK_DELAY);

    const reason = rejectionReasonOf((await request.json()) as Partial<RejectSubmission>);

    if (!reason) return badRequest('Say why the submission is rejected');

    const target = findWaitingSubmission(String(params.funkoId));

    if ('refusal' in target) return target.refusal;

    const isOrphan = target.funko.submittedById === null;

    if (isOrphan) {
      deleteOrphan(target.funko);

      return noContent();
    }

    Object.assign(target.funko, {
      status: SubmissionStatusUtil.REJECTED,
      rejectionReason: reason,
      reviewedAt: nowIso(),
      updatedAt: nowIso(),
    });
    notifyMockSender(NotificationKindUtil.SUBMISSION_REJECTED, target.funko, reason);

    return HttpResponse.json(toSubmissionModel(target.funko));
  }),
  http.post(`${baseUrl}/submissions/:funkoId/resubmission`, async ({ params }) => {
    await delay(MOCK_DELAY);

    const target = findEditableFunko(String(params.funkoId));

    if ('refusal' in target) return target.refusal;

    if (target.funko.status !== SubmissionStatusUtil.REJECTED) return conflict(NOT_REJECTED_MESSAGE);

    const clash = waitingClashOf(target.funko);

    if (clash) return clash;

    Object.assign(target.funko, {
      status: SubmissionStatusUtil.WAITING,
      rejectionReason: null,
      changedByAdminAt: null,
      updatedAt: nowIso(),
    });
    notifyMockAdmins(NotificationKindUtil.SUBMISSION_RESENT, target.funko);

    return HttpResponse.json(toSubmissionModel(target.funko));
  }),
];
