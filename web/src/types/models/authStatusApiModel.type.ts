import type { AuthStateUtil } from '@app-types/utility';
import type { AuthUserApiModel } from './authUserApiModel.type';

// `user` comes only with `signedIn`.
export interface AuthStatusApiModel {
  state: AuthStateUtil;
  user?: AuthUserApiModel;
}
