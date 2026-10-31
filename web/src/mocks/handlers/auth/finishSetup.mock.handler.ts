import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { AuthSessionApiModel } from '@app-types/models';
import { AuthStateUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { CONFLICT_STATUS, errorResponse, UNAUTHORIZED_STATUS } from '@mocks/mockResponses';
import { MOCK_SETUP_CODE } from '@mocks/mockAuth';
import { mockStore } from '@mocks/mockStore';
import { nowIso } from '@mocks/mockStoreUtils';
import { AuthApiErrorCodes } from '@services/authService/authService';
import type { FinishSetup } from '@services/authService/authService.type';
import { isCeremonyResponse } from './authMockUtils';

const FIRST_PASSKEY_NAME = 'First passkey';

export default (baseUrl: string) => [
  http.post(`${baseUrl}/auth/setup/verify`, async ({ request }) => {
    await delay(MOCK_DELAY);

    const { code, name, response, passkeyName } = (await request.json()) as FinishSetup;

    if (mockStore.auth.state !== AuthStateUtil.SETUP) {
      return errorResponse(CONFLICT_STATUS, AuthApiErrorCodes.ALREADY_SET_UP, 'This app is already set up.');
    }

    if (code !== MOCK_SETUP_CODE) {
      return errorResponse(UNAUTHORIZED_STATUS, AuthApiErrorCodes.INVALID_SETUP_CODE, 'That setup code is not valid.');
    }

    if (!isCeremonyResponse(response)) {
      return errorResponse(
        UNAUTHORIZED_STATUS,
        AuthApiErrorCodes.PASSKEY_FAILED,
        'That passkey could not be verified.',
      );
    }

    const createdAt = nowIso();

    mockStore.auth = {
      state: AuthStateUtil.SIGNED_IN,
      userName: name,
      username: null,
      password: null,
      isSignInRecent: true,
      passkeys: [
        { id: response.id, name: passkeyName ?? FIRST_PASSKEY_NAME, isSynced: true, createdAt, lastUsedAt: createdAt },
      ],
    };

    return HttpResponse.json<AuthSessionApiModel>({ user: { name, username: null } });
  }),
];
