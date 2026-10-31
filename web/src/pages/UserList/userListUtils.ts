import type { UserApiModel } from '@app-types/models';

// The API's largest page: far more users than this app will ever have, so the list is never paged.
export const USER_PAGE_SIZE = '100';

// "12 users" / "1 user".
export function describeUserCount(count: number): string {
  return count === 1 ? '1 user' : `${count} users`;
}

// What a user signs in as; one with no password yet has only their name.
export function userTitle(user: UserApiModel): string {
  return user.username ?? user.name;
}
