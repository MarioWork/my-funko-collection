import type { createMemoryRouter } from 'react-router';
import { act, renderRoutes, screen, userEvent, waitFor, within } from '@test-utils';
import { AuthStateUtil, UserStateUtil } from '@app-types/utility';
import routes from '@application/routes';
import { AUTH_ROUTES_PATHS, BASE_ROUTES_PATHS, COLLECTION_ROUTES_PATHS } from '@application/routes/routesUtils';
import { mockStore, setMockAuthState, setMockMustChangePassword } from '@mocks/mockStore';
import { MOCK_TEMPORARY_PASSWORD } from '@mocks/mockUsers';

type MemoryRouter = ReturnType<typeof createMemoryRouter>;

const NEW_PASSWORD = 'a shelf of tiny vinyl heads';
const HOME_HEADING = { level: 1, name: 'Home' } as const;
const SET_PASSWORD_HEADING = { level: 1, name: 'Choose your password' } as const;

// The whole route table, so the shell's gate and the root middleware send the user here as in the app.
function renderApp(initialEntry: string): MemoryRouter {
  const { router } = renderRoutes(routes, { initialEntries: [initialEntry] });

  return router;
}

// Signed in as "luke" with the temporary password an admin made.
function signInWithTemporaryPassword(): void {
  setMockMustChangePassword();
  Object.assign(mockStore.auth, {
    userName: 'luke',
    username: 'luke',
    password: MOCK_TEMPORARY_PASSWORD,
    passkeys: [],
  });
}

async function saveNewPassword(password: string): Promise<void> {
  const form = await screen.findByRole('form', { name: 'Choose your password' });

  await userEvent.type(within(form).getByLabelText('New password'), password);
  await userEvent.click(screen.getByRole('button', { name: 'Save and open my collection' }));
}

it('sends a user signed in with a temporary password to choose their own, wherever they were going', async () => {
  signInWithTemporaryPassword();

  const router = renderApp(COLLECTION_ROUTES_PATHS.BASE);

  expect(await screen.findByRole('heading', SET_PASSWORD_HEADING)).toBeVisible();
  expect(router.state.location.pathname).toBe(AUTH_ROUTES_PATHS.SET_PASSWORD);
  expect(screen.getByLabelText('Username')).toHaveValue('luke');
});

it('opens the app once the new password is saved', async () => {
  signInWithTemporaryPassword();
  const router = renderApp(BASE_ROUTES_PATHS.HOME);

  await saveNewPassword(NEW_PASSWORD);

  expect(await screen.findByRole('heading', HOME_HEADING)).toBeVisible();
  expect(router.state.location.pathname).toBe(BASE_ROUTES_PATHS.HOME);
  expect(mockStore.auth).toMatchObject({ mustChangePassword: false, password: NEW_PASSWORD });
});

it('says on the field when the new password is the temporary one', async () => {
  signInWithTemporaryPassword();
  renderApp(AUTH_ROUTES_PATHS.SET_PASSWORD);

  await saveNewPassword(MOCK_TEMPORARY_PASSWORD);

  expect(await screen.findByText('Pick a new password, not the temporary one.')).toBeVisible();
  expect(screen.getByLabelText('New password')).toHaveAccessibleDescription(/not the temporary one/);
});

describe('when the sign-in is more than 10 minutes old', () => {
  async function confirmWithTemporaryPassword(password: string): Promise<void> {
    await userEvent.type(await screen.findByLabelText('Your current password'), password);
    await userEvent.click(screen.getByRole('button', { name: 'Confirm with password' }));
  }

  beforeEach(() => {
    signInWithTemporaryPassword();
    mockStore.auth.isSignInRecent = false;
  });

  it('confirms with the temporary password right here, then saves and opens the app', async () => {
    renderApp(AUTH_ROUTES_PATHS.SET_PASSWORD);

    await saveNewPassword(NEW_PASSWORD);
    expect(await screen.findByText(/Type your temporary password to confirm it’s you/)).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Confirm with passkey' })).not.toBeInTheDocument();
    await confirmWithTemporaryPassword(MOCK_TEMPORARY_PASSWORD);

    expect(await screen.findByRole('heading', HOME_HEADING)).toBeVisible();
    expect(mockStore.auth).toMatchObject({ mustChangePassword: false, password: NEW_PASSWORD });
  });

  it('says on the field when the temporary password typed to confirm is wrong', async () => {
    renderApp(AUTH_ROUTES_PATHS.SET_PASSWORD);

    await saveNewPassword(NEW_PASSWORD);
    await confirmWithTemporaryPassword('not the temporary one');

    const field = screen.getByLabelText('Your current password');
    await waitFor(() => expect(field).toHaveAttribute('aria-invalid', 'true'));
    expect(field).toHaveAccessibleDescription("That password doesn't match. Try again.");
    expect(mockStore.auth.password).toBe(MOCK_TEMPORARY_PASSWORD);
  });

  it('says to ask an admin for a new one when the temporary password has expired', async () => {
    const luke = mockStore.users.find((user) => user.username === 'luke');
    if (luke) luke.state = UserStateUtil.TEMPORARY_PASSWORD_EXPIRED;
    renderApp(AUTH_ROUTES_PATHS.SET_PASSWORD);

    await saveNewPassword(NEW_PASSWORD);
    await confirmWithTemporaryPassword(MOCK_TEMPORARY_PASSWORD);

    expect(await screen.findByText(/Your temporary password has expired/)).toBeVisible();
    expect(mockStore.auth.password).toBe(MOCK_TEMPORARY_PASSWORD);
  });
});

it('signs out to the login page when the user leaves without choosing', async () => {
  signInWithTemporaryPassword();
  renderApp(AUTH_ROUTES_PATHS.SET_PASSWORD);

  await userEvent.click(await screen.findByRole('button', { name: 'Sign out' }));

  expect(await screen.findByRole('heading', { level: 1, name: 'Welcome back!' })).toBeVisible();
  expect(mockStore.auth.state).toBe(AuthStateUtil.SIGNED_OUT);
});

it('sends a user who already has their own password on to the app', async () => {
  const router = renderApp(AUTH_ROUTES_PATHS.SET_PASSWORD);

  await waitFor(() => expect(router.state.location.pathname).toBe(BASE_ROUTES_PATHS.HOME));
  expect(await screen.findByRole('heading', HOME_HEADING)).toBeVisible();
});

it('lands on "choose your password" after signing in with a temporary password an admin made', async () => {
  setMockAuthState(AuthStateUtil.SIGNED_OUT);
  const router = renderApp(AUTH_ROUTES_PATHS.LOGIN);
  const form = await screen.findByRole('form', { name: 'Sign in with a password' });

  await userEvent.type(within(form).getByLabelText('Username'), 'luke');
  await userEvent.type(within(form).getByLabelText('Password'), MOCK_TEMPORARY_PASSWORD);
  await userEvent.click(within(form).getByRole('button', { name: 'Sign in with password' }));

  expect(await screen.findByRole('heading', SET_PASSWORD_HEADING)).toBeVisible();
  expect(router.state.location.pathname).toBe(AUTH_ROUTES_PATHS.SET_PASSWORD);
});

it('sends the user back to choose a password when the API refuses a later page for it', async () => {
  const router = renderApp(BASE_ROUTES_PATHS.HOME);
  expect(await screen.findByRole('heading', HOME_HEADING)).toBeVisible();

  // An admin gave this user a temporary password while the app was open: the next read answers 403.
  signInWithTemporaryPassword();
  await act(() => router.navigate(COLLECTION_ROUTES_PATHS.BASE));

  expect(await screen.findByRole('heading', SET_PASSWORD_HEADING)).toBeVisible();
});
