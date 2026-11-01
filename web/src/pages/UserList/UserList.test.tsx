import { startAuthentication } from '@simplewebauthn/browser';
import { renderRoutes, screen, userEvent, within } from '@test-utils';
import { UserRoleUtil } from '@app-types/utility';
import { userRoutes } from '@application/routes/featureRoutes/userRoutes';
import { USER_ROUTES_PATHS } from '@application/routes/routesUtils';
import RouteError from '@pages/Error/RouteError';
import { createAuthenticationResponseMockModel } from '@mocks/handlers/auth/models/passkeyResponseMockModel.mock';
import { MOCK_USER_ID } from '@mocks/mockAuth';
import { mockStore, setMockReadOnly, setMockUserRole } from '@mocks/mockStore';

vi.mock('@simplewebauthn/browser', () => ({
  browserSupportsWebAuthn: vi.fn(() => true),
  startAuthentication: vi.fn(),
  startRegistration: vi.fn(),
}));

// The page under the route error boundary, as in the app, so a member's refusal shows its page.
const routes = [{ errorElement: <RouteError />, children: userRoutes }];

const renderUsers = (path: string = USER_ROUTES_PATHS.BASE) => renderRoutes(routes, { initialEntries: [path] });

function rowOf(username: string): HTMLElement {
  const row = screen.getAllByRole('row').find((candidate) => within(candidate).queryByRole('cell', { name: username }));

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

it('lets an admin with a password create a user by confirming with it', async () => {
  const PASSWORD = 'the admin password here';
  Object.assign(mockStore.auth, { username: 'mario', password: PASSWORD, isSignInRecent: false });
  renderUsers(`${USER_ROUTES_PATHS.BASE}/${USER_ROUTES_PATHS.ADD}`);

  await createUser('rey', 'Member');
  await userEvent.type(await screen.findByLabelText('Your current password'), PASSWORD);
  await userEvent.keyboard('{Enter}');

  expect(await screen.findByLabelText('Temporary password')).toBeVisible();
  expect(startAuthentication).not.toHaveBeenCalled();
});

it('says on the field when the username is taken', async () => {
  renderUsers(`${USER_ROUTES_PATHS.BASE}/${USER_ROUTES_PATHS.ADD}`);

  await createUser('LUKE', 'Member');

  expect(await screen.findByText('That username is taken. Pick another one.')).toBeVisible();
  expect(screen.getByLabelText('Username')).toHaveAccessibleDescription(/That username is taken\./);
});

describe('managing a user', () => {
  const MARIO_ID = MOCK_USER_ID;
  const LEIA_ID = MOCK_USER_ID + 1;
  const LUKE_ID = MOCK_USER_ID + 2;
  const HAN_ID = MOCK_USER_ID + 3;

  const manageUser = (userId: number) => renderUsers(USER_ROUTES_PATHS.manage(String(userId)));

  const storedUser = (userId: number) => mockStore.users.find((user) => user.id === userId);

  async function confirmIn(dialogName: string, buttonName: string): Promise<void> {
    const dialog = await screen.findByRole('alertdialog', { name: dialogName });

    await userEvent.click(within(dialog).getByRole('button', { name: buttonName }));
  }

  it('opens from the user’s row', async () => {
    renderUsers();

    await userEvent.click(await screen.findByRole('link', { name: 'Manage luke' }));

    expect(await screen.findByRole('dialog', { name: 'Manage luke' })).toBeVisible();
  });

  it('makes a member an admin once confirmed', async () => {
    manageUser(LUKE_ID);

    await userEvent.click(await screen.findByRole('button', { name: 'Make admin' }));
    await confirmIn('Make luke an admin?', 'Make admin');

    const panel = await screen.findByRole('dialog', { name: 'Manage luke' });
    expect(await within(panel).findByRole('button', { name: 'Make member' })).toBeVisible();
    expect(storedUser(LUKE_ID)?.role).toBe(UserRoleUtil.ADMIN);
  });

  it('gives a user a new temporary password and shows it once', async () => {
    manageUser(HAN_ID);

    await userEvent.click(await screen.findByRole('button', { name: 'New temporary password' }));
    await confirmIn('Give han a new temporary password?', 'Make password');

    const password = await screen.findByLabelText('Temporary password');
    expect(password).toHaveValue(storedUser(HAN_ID)?.password);
    expect(password).toHaveAccessibleDescription(/Copy it now: it is not shown again\./);
  });

  it('asks for a username when the user has none, then gives them the temporary password', async () => {
    const leia = storedUser(LEIA_ID);
    if (leia) leia.username = null;
    manageUser(LEIA_ID);

    await userEvent.click(await screen.findByRole('button', { name: 'New temporary password' }));
    const dialog = await screen.findByRole('alertdialog', { name: 'Give leia a new temporary password?' });
    await userEvent.type(within(dialog).getByLabelText('Username'), 'Leia.Organa');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Make password' }));

    expect(await screen.findByLabelText('Temporary password')).toBeVisible();
    expect(storedUser(LEIA_ID)?.username).toBe('leia.organa');
  });

  it('deletes a user once confirmed and goes back to the list', async () => {
    manageUser(LUKE_ID);

    await userEvent.click(await screen.findByRole('button', { name: 'Delete user' }));
    await confirmIn('Delete luke?', 'Delete user');

    expect(await screen.findByText('3 users')).toBeVisible();
    expect(screen.queryByRole('cell', { name: 'luke' })).not.toBeInTheDocument();
  });

  it('asks the admin to confirm with a passkey when their sign-in is older than 10 minutes', async () => {
    mockStore.auth.isSignInRecent = false;
    vi.mocked(startAuthentication).mockResolvedValue(createAuthenticationResponseMockModel());
    manageUser(LUKE_ID);

    await userEvent.click(await screen.findByRole('button', { name: 'Delete user' }));
    await confirmIn('Delete luke?', 'Delete user');
    await confirmIn("Confirm it's you", 'Confirm with passkey');

    expect(await screen.findByText('3 users')).toBeVisible();
    expect(startAuthentication).toHaveBeenCalledOnce();
  });

  it('lets an admin with a password confirm with it instead of a passkey', async () => {
    const PASSWORD = 'the admin password here';
    Object.assign(mockStore.auth, { username: 'mario', password: PASSWORD, isSignInRecent: false });
    manageUser(LUKE_ID);

    await userEvent.click(await screen.findByRole('button', { name: 'Delete user' }));
    await confirmIn('Delete luke?', 'Delete user');
    const dialog = await screen.findByRole('alertdialog', { name: "Confirm it's you" });
    await userEvent.type(within(dialog).getByLabelText('Your current password'), PASSWORD);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirm with password' }));

    expect(await screen.findByText('3 users')).toBeVisible();
    expect(startAuthentication).not.toHaveBeenCalled();
  });

  it('keeps the last admin: making them a member and deleting them are disabled, with the reason', async () => {
    const leia = storedUser(LEIA_ID);
    if (leia) leia.role = UserRoleUtil.MEMBER;
    manageUser(MARIO_ID);

    const makeMember = await screen.findByRole('button', { name: 'Make member' });
    const deleteUser = screen.getByRole('button', { name: 'Delete user' });

    expect(makeMember).toHaveAttribute('aria-disabled', 'true');
    expect(makeMember).toHaveAccessibleDescription(/always be at least one admin/);
    expect(deleteUser).toHaveAttribute('aria-disabled', 'true');
    expect(deleteUser).toHaveAccessibleDescription(/always be at least one admin/);
  });

  it('makes a user read-only once confirmed, says so in their row, and lets them make changes again', async () => {
    manageUser(LUKE_ID);

    await userEvent.click(await screen.findByRole('button', { name: 'Make read-only' }));
    await confirmIn('Make luke read-only?', 'Make read-only');

    const panel = await screen.findByRole('dialog', { name: 'Manage luke' });
    expect(await within(panel).findByText('Member, read-only')).toBeVisible();
    expect(storedUser(LUKE_ID)?.isReadOnly).toBe(true);

    await userEvent.click(within(panel).getByRole('button', { name: 'Allow changes' }));
    await confirmIn('Let luke make changes again?', 'Allow changes');

    expect(await within(panel).findByRole('button', { name: 'Make read-only' })).toBeVisible();
    expect(storedUser(LUKE_ID)?.isReadOnly).toBe(false);
  });

  it('keeps the last admin who can make changes: making them read-only is disabled, with the reason', async () => {
    const leia = storedUser(LEIA_ID);
    if (leia) leia.isReadOnly = true;
    manageUser(MARIO_ID);

    const makeReadOnly = await screen.findByRole('button', { name: 'Make read-only' });

    expect(makeReadOnly).toHaveAttribute('aria-disabled', 'true');
    expect(makeReadOnly).toHaveAccessibleDescription(/always be at least one admin who can make changes/);
  });

  it('shows every change disabled, saying the account is read-only, when the admin is read-only', async () => {
    setMockReadOnly();
    manageUser(LUKE_ID);

    const panel = await screen.findByRole('dialog', { name: 'Manage luke' });
    const buttons = ['Make admin', 'Make read-only', 'New temporary password', 'Delete user'].map((name) =>
      within(panel).getByRole('button', { name }),
    );

    for (const button of buttons) {
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveAccessibleDescription(/Your account is read-only/);
    }
  });
});

it('shows New user disabled, saying why, when the admin is read-only', async () => {
  setMockReadOnly();
  renderUsers();

  const newUser = await screen.findByRole('button', { name: 'New user' });

  expect(newUser).toHaveAttribute('aria-disabled', 'true');
  expect(newUser).toHaveAccessibleDescription(/Your account is read-only/);
  expect(screen.queryByRole('link', { name: 'New user' })).not.toBeInTheDocument();
});

it('says the account is read-only when a read-only admin opens the New user address', async () => {
  setMockReadOnly();

  renderUsers(`${USER_ROUTES_PATHS.BASE}/${USER_ROUTES_PATHS.ADD}`);

  expect(await screen.findByRole('heading', { level: 1, name: 'Your account is read-only' })).toBeVisible();
});
