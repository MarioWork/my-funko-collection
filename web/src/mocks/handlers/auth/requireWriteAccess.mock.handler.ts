import { http } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { HttpVerbsUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { errorResponse } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';
import { AuthApiErrorCodes } from '@services/authService/authService';
import { FORBIDDEN_STATUS } from '@utils/httpStatusUtils';

// What a read-only user may still write, like ALLOWED_WHEN_READ_ONLY in api/src/modules/auth/auth.route.test.ts:
// the public routes (sign-in, first run, sign-out), their own password and passkeys (and the recent sign-in they
// need), and signing out everywhere.
const OWN_ACCOUNT_PATH_PATTERN =
  /\/auth\/(logout$|logout-everywhere$|login\/|setup\/|password$|recent-sign-in$|passkeys(\/|$))/;
const HEAD_METHOD = 'HEAD';
const OPTIONS_METHOD = 'OPTIONS';
const READ_METHODS = new Set<string>([HttpVerbsUtil.GET, HEAD_METHOD, OPTIONS_METHOD]);
const READ_ONLY_MESSAGE = 'This account is read-only';

function isAllowedWhenReadOnly(request: Request): boolean {
  const isRead = READ_METHODS.has(request.method);

  return isRead || OWN_ACCOUNT_PATH_PATTERN.test(new URL(request.url).pathname);
}

// Registered right after the temporary-password check: a read-only user's every other write answers 403 READ_ONLY.
// Otherwise it returns nothing and MSW moves on to the route's own handler.
export default (baseUrl: string) => [
  http.all(`${baseUrl}/*`, async ({ request }) => {
    const isRefused = mockStore.auth.isReadOnly && !isAllowedWhenReadOnly(request);

    if (!isRefused) return undefined;

    await delay(MOCK_DELAY);

    return errorResponse(FORBIDDEN_STATUS, AuthApiErrorCodes.READ_ONLY, READ_ONLY_MESSAGE);
  }),
];
