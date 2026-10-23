import type { AuthUserApiModel } from './authUserApiModel.type';

// The answer to a finished sign-in or first-run setup; the session itself travels in an HttpOnly cookie.
export interface AuthSessionApiModel {
  user: AuthUserApiModel;
}
