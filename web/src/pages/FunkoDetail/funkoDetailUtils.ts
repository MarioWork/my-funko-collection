import type { CollectionItemApiModel, FunkoDetailApiModel } from '@app-types/models';

// How many of a funko's items one read brings back: one item per collection, so this is far above any real count.
// Past it the extra collections would be left out.
export const FUNKO_ITEMS_PAGE_SIZE = '100';

// How many users other than the signed-in one have the funko: the admin's count of every user who has it, less the
// signed-in user when one of their own items holds it. 0 for a member (who gets no count).
export function otherUserCountOf(funko: FunkoDetailApiModel, items: CollectionItemApiModel[]): number {
  const userCount = funko.userCount ?? 0;
  const isOwnFunko = items.length > 0;

  return isOwnFunko ? userCount - 1 : userCount;
}

// "1 other user has it in their collections" / "3 other users have it in their collections": a number, never who.
export function describeOtherHolders(otherUserCount: number): string {
  if (otherUserCount === 1) return '1 other user has it in their collections';

  return `${otherUserCount} other users have it in their collections`;
}
