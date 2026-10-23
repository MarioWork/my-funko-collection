import { mockStore, type MockFunkoRow } from '@mocks/mockStore';

// The fields that make two funkos the same one, as the API's unique index has them.
type FunkoIdentity = Pick<MockFunkoRow, 'categoryId' | 'number' | 'name' | 'isChase' | 'exclusive'>;

// Another funko with the same identity; `selfId` leaves out the funko being edited.
export function findDuplicate(candidate: FunkoIdentity, selfId?: number): MockFunkoRow | undefined {
  return mockStore.funkos.find(
    (funko) =>
      funko.id !== selfId &&
      funko.categoryId === candidate.categoryId &&
      funko.number === candidate.number &&
      funko.name === candidate.name &&
      funko.isChase === candidate.isChase &&
      funko.exclusive === candidate.exclusive,
  );
}
