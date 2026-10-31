import { http, HttpResponse } from 'msw/http';
import { AuthStateUtil, UserRoleUtil } from '@app-types/utility';
import {
  createAuthenticationResponseMockModel,
  createRegistrationResponseMockModel,
} from '@mocks/handlers/auth/models/passkeyResponseMockModel.mock';
import { MOCK_SETUP_CODE } from '@mocks/mockAuth';
import { mockStore, setMockAuthState } from '@mocks/mockStore';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import { UNAUTHORIZED_ERROR_CODE } from '@api/axiosActions';
import authService, { AuthApiErrorCodes } from './authService';

describe('getStatus', () => {
  it('returns the signed-in user', async () => {
    expect(await authService.getStatus()).toEqual({
      state: AuthStateUtil.SIGNED_IN,
      user: { name: 'Mario', username: null, role: UserRoleUtil.ADMIN, mustChangePassword: false },
    });
  });

  it('returns only the state when nobody is signed in', async () => {
    setMockAuthState(AuthStateUtil.SIGNED_OUT);

    expect(await authService.getStatus()).toEqual({ state: AuthStateUtil.SIGNED_OUT });
  });
});

describe('startSetup', () => {
  it('posts the code and the name and returns the registration options', async () => {
    setMockAuthState(AuthStateUtil.SETUP);
    let receivedBody: unknown;
    server.use(
      http.post(`${TEST_BASE_API_URL}/auth/setup/options`, async ({ request }) => {
        receivedBody = await request.clone().json();
      }),
    );

    const result = await authService.startSetup({ code: MOCK_SETUP_CODE, name: 'Mario' });

    expect(receivedBody).toEqual({ code: MOCK_SETUP_CODE, name: 'Mario' });
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ rp: { id: 'localhost' }, user: { name: 'Mario' } });
  });

  it('returns the 401 envelope for a wrong code', async () => {
    setMockAuthState(AuthStateUtil.SETUP);

    const result = await authService.startSetup({ code: 'nope', name: 'Mario' });

    expect(result).toMatchObject({
      success: false,
      error: { statusCode: 401, code: AuthApiErrorCodes.INVALID_SETUP_CODE },
    });
  });
});

describe('finishSetup', () => {
  it('signs the new user in with their first passkey', async () => {
    setMockAuthState(AuthStateUtil.SETUP);

    const result = await authService.finishSetup({
      code: MOCK_SETUP_CODE,
      name: 'Ana',
      response: createRegistrationResponseMockModel(),
      passkeyName: 'Pixel',
    });

    expect(result).toEqual({
      success: true,
      data: { user: { name: 'Ana', username: null, role: UserRoleUtil.ADMIN, mustChangePassword: false } },
    });
    expect(await authService.getStatus()).toEqual({
      state: AuthStateUtil.SIGNED_IN,
      user: { name: 'Ana', username: null, role: UserRoleUtil.ADMIN, mustChangePassword: false },
    });
  });

  it('returns the 401 envelope for a wrong code', async () => {
    setMockAuthState(AuthStateUtil.SETUP);

    const result = await authService.finishSetup({
      code: 'nope',
      name: 'Ana',
      response: createRegistrationResponseMockModel(),
      passkeyName: 'Pixel',
    });

    expect(result).toMatchObject({
      success: false,
      error: { statusCode: 401, code: AuthApiErrorCodes.INVALID_SETUP_CODE },
    });
  });
});

describe('startLogin', () => {
  it('returns discoverable-credential options for this host', async () => {
    const result = await authService.startLogin();

    expect(result.data).toMatchObject({ rpId: 'localhost', allowCredentials: [] });
  });

  it('returns the 409 envelope before the first run', async () => {
    setMockAuthState(AuthStateUtil.SETUP);

    expect(await authService.startLogin()).toMatchObject({
      success: false,
      error: { statusCode: 409, code: AuthApiErrorCodes.NOT_SET_UP },
    });
  });
});

describe('finishLogin', () => {
  it('posts the browser response and signs in', async () => {
    setMockAuthState(AuthStateUtil.SIGNED_OUT);

    const result = await authService.finishLogin({ response: createAuthenticationResponseMockModel() });

    expect(result).toEqual({
      success: true,
      data: { user: { name: 'Mario', username: null, role: UserRoleUtil.ADMIN, mustChangePassword: false } },
    });
    expect(mockStore.auth.state).toBe(AuthStateUtil.SIGNED_IN);
  });

  it('returns the 401 envelope when the passkey is not accepted', async () => {
    setMockAuthState(AuthStateUtil.SETUP);

    const result = await authService.finishLogin({ response: createAuthenticationResponseMockModel() });

    expect(result).toMatchObject({
      success: false,
      error: { statusCode: 401, code: AuthApiErrorCodes.SIGN_IN_FAILED },
    });
  });
});

describe('signInWithPassword', () => {
  it('posts the username and password and signs in', async () => {
    setMockAuthState(AuthStateUtil.SIGNED_OUT);
    Object.assign(mockStore.auth, { username: 'mario', password: 'shelves full of tiny heads' });
    let receivedBody: unknown;
    server.use(
      http.post(`${TEST_BASE_API_URL}/auth/login/password`, async ({ request }) => {
        receivedBody = await request.clone().json();
      }),
    );

    const result = await authService.signInWithPassword({ username: 'Mario', password: 'shelves full of tiny heads' });

    expect(receivedBody).toEqual({ username: 'Mario', password: 'shelves full of tiny heads' });
    expect(result).toEqual({
      success: true,
      data: { user: { name: 'Mario', username: 'mario', role: UserRoleUtil.ADMIN, mustChangePassword: false } },
    });
  });

  it('returns the 401 envelope when the password is wrong', async () => {
    setMockAuthState(AuthStateUtil.SIGNED_OUT);
    Object.assign(mockStore.auth, { username: 'mario', password: 'shelves full of tiny heads' });

    const result = await authService.signInWithPassword({ username: 'mario', password: 'not the password at all' });

    expect(result).toMatchObject({
      success: false,
      error: { statusCode: 401, code: AuthApiErrorCodes.SIGN_IN_FAILED },
    });
  });
});

describe('setPassword', () => {
  it('puts the username and password', async () => {
    let receivedBody: unknown;
    server.use(
      http.put(`${TEST_BASE_API_URL}/auth/password`, async ({ request }) => {
        receivedBody = await request.clone().json();
      }),
    );

    const result = await authService.setPassword({ username: 'mario', password: 'shelves full of tiny heads' });

    expect(receivedBody).toEqual({ username: 'mario', password: 'shelves full of tiny heads' });
    expect(result.success).toBe(true);
  });

  it('returns the 400 envelope when the password is too common', async () => {
    const result = await authService.setPassword({ username: 'mario', password: 'Password12345678' });

    expect(result).toMatchObject({
      success: false,
      error: { statusCode: 400, code: AuthApiErrorCodes.COMMON_PASSWORD },
    });
  });
});

describe('logout', () => {
  it('answers 204 even without a session', async () => {
    setMockAuthState(AuthStateUtil.SIGNED_OUT);

    expect((await authService.logout()).success).toBe(true);
  });

  it('ends the session, after which every other route answers 401 UNAUTHORIZED', async () => {
    expect(await authService.logout()).toEqual({ success: true, data: '' });

    expect(await authService.deletePasskey('cGFzc2tleS1pcGhvbmU')).toMatchObject({
      success: false,
      error: { statusCode: 401, code: UNAUTHORIZED_ERROR_CODE },
    });
  });

  it('returns the failure envelope when the server fails', async () => {
    server.use(http.post(`${TEST_BASE_API_URL}/auth/logout`, () => new HttpResponse(null, { status: 500 })));

    expect(await authService.logout()).toMatchObject({ success: false, error: { statusCode: 500 } });
  });
});

describe('getPasskeys', () => {
  it('lists the passkeys newest first', async () => {
    const { data } = await authService.getPasskeys();

    expect(data.map((passkey) => passkey.name)).toEqual(['iPhone', 'YubiKey']);
    expect(data[0]).toMatchObject({ isSynced: true });
  });
});

describe('startAddPasskey', () => {
  it('excludes the passkeys already registered', async () => {
    const result = await authService.startAddPasskey();

    expect(result.data?.excludeCredentials?.map((credential) => credential.id)).toEqual([
      'cGFzc2tleS1pcGhvbmU',
      'cGFzc2tleS15dWJpa2V5',
    ]);
  });

  it('returns 403 REAUTH_REQUIRED when the sign-in is not recent', async () => {
    mockStore.auth.isSignInRecent = false;

    expect(await authService.startAddPasskey()).toMatchObject({
      success: false,
      error: { statusCode: 403, code: AuthApiErrorCodes.REAUTH_REQUIRED },
    });
  });
});

describe('addPasskey', () => {
  it('posts the response and the name and returns the new passkey with 201', async () => {
    const result = await authService.addPasskey({ response: createRegistrationResponseMockModel(), name: 'Laptop' });

    expect(result).toMatchObject({ success: true, data: { id: 'bmV3LXBhc3NrZXk', name: 'Laptop', lastUsedAt: null } });
  });

  it('returns 403 REAUTH_REQUIRED when the sign-in is not recent', async () => {
    mockStore.auth.isSignInRecent = false;

    const result = await authService.addPasskey({ response: createRegistrationResponseMockModel(), name: 'Laptop' });

    expect(result).toMatchObject({
      success: false,
      error: { statusCode: 403, code: AuthApiErrorCodes.REAUTH_REQUIRED },
    });
  });
});

describe('deletePasskey', () => {
  it('returns 409 LAST_PASSKEY for the only passkey', async () => {
    mockStore.auth.passkeys.splice(1);

    expect(await authService.deletePasskey('cGFzc2tleS1pcGhvbmU')).toMatchObject({
      success: false,
      error: { statusCode: 409, code: AuthApiErrorCodes.LAST_PASSKEY },
    });
  });

  it('returns 403 REAUTH_REQUIRED when the sign-in is not recent', async () => {
    mockStore.auth.isSignInRecent = false;

    expect(await authService.deletePasskey('cGFzc2tleS1pcGhvbmU')).toMatchObject({
      success: false,
      error: { statusCode: 403, code: AuthApiErrorCodes.REAUTH_REQUIRED },
    });
  });

  it('removes the passkey', async () => {
    expect((await authService.deletePasskey('cGFzc2tleS1pcGhvbmU')).success).toBe(true);
    expect((await authService.getPasskeys()).data.map((passkey) => passkey.name)).toEqual(['YubiKey']);
  });
});

describe('logoutEverywhere', () => {
  it('posts to its own route', async () => {
    let wasCalled = false;
    server.use(
      http.post(`${TEST_BASE_API_URL}/auth/logout-everywhere`, () => {
        wasCalled = true;

        return new HttpResponse(null, { status: 204 });
      }),
    );

    expect((await authService.logoutEverywhere()).success).toBe(true);
    expect(wasCalled).toBe(true);
  });

  it('returns 401 UNAUTHORIZED without a session', async () => {
    setMockAuthState(AuthStateUtil.SIGNED_OUT);

    expect(await authService.logoutEverywhere()).toMatchObject({
      success: false,
      error: { statusCode: 401, code: UNAUTHORIZED_ERROR_CODE },
    });
  });
});
