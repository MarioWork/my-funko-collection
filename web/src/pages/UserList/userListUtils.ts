import type { UserApiModel } from '@app-types/models';
import { USER_ROLE_LABELS } from '@app-types/utility';

// The API's largest page: far more users than this app will ever have, so the list is never paged.
export const USER_PAGE_SIZE = '100';

// "12 users" / "1 user".
export function describeUserCount(count: number): string {
  return count === 1 ? '1 user' : `${count} users`;
}

// "Admin", "Member, read-only": the role, and in words whether an admin limited them to looking.
export function describeUserRole(user: UserApiModel): string {
  const role = USER_ROLE_LABELS[user.role];

  return user.isReadOnly ? `${role}, read-only` : role;
}

// What a user signs in as; one with no password yet has only their name.
export function userTitle(user: UserApiModel): string {
  return user.username ?? user.name;
}
