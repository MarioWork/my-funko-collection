import type { UserApiModel } from './userApiModel.type';

// The answer to creating a user, or to giving one a new temporary password: the only time a temporary password is
// ever sent. The admin copies it now or never.
export interface UserWithTemporaryPasswordApiModel {
  user: UserApiModel;
  temporaryPassword: string;
}
