// Who sees and changes which catalogue rows, the way the API decides it (docs/adr/0001-shared-catalogue-own-collections.md):
// everyone sees the approved ones, a sender also what they sent in, an admin opens anything by id. A member's new
// funko, category or series is a waiting submission; they change only their own while it waits.
import { SubmissionStatusUtil, UserRoleUtil } from '@app-types/utility';
import { MOCK_USER_ID } from './mockAuth';
import { mockStore } from './mockStore';
import type { MockCategoryRow, MockFunkoRow, MockSeriesRow, MockSubmissionColumns } from './mockStore.type';

export function isMockAdmin(): boolean {
  return mockStore.auth.role === UserRoleUtil.ADMIN;
}

export function isSubmittedByMockUser(row: MockSubmissionColumns): boolean {
  return row.submittedById === MOCK_USER_ID;
}

// The catalogue the user browses (lists, search, suggestions, counts, the barcode lookup, adding to a collection):
// approved, or the signed-in user's own waiting submission. A rejected or merged one is gone from it.
export function isInMockCatalogue(row: MockSubmissionColumns): boolean {
  const isApproved = row.status === SubmissionStatusUtil.APPROVED;
  const isOwnWaiting = row.status === SubmissionStatusUtil.WAITING && isSubmittedByMockUser(row);

  return isApproved || isOwnWaiting;
}

// What the user may read at all (by id, in the export): approved, or anything they sent in.
export function isSentInOrApproved(row: MockSubmissionColumns): boolean {
  return row.status === SubmissionStatusUtil.APPROVED || isSubmittedByMockUser(row);
}

// Opened by id: an admin sees every row, anyone else what they may read.
export function canSeeMockRow(row: MockSubmissionColumns): boolean {
  return isMockAdmin() || isSentInOrApproved(row);
}

export function canEditMockFunko(row: MockSubmissionColumns): boolean {
  const isOwnWaiting = row.status === SubmissionStatusUtil.WAITING && isSubmittedByMockUser(row);

  return isMockAdmin() || isOwnWaiting;
}

// A new row's standing: an admin's joins the catalogue, a member's waits with their name on it.
export function newMockSubmissionColumns(): MockSubmissionColumns {
  if (isMockAdmin()) return { status: SubmissionStatusUtil.APPROVED, submittedById: null };

  return { status: SubmissionStatusUtil.WAITING, submittedById: MOCK_USER_ID };
}

export function catalogueFunkos(): MockFunkoRow[] {
  return mockStore.funkos.filter(isInMockCatalogue);
}

export function catalogueCategories(): MockCategoryRow[] {
  return mockStore.categories.filter(isInMockCatalogue);
}

export function catalogueSeries(): MockSeriesRow[] {
  return mockStore.series.filter(isInMockCatalogue);
}

// The export's funkos and categories: what the user may read, so their items of a rejected one still name it.
export function readableFunkos(): MockFunkoRow[] {
  return mockStore.funkos.filter(isSentInOrApproved);
}

export function readableCategories(): MockCategoryRow[] {
  return mockStore.categories.filter(isSentInOrApproved);
}

// Whether a funko with this standing may use this category or series: an approved one always, a waiting one only
// in its own sender's waiting submission.
export function isUsableByMockFunko(reference: MockSubmissionColumns, funko: MockSubmissionColumns): boolean {
  const isApproved = reference.status === SubmissionStatusUtil.APPROVED;
  const isWaitingSubmission = funko.status === SubmissionStatusUtil.WAITING;
  const isSameSender = reference.submittedById !== null && reference.submittedById === funko.submittedById;

  return isApproved || (isWaitingSubmission && isSameSender);
}
