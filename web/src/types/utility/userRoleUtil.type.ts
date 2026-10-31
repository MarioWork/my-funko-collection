// What a user may do (the API's `role`). An admin manages the catalogue and the images; a member keeps their own
// collections, items and tags, and sees the catalogue read-only.
export const UserRoleUtil = {
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const;
export type UserRoleUtil = (typeof UserRoleUtil)[keyof typeof UserRoleUtil];

export const USER_ROLE_LABELS: Record<UserRoleUtil, string> = {
  [UserRoleUtil.ADMIN]: 'Admin',
  [UserRoleUtil.MEMBER]: 'Member',
};
