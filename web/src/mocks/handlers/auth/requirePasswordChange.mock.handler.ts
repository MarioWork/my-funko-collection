import { http } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { HttpVerbsUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { errorResponse } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';
import { AuthApiErrorCodes } from '@services/authService/authService';
import { FORBIDDEN_STATUS } from '@utils/httpStatusUtils';

// What a temporary-password session may still call, like the API: the public routes (status, sign-in, first run,
// sign-out), replacing the password, and signing out everywhere.
const PUBLIC_PATH_PATTERN = /\/auth\/(status$|logout$|login\/|setup\/)/;
const SIGN_OUT_EVERYWHERE_PATH_PATTERN = /\/auth\/logout-everywhere$/;
const PASSWORD_PATH_PATTERN = /\/auth\/password$/;

function isAllowedWithTemporaryPassword(request: Request): boolean {
  const { pathname } = new URL(request.url);
  const isPasswordChange = request.method === HttpVerbsUtil.PUT && PASSWORD_PATH_PATTERN.test(pathname);

  return PUBLIC_PATH_PATTERN.test(pathname) || SIGN_OUT_EVERYWHERE_PATH_PATTERN.test(pathname) || isPasswordChange;
}

// Registered right after the session check: signed in with a temporary password, every other route answers 403
// PASSWORD_CHANGE_REQUIRED. Otherwise it returns nothing and MSW moves on to the route's own handler.
export default (baseUrl: string) => [
  http.all(`${baseUrl}/*`, async ({ request }) => {
    const isRefused = mockStore.auth.mustChangePassword && !isAllowedWithTemporaryPassword(request);

    if (!isRefused) return undefined;

    await delay(MOCK_DELAY);

    return errorResponse(
      FORBIDDEN_STATUS,
      AuthApiErrorCodes.PASSWORD_CHANGE_REQUIRED,
      'Choose your own password first',
    );
  }),
];
