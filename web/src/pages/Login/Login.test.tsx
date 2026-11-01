import { startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser';
import { renderRoutes, screen, userEvent, within } from '@test-utils';
import { AuthStateUtil, UserRoleUtil } from '@app-types/utility';
import { AUTH_ROUTES_PATHS, FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import { createAuthenticationResponseMockModel } from '@mocks/handlers/auth/models/passkeyResponseMockModel.mock';
import { mockStore, setMockAuthState } from '@mocks/mockStore';

vi.mock('@simplewebauthn/browser', () => ({
  browserSupportsWebAuthn: vi.fn(() => true),
  startAuthentication: vi.fn(),
  startRegistration: vi.fn(),
}));

const routes = [
  { path: AUTH_ROUTES_PATHS.LOGIN, lazy: () => import('./Login.route') },
  { path: FUNKO_ROUTES_PATHS.BASE, element: <h1>Funkos page</h1> },
];

const USERNAME = 'mario';
const PASSWORD = 'shelves full of tiny heads';

const renderLogin = () => renderRoutes(routes, { initialEntries: [`${AUTH_ROUTES_PATHS.LOGIN}?redirectTo=%2Ffunkos`] });

beforeEach(() => {
  setMockAuthState(AuthStateUtil.SIGNED_OUT);
  vi.mocked(browserSupportsWebAuthn).mockReturnValue(true);
});

it('signs in with a passkey and goes back to the page in redirectTo', async () => {
  vi.mocked(startAuthentication).mockResolvedValue(createAuthenticationResponseMockModel());
  renderLogin();

  await userEvent.click(await screen.findByRole('button', { name: 'Sign in with passkey' }));

  expect(await screen.findByRole('heading', { name: 'Funkos page' })).toBeVisible();
  expect(vi.mocked(startAuthentication).mock.lastCall?.[0].optionsJSON).toMatchObject({ rpId: 'localhost' });
});

it('says so kindly when the passkey prompt is closed, and stays on the page', async () => {
  vi.mocked(startAuthentication).mockRejectedValue(Object.assign(new Error('closed'), { name: 'NotAllowedError' }));
  renderLogin();

  await userEvent.click(await screen.findByRole('button', { name: 'Sign in with passkey' }));

  expect(await screen.findByRole('alert')).toHaveTextContent(/the passkey prompt was closed/);
  expect(screen.getByRole('heading', { level: 1, name: 'Welcome back!' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Sign in with passkey' })).toBeEnabled();
});

it('keeps the button disabled, saying why, when the browser has no passkeys', async () => {
  vi.mocked(browserSupportsWebAuthn).mockReturnValue(false);
  renderLogin();

  const button = await screen.findByRole('button', { name: 'Sign in with passkey' });

  expect(button).toHaveAttribute('aria-disabled', 'true');
  expect(button).toHaveAccessibleDescription("This browser can't use passkeys.");
  expect(screen.getByRole('status')).toHaveTextContent(/Try the latest Safari, Chrome, Edge or Firefox/);
});

describe('with a password', () => {
  beforeEach(() => {
    Object.assign(mockStore.auth, { username: USERNAME, password: PASSWORD });
  });

  it('signs in with the username and password and goes back to the page in redirectTo', async () => {
    renderLogin();
    const form = await screen.findByRole('form', { name: 'Sign in with a password' });

    await userEvent.type(within(form).getByLabelText('Username'), 'Mario');
    await userEvent.type(within(form).getByLabelText('Password'), PASSWORD);
    await userEvent.click(within(form).getByRole('button', { name: 'Sign in with password' }));

    expect(await screen.findByRole('heading', { name: 'Funkos page' })).toBeVisible();
    expect(startAuthentication).not.toHaveBeenCalled();
  });

  it('lets a password manager fill the fields and paste work', async () => {
    renderLogin();
    const form = await screen.findByRole('form', { name: 'Sign in with a password' });
    const password = within(form).getByLabelText('Password');

    await userEvent.click(password);
    await userEvent.paste(PASSWORD);

    expect(within(form).getByLabelText('Username')).toHaveAttribute('autocomplete', 'username');
    expect(password).toHaveAttribute('autocomplete', 'current-password');
    expect(password).toHaveAttribute('type', 'password');
    expect(password).toHaveValue(PASSWORD);
  });

  it('says the username and password do not match, and stays on the page', async () => {
    renderLogin();
    const form = await screen.findByRole('form', { name: 'Sign in with a password' });

    await userEvent.type(within(form).getByLabelText('Username'), USERNAME);
    await userEvent.type(within(form).getByLabelText('Password'), 'not the password at all');
    await userEvent.click(within(form).getByRole('button', { name: 'Sign in with password' }));

    expect(await within(form).findByRole('alert')).toHaveTextContent("That username and password don't match.");
    expect(screen.getByRole('heading', { level: 1, name: 'Welcome back!' })).toBeVisible();
  });

  it('asks for both fields before sending anything', async () => {
    renderLogin();
    const form = await screen.findByRole('form', { name: 'Sign in with a password' });

    await userEvent.click(within(form).getByRole('button', { name: 'Sign in with password' }));

    expect(await within(form).findByText('Type your username')).toBeVisible();
    expect(within(form).getByLabelText('Password')).toHaveAccessibleDescription('Type your password');
  });
});

describe('in development', () => {
  it('says plainly that it is in development mode, and with which data', async () => {
    renderLogin();

    const banner = await screen.findByRole('note', { name: 'Development mode' });

    expect(banner).toHaveTextContent(/mock data|real local API/);
  });

  it('signs in as the picked seeded user through the password form', async () => {
    renderLogin();
    const form = await screen.findByRole('form', { name: 'Sign in with a password' });

    await userEvent.selectOptions(within(form).getByLabelText('Sign in as…'), 'rey - Member');

    expect(await screen.findByRole('heading', { name: 'Funkos page' })).toBeVisible();
    expect(mockStore.auth).toMatchObject({ username: 'rey', role: UserRoleUtil.MEMBER, isReadOnly: false });
  });
});
