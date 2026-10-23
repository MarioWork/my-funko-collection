import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { mockStore } from '@mocks/mockStore';
import { createCreationOptionsMockModel } from './models/passkeyOptionsMockModel.mock';
import { reauthRequiredResponse, rpIdOf } from './authMockUtils';

// Excludes the passkeys already registered, so an authenticator that holds one says so.
export default (baseUrl: string) => [
  http.post(`${baseUrl}/auth/passkeys/options`, async ({ request }) => {
    await delay(MOCK_DELAY);

    const reauthRequired = reauthRequiredResponse();

    if (reauthRequired) return reauthRequired;

    const { userName, passkeys } = mockStore.auth;

    return HttpResponse.json(
      createCreationOptionsMockModel(
        rpIdOf(request),
        userName,
        passkeys.map((passkey) => passkey.id),
      ),
    );
  }),
];
