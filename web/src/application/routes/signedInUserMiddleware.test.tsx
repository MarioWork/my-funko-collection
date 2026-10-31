import { act, renderRoutes, screen } from '@test-utils';
import authService from '@services/authService/authService';
import routes from '.';
import { BASE_ROUTES_PATHS, FUNKO_ROUTES_PATHS } from './routesUtils';

// The whole route table, so the shell's middleware runs as it does in the app.
it('asks the API for the signed-in user once when the user moves between pages', async () => {
  const getStatus = vi.spyOn(authService, 'getStatus');
  const { router } = renderRoutes(routes, { initialEntries: [BASE_ROUTES_PATHS.HOME] });

  expect(await screen.findByRole('heading', { level: 1, name: 'Home' })).toBeVisible();

  await act(() => router.navigate(FUNKO_ROUTES_PATHS.BASE));
  await act(() => router.navigate(BASE_ROUTES_PATHS.SETTINGS));

  expect(await screen.findByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();
  expect(getStatus).toHaveBeenCalledTimes(1);
});
