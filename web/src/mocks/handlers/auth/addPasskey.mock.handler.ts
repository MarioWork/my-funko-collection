import { http } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { PasskeyApiModel } from '@app-types/models';
import { MOCK_DELAY } from '@mocks/handlers';
import { created, errorResponse } from '@mocks/mockResponses';
import { BAD_REQUEST_STATUS } from '@utils/httpStatusUtils';
import { mockStore } from '@mocks/mockStore';
import { nowIso } from '@mocks/mockStoreUtils';
import { AuthApiErrorCodes } from '@services/authService/authService';
import type { CreatePasskey } from '@services/authService/authService.type';
import { isCeremonyResponse, reauthRequiredResponse } from './authMockUtils';

export default (baseUrl: string) => [
  http.post(`${baseUrl}/auth/passkeys/verify`, async ({ request }) => {
    await delay(MOCK_DELAY);

    const reauthRequired = reauthRequiredResponse();

    if (reauthRequired) return reauthRequired;

    const { response, name } = (await request.json()) as CreatePasskey;

    if (!isCeremonyResponse(response)) {
      return errorResponse(BAD_REQUEST_STATUS, AuthApiErrorCodes.PASSKEY_FAILED, 'That passkey could not be verified.');
    }

    const passkey: PasskeyApiModel = { id: response.id, name, isSynced: false, createdAt: nowIso(), lastUsedAt: null };

    mockStore.auth.passkeys.push(passkey);

    return created(passkey);
  }),
];
