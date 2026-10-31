import { http, HttpResponse } from 'msw/http';
import type { AuthSessionApiModel } from '@app-types/models';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { errorResponse } from '@mocks/mockResponses';
import { BAD_REQUEST_STATUS } from '@utils/httpStatusUtils';
import { mockStore } from '@mocks/mockStore';
import { AuthApiErrorCodes } from '@services/authService/authService';
import type { SetPassword } from '@services/authService/authService.type';
import { mockUserOf, reauthRequiredResponse } from './authMockUtils';

// A stand-in for the API's built-in list of common passwords: enough to show the refusal in mock mode.
const MOCK_COMMON_PASSWORDS = new Set(['password12345678', 'qwertyuiopasdfgh', 'iloveyouforever']);

export default (baseUrl: string) => [
  http.put(`${baseUrl}/auth/password`, async ({ request }) => {
    await delay(MOCK_DELAY);

    const reauthRequired = reauthRequiredResponse();

    if (reauthRequired) return reauthRequired;

    const { username, password } = (await request.json()) as SetPassword;

    if (MOCK_COMMON_PASSWORDS.has(password.toLowerCase())) {
      return errorResponse(
        BAD_REQUEST_STATUS,
        AuthApiErrorCodes.COMMON_PASSWORD,
        'That password is too common. Pick one nobody would guess.',
      );
    }

    mockStore.auth.username = username.trim().toLowerCase();
    mockStore.auth.password = password;

    return HttpResponse.json<AuthSessionApiModel>({ user: mockUserOf(mockStore.auth) });
  }),
];
