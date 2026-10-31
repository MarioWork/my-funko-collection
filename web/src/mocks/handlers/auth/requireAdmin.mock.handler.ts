import { http, type HttpRequestHandler } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { HttpVerbsUtil, UserRoleUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { errorResponse } from '@mocks/mockResponses';
import { FORBIDDEN_STATUS } from '@utils/httpStatusUtils';
import { mockStore } from '@mocks/mockStore';
import { AuthApiErrorCodes } from '@services/authService/authService';

type AdminOnlyVerb =
  typeof HttpVerbsUtil.GET | typeof HttpVerbsUtil.POST | typeof HttpVerbsUtil.PATCH | typeof HttpVerbsUtil.DELETE;

type AdminOnlyRoute = {
  method: AdminOnlyVerb;
  path: string;
};

const HANDLER_BY_VERB: Record<AdminOnlyVerb, HttpRequestHandler> = {
  [HttpVerbsUtil.GET]: http.get,
  [HttpVerbsUtil.POST]: http.post,
  [HttpVerbsUtil.PATCH]: http.patch,
  [HttpVerbsUtil.DELETE]: http.delete,
};

// The same routes, in the same order, as ADMIN_ONLY_ROUTES in api/src/modules/auth/auth.route.test.ts: catalogue
// writes (categories, series, funkos and their images), the images lists and the users. Keep the two in step.
const ADMIN_ONLY_ROUTES: AdminOnlyRoute[] = [
  { method: HttpVerbsUtil.POST, path: '/categories' },
  { method: HttpVerbsUtil.PATCH, path: '/categories/:categoryId' },
  { method: HttpVerbsUtil.DELETE, path: '/categories/:categoryId' },
  { method: HttpVerbsUtil.POST, path: '/series' },
  { method: HttpVerbsUtil.PATCH, path: '/series/:seriesId' },
  { method: HttpVerbsUtil.DELETE, path: '/series/:seriesId' },
  { method: HttpVerbsUtil.POST, path: '/funkos' },
  { method: HttpVerbsUtil.PATCH, path: '/funkos/:funkoId' },
  { method: HttpVerbsUtil.DELETE, path: '/funkos/:funkoId' },
  { method: HttpVerbsUtil.POST, path: '/funkos/:funkoId/images' },
  { method: HttpVerbsUtil.POST, path: '/funkos/:funkoId/images/from-url' },
  { method: HttpVerbsUtil.PATCH, path: '/funkos/:funkoId/images/order' },
  { method: HttpVerbsUtil.POST, path: '/funkos/:funkoId/images/:imageId/rotate' },
  { method: HttpVerbsUtil.DELETE, path: '/funkos/:funkoId/images/:imageId' },
  { method: HttpVerbsUtil.GET, path: '/images' },
  { method: HttpVerbsUtil.GET, path: '/images/groups' },
  { method: HttpVerbsUtil.GET, path: '/export/images.csv' },
  { method: HttpVerbsUtil.GET, path: '/export/images.json' },
  { method: HttpVerbsUtil.GET, path: '/export/images.xlsx' },
  { method: HttpVerbsUtil.GET, path: '/users' },
  { method: HttpVerbsUtil.POST, path: '/users' },
];

async function refuseMember() {
  const isAdmin = mockStore.auth.role === UserRoleUtil.ADMIN;

  if (isAdmin) return undefined;

  await delay(MOCK_DELAY);

  return errorResponse(FORBIDDEN_STATUS, AuthApiErrorCodes.ADMIN_ONLY, 'Only an admin can do this');
}

// Registered right after the session check: a member gets 403 ADMIN_ONLY on each admin-only route. An admin gets
// nothing back here, and MSW moves on to the route's own handler.
export default (baseUrl: string) =>
  ADMIN_ONLY_ROUTES.map(({ method, path }) => HANDLER_BY_VERB[method](`${baseUrl}${path}`, refuseMember));
