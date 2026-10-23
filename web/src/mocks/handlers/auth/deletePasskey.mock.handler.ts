import { http } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { errorResponse, notFound } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';
import { AuthApiErrorCodes } from '@services/authService/authService';
import { noContent, reauthRequiredResponse } from './authMockUtils';

export default (baseUrl: string) => [
  http.delete(`${baseUrl}/auth/passkeys/:passkeyId`, async ({ params }) => {
    await delay(MOCK_DELAY);

    const { passkeys } = mockStore.auth;
    const index = passkeys.findIndex((passkey) => passkey.id === params.passkeyId);

    if (index === -1) return notFound('Passkey', String(params.passkeyId));

    if (passkeys.length === 1) {
      return errorResponse(409, AuthApiErrorCodes.LAST_PASSKEY, 'You need at least one passkey.');
    }

    const reauthRequired = reauthRequiredResponse();

    if (reauthRequired) return reauthRequired;

    passkeys.splice(index, 1);

    return noContent();
  }),
];
