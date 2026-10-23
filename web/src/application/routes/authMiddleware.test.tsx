import type { createMemoryRouter } from 'react-router';
import { act, renderRoutes, screen, waitFor } from '@test-utils';
import { AuthStateUtil } from '@app-types/utility';
import { setMockAuthState } from '@mocks/mockStore';
import routes from '.';
import { AUTH_ROUTES_PATHS, BASE_ROUTES_PATHS, FUNKO_ROUTES_PATHS } from './routesUtils';

// The whole route table, so the root middleware, the app shell's gate and the auth pages all take part.
function renderApp(initialEntry: string) {
  const { router } = renderRoutes(routes, { initialEntries: [initialEntry] });

  return router;
}

type MemoryRouter = ReturnType<typeof createMemoryRouter>;

function currentPathOf(router: MemoryRouter): string {
  const { pathname, search } = router.state.location;

  return `${pathname}${search}`;
}

it('sends a signed-out visitor to the login page, remembering where they were going', async () => {
  setMockAuthState(AuthStateUtil.SIGNED_OUT);

  const router = renderApp(`${FUNKO_ROUTES_PATHS.BASE}?q=yoda`);

  expect(await screen.findByRole('heading', { level: 1, name: 'Welcome back!' })).toBeVisible();
  expect(currentPathOf(router)).toBe(`${AUTH_ROUTES_PATHS.LOGIN}?redirectTo=%2Ffunkos%3Fq%3Dyoda`);
});

it('sends a visitor to the first-run page before anyone has set the app up', async () => {
  setMockAuthState(AuthStateUtil.SETUP);

  const router = renderApp(BASE_ROUTES_PATHS.HOME);

  expect(await screen.findByRole('heading', { level: 1, name: "Let's get you set up!" })).toBeVisible();
  expect(router.state.location.pathname).toBe(AUTH_ROUTES_PATHS.SETUP);
});

it('turns a 401 from a later page loader into the login page instead of the error page', async () => {
  const router = renderApp(BASE_ROUTES_PATHS.HOME);

  expect(await screen.findByRole('heading', { level: 1, name: 'Home' })).toBeVisible();

  // The session ends while the app is open: the shell does not check again, the next page's read answers 401.
  setMockAuthState(AuthStateUtil.SIGNED_OUT);
  await act(() => router.navigate(FUNKO_ROUTES_PATHS.BASE));

  expect(await screen.findByRole('heading', { level: 1, name: 'Welcome back!' })).toBeVisible();
  expect(currentPathOf(router)).toBe(`${AUTH_ROUTES_PATHS.LOGIN}?redirectTo=%2Ffunkos`);
  expect(screen.queryByRole('heading', { name: 'Something went wrong' })).not.toBeInTheDocument();
});

it('sends a signed-in user who opens the login page on to the page in redirectTo', async () => {
  const router = renderApp(`${AUTH_ROUTES_PATHS.LOGIN}?redirectTo=%2Fsettings`);

  await waitFor(() => expect(router.state.location.pathname).toBe(BASE_ROUTES_PATHS.SETTINGS));
  expect(await screen.findByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();
});

it('never follows a redirectTo that leaves the app', async () => {
  const router = renderApp(`${AUTH_ROUTES_PATHS.LOGIN}?redirectTo=%2F%2Fevil.example`);

  await waitFor(() => expect(router.state.location.pathname).toBe(BASE_ROUTES_PATHS.HOME));
});
