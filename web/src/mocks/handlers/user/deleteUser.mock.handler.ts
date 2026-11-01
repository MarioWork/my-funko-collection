import { http } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { dropNotificationsOf, forgetNotifiedFunkos } from '@mocks/handlers/notification/notificationMockUtils';
import { SubmissionStatusUtil } from '@app-types/utility';
import { noContent } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';
import type { MockFunkoRow, MockRowWithId, MockSubmissionColumns } from '@mocks/mockStore.type';
import {
  endMockSessionsOf,
  isLastMockAdmin,
  isSignedInMockUser,
  lastAdminResponse,
  readManagedMockUser,
} from './userMockUtils';

// Images the user uploaded stay, with no uploader: a removed user.
function forgetUploader(userId: number): void {
  for (const image of mockStore.images) {
    if (image.uploadedById === userId) image.uploadedById = null;
  }
}

// What the user sent in, as the API's database trigger handles it: their rejected submissions go with any item of
// them, their unused never-approved categories and series go, and everything else stays with no sender (a waiting
// one waits on for an admin).
function settleSubmissionsOf(userId: number): void {
  const isRejectedOfUser = (funko: MockFunkoRow) =>
    funko.submittedById === userId && funko.status === SubmissionStatusUtil.REJECTED;
  const rejectedIds = new Set(mockStore.funkos.filter(isRejectedOfUser).map((funko) => funko.id));

  mockStore.items = mockStore.items.filter((item) => !rejectedIds.has(item.funkoId));
  mockStore.images = mockStore.images.filter((image) => !rejectedIds.has(image.funkoId));
  mockStore.funkos = mockStore.funkos.filter((funko) => !rejectedIds.has(funko.id));
  forgetNotifiedFunkos(rejectedIds);
  mockStore.categories = mockStore.categories.filter(
    (category) => !isUnusedSubmissionOf(category, userId, 'categoryId'),
  );
  mockStore.series = mockStore.series.filter((series) => !isUnusedSubmissionOf(series, userId, 'seriesId'));

  for (const row of [...mockStore.funkos, ...mockStore.categories, ...mockStore.series]) {
    if (row.submittedById === userId) row.submittedById = null;
  }
}

type SubmittedReference = MockRowWithId & MockSubmissionColumns;

// The funko column that points at a category or a series.
type ReferenceColumn = keyof Pick<MockFunkoRow, 'categoryId' | 'seriesId'>;

// A never-approved category or series the user typed in that no funko uses any more.
function isUnusedSubmissionOf(reference: SubmittedReference, userId: number, funkoColumn: ReferenceColumn): boolean {
  const isOwnUnapproved = reference.submittedById === userId && reference.status !== SubmissionStatusUtil.APPROVED;
  const isUsed = mockStore.funkos.some((funko) => funko[funkoColumn] === reference.id);

  return isOwnUnapproved && !isUsed;
}

// The store holds only the signed-in user's own collections, items and tags: deleting them takes those too (the
// API's cascade). Their row stays listed, built from the sign-in, but this browser is signed out.
function deleteOwnLists(): void {
  mockStore.collections = [];
  mockStore.items = [];
  mockStore.tags = [];
}

// Like the API: admins only, a recent sign-in, never the last admin. The user's sessions end. Another user's own lists
// are not in the mock store, so there is nothing more to remove for them.
export default (baseUrl: string) => [
  http.delete(`${baseUrl}/users/:userId`, async ({ params }) => {
    await delay(MOCK_DELAY);

    const managed = readManagedMockUser(params.userId);

    if (managed instanceof Response) return managed;

    const { userId, user } = managed;

    if (isLastMockAdmin(user)) return lastAdminResponse();

    mockStore.users = mockStore.users.filter((candidate) => candidate.id !== userId);
    forgetUploader(userId);
    dropNotificationsOf(userId);
    settleSubmissionsOf(userId);

    if (isSignedInMockUser(userId)) deleteOwnLists();

    endMockSessionsOf(userId);

    return noContent();
  }),
];
