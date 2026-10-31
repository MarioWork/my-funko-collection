import type { UserApiModel } from './userApiModel.type';

// The answer to creating a user: the only time the temporary password is ever sent. The admin copies it now or
// never.
export interface CreatedUserApiModel {
  user: UserApiModel;
  temporaryPassword: string;
}
