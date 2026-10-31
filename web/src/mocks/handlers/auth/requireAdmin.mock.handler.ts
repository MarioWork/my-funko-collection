import { http } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { UserRoleUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { errorResponse, FORBIDDEN_STATUS } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';
import { AuthApiErrorCodes } from '@services/authService/authService';

const READ_METHOD = 'GET';
// Every write under these is a catalogue write: funkos (and their images), categories, series.
const CATALOGUE_PATH_PATTERN = /\/(funkos|categories|series)(\/|$)/;
// The images lists and their export: read-only, but admin-only too.
const IMAGES_PATH_PATTERN = /\/(images(\/groups)?|export\/images\.\w+)$/;

function isAdminOnly(request: Request): boolean {
  const { pathname } = new URL(request.url);
  const isRead = request.method === READ_METHOD;
  const isCatalogueWrite = !isRead && CATALOGUE_PATH_PATTERN.test(pathname);
  const isImagesRead = isRead && IMAGES_PATH_PATTERN.test(pathname);

  return isCatalogueWrite || isImagesRead;
}

// Registered right after the session check: a member gets 403 ADMIN_ONLY on the routes the API keeps for admins
// (its auth.route.test.ts ADMIN_ONLY_ROUTES). Otherwise it returns nothing and MSW moves on to the route's handler.
export default (baseUrl: string) => [
  http.all(`${baseUrl}/*`, async ({ request }) => {
    const isAdmin = mockStore.auth.role === UserRoleUtil.ADMIN;

    if (isAdmin || !isAdminOnly(request)) return undefined;

    await delay(MOCK_DELAY);

    return errorResponse(FORBIDDEN_STATUS, AuthApiErrorCodes.ADMIN_ONLY, 'Only an admin can do this');
  }),
];
