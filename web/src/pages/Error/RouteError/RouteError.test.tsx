import { http, HttpResponse } from 'msw/http';
import type { RouteObject } from 'react-router';
import { renderRoutes, screen, shellRoute } from '@test-utils';
import { funkoRoutes } from '@application/routes/featureRoutes/funkoRoutes';
import { imageRoutes } from '@application/routes/featureRoutes/imageRoutes';
import { FUNKO_ROUTES_PATHS, IMAGE_ROUTES_PATHS } from '@application/routes/routesUtils';
import { UserRoleUtil } from '@app-types/utility';
import { mockStore, setMockUserRole } from '@mocks/mockStore';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import { SERVER_ERROR_STATUS } from '@utils/httpStatusUtils';
import RouteError from './RouteError';

const SERVER_ERROR_MESSAGE = 'SQLITE_BUSY: database is locked';
const UNKNOWN_PATH = '/no-such-shelf';

// The funko pages under a root that has the app's one error boundary, as in application/routes/index.tsx.
const routes: RouteObject[] = [{ path: '/', errorElement: <RouteError />, children: [shellRoute(funkoRoutes)] }];

it('offers a reload and hides the error itself when a loader fails', async () => {
  const [funko] = mockStore.funkos;
  server.use(
    http.get(`${TEST_BASE_API_URL}/funkos/:funkoId`, () =>
      HttpResponse.json({ code: 'INTERNAL_ERROR', message: SERVER_ERROR_MESSAGE }, { status: SERVER_ERROR_STATUS }),
    ),
  );
  renderRoutes(routes, { initialEntries: [FUNKO_ROUTES_PATHS.detail(String(funko?.id))] });

  expect(await screen.findByRole('heading', { level: 1, name: 'Something went wrong' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Try again' })).toBeVisible();
  expect(screen.queryByText(SERVER_ERROR_MESSAGE)).not.toBeInTheDocument();
});

it('shows the empty shelf with a way home when the address is unknown', async () => {
  renderRoutes(routes, { initialEntries: [UNKNOWN_PATH] });

  expect(await screen.findByRole('heading', { level: 1, name: 'This shelf is empty' })).toBeVisible();
  expect(screen.getByRole('link', { name: 'Back to home' })).toBeVisible();
});

it('says the page is for admins, with a way home, when a member opens the Images page', async () => {
  setMockUserRole(UserRoleUtil.MEMBER);
  const imagePageRoutes: RouteObject[] = [
    { path: '/', errorElement: <RouteError />, children: [shellRoute(imageRoutes)] },
  ];
  renderRoutes(imagePageRoutes, { initialEntries: [IMAGE_ROUTES_PATHS.BASE] });

  expect(await screen.findByRole('heading', { level: 1, name: 'This page is for admins' })).toBeVisible();
  expect(screen.getByRole('link', { name: 'Back to home' })).toBeVisible();
});

it('says the page is for admins when a member opens the Edit funko address directly', async () => {
  setMockUserRole(UserRoleUtil.MEMBER);
  const [funko] = mockStore.funkos;
  renderRoutes(routes, { initialEntries: [FUNKO_ROUTES_PATHS.edit(String(funko?.id))] });

  expect(await screen.findByRole('heading', { level: 1, name: 'This page is for admins' })).toBeVisible();
});
