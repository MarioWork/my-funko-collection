import { http } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { noContent } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';
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

    if (isSignedInMockUser(userId)) deleteOwnLists();

    endMockSessionsOf(userId);

    return noContent();
  }),
];
