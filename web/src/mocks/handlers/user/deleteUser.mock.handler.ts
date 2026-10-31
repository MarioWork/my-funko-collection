import { http } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { noContent, notFound } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';
import { reauthRequiredResponse } from '../auth/authMockUtils';
import { endMockSessionsOf, findMockUser, isLastMockAdmin, lastAdminResponse } from './userMockUtils';

const ENTITY = 'User';

// Images the user uploaded stay, with no uploader: a removed user.
function forgetUploader(userId: number): void {
  for (const image of mockStore.images) {
    if (image.uploadedById === userId) image.uploadedById = null;
  }
}

// Like the API: admins only, a recent sign-in, never the last admin. The user's sessions end. The mock store holds
// only the signed-in user's collections, items and tags, so another user's own lists have nothing to remove here.
export default (baseUrl: string) => [
  http.delete(`${baseUrl}/users/:userId`, async ({ params }) => {
    await delay(MOCK_DELAY);

    const reauthRequired = reauthRequiredResponse();

    if (reauthRequired) return reauthRequired;

    const userId = Number(params.userId);
    const user = findMockUser(userId);

    if (!user) return notFound(ENTITY, userId);

    if (isLastMockAdmin(user)) return lastAdminResponse();

    mockStore.users = mockStore.users.filter((candidate) => candidate.id !== userId);
    forgetUploader(userId);
    endMockSessionsOf(userId);

    return noContent();
  }),
];
