// The person who uses the app. The API keeps a display name and, once a password is set, the username that signs
// in with it (lower-case), and the role that decides what they may change. Never the password: only its hash, on
// the server.
import type { UserRoleUtil } from '@app-types/utility';

export interface AuthUserApiModel {
  name: string;
  username: string | null;
  role: UserRoleUtil;
}
