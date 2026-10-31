import { startAuthentication } from '@simplewebauthn/browser';
import { renderRoutes, screen, userEvent, within } from '@test-utils';
import { UserRoleUtil } from '@app-types/utility';
import { userRoutes } from '@application/routes/featureRoutes/userRoutes';
import { USER_ROUTES_PATHS } from '@application/routes/routesUtils';
import RouteError from '@pages/Error/RouteError';
import { createAuthenticationResponseMockModel } from '@mocks/handlers/auth/models/passkeyResponseMockModel.mock';
import { mockStore, setMockUserRole } from '@mocks/mockStore';

vi.mock('@simplewebauthn/browser', () => ({
  browserSupportsWebAuthn: vi.fn(() => true),
  startAuthentication: vi.fn(),
  startRegistration: vi.fn(),
}));

// The page under the route error boundary, as in the app, so a member's refusal shows its page.
const routes = [{ errorElement: <RouteError />, children: userRoutes }];

const renderUsers = (path: string = USER_ROUTES_PATHS.BASE) => renderRoutes(routes, { initialEntries: [path] });

function rowOf(username: string): HTMLElement {
  const row = screen.getByRole('cell', { name: username }).closest('tr');

  if (!row) throw new Error(`No row for ${username}`);

  return row;
}

async function createUser(username: string, role: string): Promise<void> {
  await userEvent.type(await screen.findByLabelText('Username'), username);
  await userEvent.selectOptions(screen.getByLabelText('Role'), role);
  await userEvent.click(screen.getByRole('button', { name: 'Create user' }));
}

it('lists every user with their role and their state in words', async () => {
  renderUsers();

  expect(await screen.findByRole('heading', { level: 1, name: 'Users' })).toBeVisible();
  expect(within(rowOf('leia')).getByText('Admin')).toBeVisible();
  expect(within(rowOf('leia')).getByText('Active')).toBeVisible();
  expect(within(rowOf('luke')).getByText('Member')).toBeVisible();
  expect(within(rowOf('luke')).getByText('Temporary password')).toBeVisible();
  expect(within(rowOf('han')).getByText('Temporary password expired')).toBeVisible();
  expect(screen.getByText('4 users')).toBeVisible();
});

it('says the page is for admins when a member opens it', async () => {
  setMockUserRole(UserRoleUtil.MEMBER);

  renderUsers();

  expect(await screen.findByRole('heading', { level: 1, name: 'This page is for admins' })).toBeVisible();
});

it('creates a user and shows their temporary password once, then lists them', async () => {
  renderUsers(`${USER_ROUTES_PATHS.BASE}/${USER_ROUTES_PATHS.ADD}`);

  await createUser('Rey', 'Admin');

  const password = await screen.findByLabelText('Temporary password');
  expect(password).toHaveValue(mockStore.users.at(-1)?.password);
  expect(password).toHaveAccessibleDescription(/Copy it now: it is not shown again\./);
  await userEvent.click(screen.getByRole('button', { name: 'Done' }));
  expect(await screen.findByRole('cell', { name: 'rey' })).toBeVisible();
  expect(within(rowOf('rey')).getByText('Admin')).toBeVisible();
  expect(screen.queryByLabelText('Temporary password')).not.toBeInTheDocument();
});

it('asks the admin to confirm with a passkey when their sign-in is older than 10 minutes', async () => {
  mockStore.auth.isSignInRecent = false;
  vi.mocked(startAuthentication).mockResolvedValue(createAuthenticationResponseMockModel());
  renderUsers(`${USER_ROUTES_PATHS.BASE}/${USER_ROUTES_PATHS.ADD}`);

  await createUser('rey', 'Member');
  await userEvent.click(await screen.findByRole('button', { name: 'Confirm with passkey' }));

  expect(await screen.findByLabelText('Temporary password')).toBeVisible();
  expect(startAuthentication).toHaveBeenCalledOnce();
});

it('says on the field when the username is taken', async () => {
  renderUsers(`${USER_ROUTES_PATHS.BASE}/${USER_ROUTES_PATHS.ADD}`);

  await createUser('LUKE', 'Member');

  expect(await screen.findByText('That username is taken. Pick another one.')).toBeVisible();
  expect(screen.getByLabelText('Username')).toHaveAccessibleDescription(/That username is taken\./);
});
