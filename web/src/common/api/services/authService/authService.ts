import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser';
import axios from 'axios';
import { ADMIN_ONLY_ERROR_CODE, PASSWORD_CHANGE_REQUIRED_ERROR_CODE, axiosActions } from '@api/axiosActions';
import type {
  AuthSessionApiModel,
  AuthStatusApiModel,
  PasskeyApiModel,
  PasskeyId,
  PasskeyListApiModel,
} from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import type {
  CreatePasskey,
  FinishLogin,
  FinishSetup,
  PasswordSignIn,
  SetPassword,
  StartSetup,
} from './authService.type';

const BASE_AUTH_URL = '/auth';

// A passkey or a username and password, one user. Every passkey "start" call returns the options for a WebAuthn
// ceremony that the browser runs (see @utils/passkeyUtils); the matching "finish" call sends the result. The session
// is an HttpOnly cookie the API sets and clears itself: nothing here ever sees a token.
export default {
  getStatus: async (): Promise<AuthStatusApiModel> => {
    const response = await axios.get<AuthStatusApiModel>(`${BASE_AUTH_URL}/status`);

    return response.data;
  },

  startSetup: async (fields: StartSetup): Promise<JSONResponseUtil<PublicKeyCredentialCreationOptionsJSON>> =>
    axiosActions<PublicKeyCredentialCreationOptionsJSON>({
      url: `${BASE_AUTH_URL}/setup/options`,
      method: HttpVerbsUtil.POST,
      data: fields,
    }),

  finishSetup: async (fields: FinishSetup): Promise<JSONResponseUtil<AuthSessionApiModel>> =>
    axiosActions<AuthSessionApiModel>({
      url: `${BASE_AUTH_URL}/setup/verify`,
      method: HttpVerbsUtil.POST,
      data: fields,
    }),

  startLogin: async (): Promise<JSONResponseUtil<PublicKeyCredentialRequestOptionsJSON>> =>
    axiosActions<PublicKeyCredentialRequestOptionsJSON>({
      url: `${BASE_AUTH_URL}/login/options`,
      method: HttpVerbsUtil.POST,
    }),

  finishLogin: async (fields: FinishLogin): Promise<JSONResponseUtil<AuthSessionApiModel>> =>
    axiosActions<AuthSessionApiModel>({
      url: `${BASE_AUTH_URL}/login/verify`,
      method: HttpVerbsUtil.POST,
      data: fields,
    }),

  signInWithPassword: async (fields: PasswordSignIn): Promise<JSONResponseUtil<AuthSessionApiModel>> =>
    axiosActions<AuthSessionApiModel>({
      url: `${BASE_AUTH_URL}/login/password`,
      method: HttpVerbsUtil.POST,
      data: fields,
    }),

  // Sets or changes the username and password; needs a recent sign-in (403 REAUTH_REQUIRED otherwise).
  setPassword: async (fields: SetPassword): Promise<JSONResponseUtil<AuthSessionApiModel>> =>
    axiosActions<AuthSessionApiModel>({ url: `${BASE_AUTH_URL}/password`, method: HttpVerbsUtil.PUT, data: fields }),

  logout: async (): Promise<JSONResponseUtil> =>
    axiosActions({ url: `${BASE_AUTH_URL}/logout`, method: HttpVerbsUtil.POST }),

  logoutEverywhere: async (): Promise<JSONResponseUtil> =>
    axiosActions({ url: `${BASE_AUTH_URL}/logout-everywhere`, method: HttpVerbsUtil.POST }),

  getPasskeys: async (): Promise<PasskeyListApiModel> => {
    const response = await axios.get<PasskeyListApiModel>(`${BASE_AUTH_URL}/passkeys`);

    return response.data;
  },

  startAddPasskey: async (): Promise<JSONResponseUtil<PublicKeyCredentialCreationOptionsJSON>> =>
    axiosActions<PublicKeyCredentialCreationOptionsJSON>({
      url: `${BASE_AUTH_URL}/passkeys/options`,
      method: HttpVerbsUtil.POST,
    }),

  addPasskey: async (fields: CreatePasskey): Promise<JSONResponseUtil<PasskeyApiModel>> =>
    axiosActions<PasskeyApiModel>({
      url: `${BASE_AUTH_URL}/passkeys/verify`,
      method: HttpVerbsUtil.POST,
      data: fields,
    }),

  deletePasskey: async (id: PasskeyId): Promise<JSONResponseUtil> =>
    axiosActions({ url: `${BASE_AUTH_URL}/passkeys/${id}`, method: HttpVerbsUtil.DELETE }),
};

// The `code` of the API's error envelope for every auth failure a page reacts to. A missing session
// (UNAUTHORIZED) is handled once for the whole app, in axiosActions' isUnauthorizedFailure.
export const AuthApiErrorCodes = {
  INVALID_SETUP_CODE: 'INVALID_SETUP_CODE',
  ALREADY_SET_UP: 'ALREADY_SET_UP',
  NOT_SET_UP: 'NOT_SET_UP',
  PASSKEY_FAILED: 'PASSKEY_FAILED',
  SIGN_IN_FAILED: 'SIGN_IN_FAILED',
  LAST_PASSKEY: 'LAST_PASSKEY',
  REAUTH_REQUIRED: 'REAUTH_REQUIRED',
  ADMIN_ONLY: ADMIN_ONLY_ERROR_CODE,
  COMMON_PASSWORD: 'COMMON_PASSWORD',
  // The new password is the temporary one it should replace.
  PASSWORD_REUSED: 'PASSWORD_REUSED',
  // The right temporary password, after its 7 days.
  TEMPORARY_PASSWORD_EXPIRED: 'TEMPORARY_PASSWORD_EXPIRED',
  // Signed in with a temporary password: every route but replacing it and signing out answers this (403).
  PASSWORD_CHANGE_REQUIRED: PASSWORD_CHANGE_REQUIRED_ERROR_CODE,
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
} as const;
export type AuthApiErrorCodes = (typeof AuthApiErrorCodes)[keyof typeof AuthApiErrorCodes];
