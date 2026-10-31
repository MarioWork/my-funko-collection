import type { createMemoryRouter } from 'react-router';
import { act, renderRoutes, screen, userEvent, within } from '@test-utils';
import { AuthStateUtil, UserRoleUtil } from '@app-types/utility';
import { mockStore, setMockAuthState, setMockUserRole } from '@mocks/mockStore';
import { server } from '@mocks/server';
import routes from '.';
import { AUTH_ROUTES_PATHS, BASE_ROUTES_PATHS, FUNKO_ROUTES_PATHS, IMAGE_ROUTES_PATHS } from './routesUtils';

type MemoryRouter = ReturnType<typeof createMemoryRouter>;

type RequestStartListener = Parameters<typeof server.events.on<'request:start'>>[1];

const STATUS_PATH = '/auth/status';
const USERNAME = 'mario';
const PASSWORD = 'shelves full of tiny heads';
const OTHER_USER_NAME = 'Bea';
const OTHER_USERNAME = 'bea';
const OTHER_PASSWORD = 'a shelf of vinyl heroes';

let statusRequestCount = 0;

// Counts what reaches the wire: every GET /auth/status, whoever sent it.
const countStatusRequest: RequestStartListener = ({ request }) => {
  const isStatusRequest = new URL(request.url).pathname.endsWith(STATUS_PATH);

  if (isStatusRequest) statusRequestCount += 1;
};

beforeEach(() => {
  statusRequestCount = 0;
  server.events.on('request:start', countStatusRequest);
  Object.assign(mockStore.auth, { username: USERNAME, password: PASSWORD });
});

afterEach(() => {
  server.events.removeListener('request:start', countStatusRequest);
});

// The whole route table, so the shell's middleware, the root middleware and the auth pages run as in the app.
function renderApp(initialEntry: string): MemoryRouter {
  const { router } = renderRoutes(routes, { initialEntries: [initialEntry] });

  return router;
}

async function signInWithPassword(username: string, password: string): Promise<void> {
  const form = await screen.findByRole('form', { name: 'Sign in with a password' });

  await userEvent.type(within(form).getByLabelText('Username'), username);
  await userEvent.type(within(form).getByLabelText('Password'), password);
  await userEvent.click(within(form).getByRole('button', { name: 'Sign in with password' }));
}

async function signOutFromSettings(router: MemoryRouter): Promise<void> {
  await act(() => router.navigate(BASE_ROUTES_PATHS.SETTINGS));
  await userEvent.click(await screen.findByRole('button', { name: 'Sign out' }));

  expect(await screen.findByRole('heading', { level: 1, name: 'Welcome back!' })).toBeVisible();
}

it('asks the API for the signed-in user once when the user moves between pages', async () => {
  const router = renderApp(BASE_ROUTES_PATHS.HOME);

  expect(await screen.findByRole('heading', { level: 1, name: 'Home' })).toBeVisible();

  await act(() => router.navigate(FUNKO_ROUTES_PATHS.BASE));
  await act(() => router.navigate(BASE_ROUTES_PATHS.SETTINGS));

  expect(await screen.findByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();
  expect(statusRequestCount).toBe(1);
});

it('asks for the user again after signing out and back in', async () => {
  const router = renderApp(BASE_ROUTES_PATHS.HOME);
  expect(await screen.findByRole('heading', { level: 1, name: 'Home' })).toBeVisible();

  await signOutFromSettings(router);
  const countBeforeSignIn = statusRequestCount;
  await signInWithPassword(USERNAME, PASSWORD);

  expect(await screen.findByRole('heading', { level: 1, name: 'Home' })).toBeVisible();
  expect(statusRequestCount).toBe(countBeforeSignIn + 1);
});

it('asks for the user again when signing in after the session ran out', async () => {
  const router = renderApp(BASE_ROUTES_PATHS.HOME);
  expect(await screen.findByRole('heading', { level: 1, name: 'Home' })).toBeVisible();

  // The session ends while the app is open: the next page's read answers 401 and the login page shows.
  setMockAuthState(AuthStateUtil.SIGNED_OUT);
  Object.assign(mockStore.auth, { username: USERNAME, password: PASSWORD });
  await act(() => router.navigate(FUNKO_ROUTES_PATHS.BASE));
  const countBeforeSignIn = statusRequestCount;
  await signInWithPassword(USERNAME, PASSWORD);

  expect(await screen.findByRole('heading', { level: 1, name: 'Funkos' })).toBeVisible();
  expect(statusRequestCount).toBe(countBeforeSignIn + 1);
});

it('shows the new role after signing out and back in', async () => {
  const router = renderApp(BASE_ROUTES_PATHS.HOME);
  expect(await screen.findByRole('heading', { level: 1, name: 'Home' })).toBeVisible();

  setMockUserRole(UserRoleUtil.MEMBER);
  await signOutFromSettings(router);
  await signInWithPassword(USERNAME, PASSWORD);
  expect(await screen.findByRole('heading', { level: 1, name: 'Home' })).toBeVisible();
  await act(() => router.navigate(IMAGE_ROUTES_PATHS.BASE));

  expect(await screen.findByRole('heading', { level: 1, name: 'This page is for admins' })).toBeVisible();
});

it('shows the new role on the next page once the API answers 403 ADMIN_ONLY', async () => {
  const router = renderApp(BASE_ROUTES_PATHS.HOME);
  expect(await screen.findByRole('heading', { level: 1, name: 'Home' })).toBeVisible();

  // Made a member while the app is open: the cached admin opens Images, and the API refuses the list.
  setMockUserRole(UserRoleUtil.MEMBER);
  await act(() => router.navigate(IMAGE_ROUTES_PATHS.BASE));
  expect(await screen.findByRole('heading', { level: 1, name: 'Something went wrong' })).toBeVisible();
  await act(() => router.navigate(IMAGE_ROUTES_PATHS.BASE));

  expect(await screen.findByRole('heading', { level: 1, name: 'This page is for admins' })).toBeVisible();
  expect(statusRequestCount).toBe(2);
});

it('shows the new user after someone else signs in on the same browser', async () => {
  const router = renderApp(BASE_ROUTES_PATHS.SETTINGS);
  expect(await screen.findByText('Mario')).toBeVisible();

  // Mario's session ends elsewhere; Bea opens the login page in this tab and signs in with her own account.
  setMockAuthState(AuthStateUtil.SIGNED_OUT);
  Object.assign(mockStore.auth, { userName: OTHER_USER_NAME, username: OTHER_USERNAME, password: OTHER_PASSWORD });
  await act(() => router.navigate(AUTH_ROUTES_PATHS.LOGIN));
  await signInWithPassword(OTHER_USERNAME, OTHER_PASSWORD);
  expect(await screen.findByRole('heading', { level: 1, name: 'Home' })).toBeVisible();
  await act(() => router.navigate(BASE_ROUTES_PATHS.SETTINGS));

  expect(await screen.findByText(OTHER_USER_NAME)).toBeVisible();
  expect(screen.queryByText('Mario')).not.toBeInTheDocument();
});
