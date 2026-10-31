import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { renderRoutes, screen, userEvent, waitFor, within } from '@test-utils';
import { AuthStateUtil } from '@app-types/utility';
import { securityRoutes } from '@application/routes/featureRoutes/authRoutes';
import { APP_SHELL_ROUTE_ID, AUTH_ROUTES_PATHS, BASE_ROUTES_PATHS } from '@application/routes/routesUtils';
import {
  createAuthenticationResponseMockModel,
  createRegistrationResponseMockModel,
} from '@mocks/handlers/auth/models/passkeyResponseMockModel.mock';
import { mockStore } from '@mocks/mockStore';

vi.mock('@simplewebauthn/browser', () => ({
  browserSupportsWebAuthn: vi.fn(() => true),
  startAuthentication: vi.fn(),
  startRegistration: vi.fn(),
}));

// Settings and the security actions under a stand-in for the app shell, which holds the signed-in user.
const routes = [
  {
    id: APP_SHELL_ROUTE_ID,
    loader: () => ({ user: { name: 'Mario', username: mockStore.auth.username } }),
    children: [{ path: BASE_ROUTES_PATHS.SETTINGS, lazy: () => import('../../Settings.route') }, ...securityRoutes],
  },
  { path: AUTH_ROUTES_PATHS.LOGIN, element: <h1>Login page</h1> },
];

const renderSettings = () => renderRoutes(routes, { initialEntries: [BASE_ROUTES_PATHS.SETTINGS] });

const passkeyList = async () => screen.findByRole('list', { name: 'Passkeys' });

// While a dialog is open the page behind it is hidden from assistive tech, so wait for it to close first.
async function passkeyNamesAfterDialog(): Promise<string[]> {
  await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());

  const items = within(await passkeyList()).getAllByRole('listitem');

  return items.map(
    (item) =>
      within(item)
        .getByRole('button', { name: /^Remove / })
        .getAttribute('aria-label') ?? '',
  );
}

it('shows who is signed in and every passkey, saying in words which are synced', async () => {
  renderSettings();

  const list = await passkeyList();

  expect(screen.getByText('Mario')).toBeVisible();
  expect(within(list).getAllByRole('listitem')).toHaveLength(2);
  expect(within(list).getByText('Synced')).toBeVisible();
  expect(within(list).getByText('One device only')).toBeVisible();
  expect(within(list).getByText(/Never used/)).toBeVisible();
});

it('keeps the only passkey, with the reason on its Remove button', async () => {
  mockStore.auth.passkeys.splice(1);
  renderSettings();

  const remove = await screen.findByRole('button', { name: 'Remove iPhone' });

  expect(remove).toHaveAttribute('aria-disabled', 'true');
  expect(remove).toHaveAccessibleDescription('You need at least one passkey.');
});

it('removes a passkey after confirming', async () => {
  renderSettings();

  await userEvent.click(await screen.findByRole('button', { name: 'Remove YubiKey' }));
  const dialog = await screen.findByRole('alertdialog', { name: 'Remove “YubiKey”?' });
  await userEvent.click(within(dialog).getByRole('button', { name: 'Remove passkey' }));

  expect(await passkeyNamesAfterDialog()).toEqual(['Remove iPhone']);
  expect(startAuthentication).not.toHaveBeenCalled();
});

it('asks the user to confirm it is them when the sign-in is old, then removes the passkey', async () => {
  mockStore.auth.isSignInRecent = false;
  vi.mocked(startAuthentication).mockResolvedValue(createAuthenticationResponseMockModel());
  renderSettings();

  await userEvent.click(await screen.findByRole('button', { name: 'Remove YubiKey' }));
  await userEvent.click(await screen.findByRole('button', { name: 'Remove passkey' }));

  const confirm = await screen.findByRole('alertdialog', { name: "Confirm it's you" });

  expect(within(confirm).queryByRole('alert')).not.toBeInTheDocument();
  await userEvent.click(within(confirm).getByRole('button', { name: 'Confirm with passkey' }));

  expect(await passkeyNamesAfterDialog()).toEqual(['Remove iPhone']);
  expect(startAuthentication).toHaveBeenCalledTimes(1);
});

it('adds a passkey with the name given', async () => {
  vi.mocked(startRegistration).mockResolvedValue(createRegistrationResponseMockModel());
  renderSettings();

  await userEvent.click(await screen.findByRole('button', { name: 'Add a passkey' }));
  const dialog = await screen.findByRole('dialog', { name: 'Add a passkey' });
  await userEvent.type(within(dialog).getByLabelText('Name'), 'Laptop');
  await userEvent.click(within(dialog).getByRole('button', { name: 'Create passkey' }));

  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Add a passkey' })).not.toBeInTheDocument());
  expect(await within(await passkeyList()).findByText('Laptop')).toBeVisible();
});

it('confirms it is them before adding a passkey when the sign-in is old', async () => {
  mockStore.auth.isSignInRecent = false;
  vi.mocked(startAuthentication).mockResolvedValue(createAuthenticationResponseMockModel());
  vi.mocked(startRegistration).mockResolvedValue(createRegistrationResponseMockModel());
  renderSettings();

  await userEvent.click(await screen.findByRole('button', { name: 'Add a passkey' }));
  const dialog = await screen.findByRole('dialog', { name: 'Add a passkey' });
  await userEvent.type(within(dialog).getByLabelText('Name'), 'Laptop');
  await userEvent.click(within(dialog).getByRole('button', { name: 'Create passkey' }));

  await userEvent.click(await within(dialog).findByRole('button', { name: 'Confirm with passkey' }));

  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Add a passkey' })).not.toBeInTheDocument());
  expect(await within(await passkeyList()).findByText('Laptop')).toBeVisible();
  expect(startAuthentication).toHaveBeenCalledTimes(1);
});

describe('password', () => {
  const PASSWORD = 'shelves full of tiny heads';

  async function openPasswordDialog(buttonName: string) {
    await userEvent.click(await screen.findByRole('button', { name: buttonName }));

    return screen.findByRole('dialog');
  }

  it('sets a username and password when there is none yet', async () => {
    renderSettings();

    expect(await screen.findByText(/No password yet/)).toBeVisible();
    const dialog = await openPasswordDialog('Set a password');
    await userEvent.type(within(dialog).getByLabelText('Username'), 'Mario');
    await userEvent.type(within(dialog).getByLabelText('New password'), PASSWORD);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save password' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(mockStore.auth).toMatchObject({ username: 'mario', password: PASSWORD });
    expect(await screen.findByRole('button', { name: 'Change password' })).toBeVisible();
  });

  it('marks the new password field for password managers', async () => {
    renderSettings();

    const dialog = await openPasswordDialog('Set a password');

    expect(within(dialog).getByLabelText('New password')).toHaveAttribute('autocomplete', 'new-password');
    expect(within(dialog).getByLabelText('Username')).toHaveAttribute('autocomplete', 'username');
  });

  it('refuses a password under 15 characters on its field, without sending it', async () => {
    renderSettings();

    const dialog = await openPasswordDialog('Set a password');
    await userEvent.type(within(dialog).getByLabelText('Username'), 'mario');
    await userEvent.type(within(dialog).getByLabelText('New password'), 'too short');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save password' }));

    const field = within(dialog).getByLabelText('New password');
    await waitFor(() => expect(field).toHaveAttribute('aria-invalid', 'true'));
    expect(field).toHaveAccessibleDescription(expect.stringContaining('Use at least 15 characters'));
    expect(mockStore.auth.password).toBeNull();
  });

  it('shows the refusal of a common password on its field', async () => {
    renderSettings();

    const dialog = await openPasswordDialog('Set a password');
    await userEvent.type(within(dialog).getByLabelText('Username'), 'mario');
    await userEvent.type(within(dialog).getByLabelText('New password'), 'Password12345678');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save password' }));

    const field = within(dialog).getByLabelText('New password');
    await waitFor(() => expect(field).toHaveAttribute('aria-invalid', 'true'));
    expect(field).toHaveAccessibleDescription(expect.stringContaining('That password is too common'));
    // Only the field's own error: no second copy in the dialog's alert.
    expect(within(dialog).getAllByText(/That password is too common/)).toHaveLength(1);
  });

  it('confirms it is them with a passkey first when the sign-in is old, then saves the password', async () => {
    mockStore.auth.isSignInRecent = false;
    Object.assign(mockStore.auth, { username: 'mario', password: 'the old password here' });
    vi.mocked(startAuthentication).mockResolvedValue(createAuthenticationResponseMockModel());
    renderSettings();

    const dialog = await openPasswordDialog('Change password');
    expect(within(dialog).getByLabelText('Username')).toHaveValue('mario');
    await userEvent.type(within(dialog).getByLabelText('New password'), PASSWORD);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save password' }));
    await userEvent.click(await within(dialog).findByRole('button', { name: 'Confirm with passkey' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(mockStore.auth.password).toBe(PASSWORD);
    expect(startAuthentication).toHaveBeenCalledTimes(1);
  });
});

it('signs out to the login page', async () => {
  renderSettings();

  await userEvent.click(await screen.findByRole('button', { name: 'Sign out' }));

  expect(await screen.findByRole('heading', { name: 'Login page' })).toBeVisible();
  expect(mockStore.auth.state).toBe(AuthStateUtil.SIGNED_OUT);
});

it('signs out everywhere after confirming', async () => {
  renderSettings();

  await userEvent.click(await screen.findByRole('button', { name: 'Sign out everywhere' }));
  const dialog = await screen.findByRole('alertdialog', { name: 'Sign out everywhere?' });
  await userEvent.click(within(dialog).getByRole('button', { name: 'Sign out everywhere' }));

  expect(await screen.findByRole('heading', { name: 'Login page' })).toBeVisible();
});
