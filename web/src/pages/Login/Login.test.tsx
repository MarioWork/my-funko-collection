import { startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser';
import { renderRoutes, screen, userEvent } from '@test-utils';
import { AuthStateUtil } from '@app-types/utility';
import { AUTH_ROUTES_PATHS, FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import { createAuthenticationResponseMockModel } from '@mocks/handlers/auth/models/passkeyResponseMockModel.mock';
import { setMockAuthState } from '@mocks/mockStore';

vi.mock('@simplewebauthn/browser', () => ({
  browserSupportsWebAuthn: vi.fn(() => true),
  startAuthentication: vi.fn(),
  startRegistration: vi.fn(),
}));

const routes = [
  { path: AUTH_ROUTES_PATHS.LOGIN, lazy: () => import('./Login.route') },
  { path: FUNKO_ROUTES_PATHS.BASE, element: <h1>Funkos page</h1> },
];

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
