import { browserSupportsWebAuthn, startRegistration } from '@simplewebauthn/browser';
import { renderRoutes, screen, userEvent } from '@test-utils';
import { AuthStateUtil } from '@app-types/utility';
import { AUTH_ROUTES_PATHS, BASE_ROUTES_PATHS } from '@application/routes/routesUtils';
import { createRegistrationResponseMockModel } from '@mocks/handlers/auth/models/passkeyResponseMockModel.mock';
import { MOCK_SETUP_CODE, mockStore, setMockAuthState } from '@mocks/mockStore';

vi.mock('@simplewebauthn/browser', () => ({
  browserSupportsWebAuthn: vi.fn(() => true),
  startAuthentication: vi.fn(),
  startRegistration: vi.fn(),
}));

const routes = [
  { path: AUTH_ROUTES_PATHS.SETUP, lazy: () => import('./Setup.route') },
  { path: BASE_ROUTES_PATHS.HOME, element: <h1>Home page</h1> },
];

const renderSetup = (search = `?code=${MOCK_SETUP_CODE}`) =>
  renderRoutes(routes, { initialEntries: [`${AUTH_ROUTES_PATHS.SETUP}${search}`] });

beforeEach(() => {
  setMockAuthState(AuthStateUtil.SETUP);
  vi.mocked(browserSupportsWebAuthn).mockReturnValue(true);
  vi.mocked(startRegistration).mockResolvedValue(createRegistrationResponseMockModel());
});

it('creates the first passkey with the code from the link and opens the app', async () => {
  renderSetup();

  await userEvent.type(await screen.findByLabelText('What should we call you?'), 'Mario');
  await userEvent.type(screen.getByLabelText('Passkey name (optional)'), 'iPhone');
  expect(screen.queryByLabelText('Setup code')).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Create my passkey' }));

  expect(await screen.findByRole('heading', { name: 'Home page' })).toBeVisible();
  expect(mockStore.auth).toMatchObject({ state: AuthStateUtil.SIGNED_IN, userName: 'Mario' });
  expect(mockStore.auth.passkeys).toEqual([expect.objectContaining({ name: 'iPhone' })]);
});

it('asks for the name before anything else', async () => {
  renderSetup();

  await userEvent.click(await screen.findByRole('button', { name: 'Create my passkey' }));

  expect(await screen.findByLabelText('What should we call you?')).toHaveAccessibleDescription(
    'Tell us what to call you',
  );
  expect(startRegistration).not.toHaveBeenCalled();
});

it('asks for the code when the link has none, pointing at the server log', async () => {
  renderSetup('');

  const codeField = await screen.findByLabelText('Setup code');

  expect(codeField).toHaveAccessibleDescription(/docker compose logs api/);
});

it('explains a wrong code and lets the user paste the right one', async () => {
  renderSetup('?code=old-code');

  await userEvent.type(await screen.findByLabelText('What should we call you?'), 'Mario');
  await userEvent.click(screen.getByRole('button', { name: 'Create my passkey' }));

  expect(await screen.findByRole('alert')).toHaveTextContent(/wrong or was already used/);

  const codeField = screen.getByLabelText('Setup code');

  await userEvent.clear(codeField);
  await userEvent.type(codeField, MOCK_SETUP_CODE);
  await userEvent.click(screen.getByRole('button', { name: 'Create my passkey' }));

  expect(await screen.findByRole('heading', { name: 'Home page' })).toBeVisible();
});

it('says so kindly when the passkey prompt is closed', async () => {
  vi.mocked(startRegistration).mockRejectedValue(Object.assign(new Error('closed'), { name: 'NotAllowedError' }));
  renderSetup();

  await userEvent.type(await screen.findByLabelText('What should we call you?'), 'Mario');
  await userEvent.click(screen.getByRole('button', { name: 'Create my passkey' }));

  expect(await screen.findByRole('alert')).toHaveTextContent(/the passkey prompt was closed/);
});
