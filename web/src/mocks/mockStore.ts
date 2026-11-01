// The in-memory data behind every mock handler. One store per page load (and per test, through resetMockStore()),
// so an add or a delete changes the next list the way the real API would. It holds the catalogue with every
// submission in it (the handlers show other members' waiting ones to nobody, as the API does: mockCatalogueUtils),
// and only the signed-in user's own collections, items and tags (the API never sends another user's).
import {
  FunkoTypeUtil,
  SubmissionStatusUtil,
  type AuthStateUtil as AuthState,
  type UserRoleUtil as UserRole,
} from '@app-types/utility';
import { createMockAuth, initialAuthState, MOCK_USER_ID } from './mockAuth';
import { createMockUsers } from './mockUsers';
import { createSeedData } from './mockSeed';
import type { MockFunkoRow, MockStore } from './mockStore.type';
import { nextId, nowIso, resetMockClock } from './mockStoreUtils';

const SUBMISSION_NAME = 'Sent-in funko';
const SUBMISSION_NUMBER = '9001';

function createMockStore(): MockStore {
  return { auth: createMockAuth(initialAuthState), users: createMockUsers(), ...createSeedData() };
}

export let mockStore: MockStore = createMockStore();

export function resetMockStore(): void {
  resetMockClock();
  mockStore = createMockStore();
}

// For a test that starts signed out or before the first run. resetMockStore() signs back in.
export function setMockAuthState(state: AuthState): void {
  mockStore.auth = createMockAuth(state);
}

// For a test that signs in as a member instead of the admin. resetMockStore() makes the user an admin again.
export function setMockUserRole(role: UserRole): void {
  mockStore.auth.role = role;
}

type MockSubmissionOptions = Partial<
  Pick<MockFunkoRow, 'name' | 'number' | 'barcode' | 'status' | 'submittedById' | 'changedByAdminAt'>
>;

const REJECTION_REASON = 'Not a real funko';

// For a test that needs a submission: a funko sent in by the signed-in user (a waiting one unless `status` says
// otherwise), by another member when `submittedById` names one, or by a removed user when it is null. Filed under
// the seed's first category. A rejected one carries a reason and a review date, as on the API.
export function addMockSubmission(options: MockSubmissionOptions = {}): MockFunkoRow {
  const [firstCategory] = mockStore.categories;

  if (!firstCategory) throw new Error('The mock seed has no categories');

  const status = options.status ?? SubmissionStatusUtil.WAITING;
  const isRejected = status === SubmissionStatusUtil.REJECTED;
  const row: MockFunkoRow = {
    id: nextId(mockStore.funkos),
    name: options.name ?? SUBMISSION_NAME,
    number: options.number ?? SUBMISSION_NUMBER,
    type: FunkoTypeUtil.POP,
    categoryId: firstCategory.id,
    seriesId: null,
    isChase: false,
    exclusive: '',
    barcode: options.barcode ?? null,
    status,
    // null is a removed user's submission, so only a missing option means the signed-in user's.
    submittedById: options.submittedById === undefined ? MOCK_USER_ID : options.submittedById,
    reviewedAt: isRejected ? nowIso() : null,
    rejectionReason: isRejected ? REJECTION_REASON : null,
    changedByAdminAt: options.changedByAdminAt ?? null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  mockStore.funkos.push(row);

  return row;
}

// For a test that signs in as a read-only user. resetMockStore() lets the user make changes again.
export function setMockReadOnly(): void {
  mockStore.auth.isReadOnly = true;
}

// For a test that starts signed in with a temporary password. resetMockStore() gives the user their own again.
export function setMockMustChangePassword(): void {
  mockStore.auth.mustChangePassword = true;
}
