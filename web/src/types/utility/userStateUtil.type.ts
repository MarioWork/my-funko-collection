// How a user can sign in today (the API's user `state`): their own password or a passkey, only the temporary
// password an admin made, that temporary password after its 7 days, or no way in at all.
export const UserStateUtil = {
  ACTIVE: 'ACTIVE',
  TEMPORARY_PASSWORD: 'TEMPORARY_PASSWORD',
  TEMPORARY_PASSWORD_EXPIRED: 'TEMPORARY_PASSWORD_EXPIRED',
  NO_SIGN_IN: 'NO_SIGN_IN',
} as const;
export type UserStateUtil = (typeof UserStateUtil)[keyof typeof UserStateUtil];

// Every state in words, so a chip never says it by colour alone.
export const USER_STATE_LABELS: Record<UserStateUtil, string> = {
  [UserStateUtil.ACTIVE]: 'Active',
  [UserStateUtil.TEMPORARY_PASSWORD]: 'Temporary password',
  [UserStateUtil.TEMPORARY_PASSWORD_EXPIRED]: 'Temporary password expired',
  [UserStateUtil.NO_SIGN_IN]: 'No way to sign in',
};
