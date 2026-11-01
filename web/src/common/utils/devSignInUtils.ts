// The seeded users the dev sign-in picker offers (only in `yarn dev`, never in a build): the same usernames in
// mock mode (src/mocks/mockUsers.ts) and on a local API seeded with `yarn db:seed` (api/prisma/seed.ts), all with the
// one dev password. Keep the three in step.
import { UserRoleUtil } from '@app-types/utility';

// One seeded user who shows one set of UI states.
export type DevPersona = {
  username: string;
  role: UserRoleUtil;
  isReadOnly: boolean;
  hasTemporaryPassword: boolean;
};

export const DEV_PERSONAS: DevPersona[] = [
  // Every notification kind, the review list with every status, a funko other users have.
  { username: 'leia', role: UserRoleUtil.ADMIN, isReadOnly: false, hasTemporaryPassword: false },
  // Submissions in every state, and every notification a member gets.
  { username: 'rey', role: UserRoleUtil.MEMBER, isReadOnly: false, hasTemporaryPassword: false },
  { username: 'poe', role: UserRoleUtil.MEMBER, isReadOnly: true, hasTemporaryPassword: false },
  { username: 'lando', role: UserRoleUtil.ADMIN, isReadOnly: true, hasTemporaryPassword: false },
  // A new user: lands on /set-password.
  { username: 'finn', role: UserRoleUtil.MEMBER, isReadOnly: false, hasTemporaryPassword: true },
];
