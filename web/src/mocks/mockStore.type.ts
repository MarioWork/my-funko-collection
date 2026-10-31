// The rows of the in-memory mock store (mockStore.ts), shaped like the API's tables.
import type { FunkoImageApiModel, PasskeyApiModel, UserApiModel } from '@app-types/models';
import type {
  AuthStateUtil as AuthState,
  FunkoTypeUtil as FunkoType,
  ItemConditionUtil as ItemCondition,
  UserRoleUtil as UserRole,
} from '@app-types/utility';

export type MockRowWithId = { id: number };
export type MockNamedRow = { id: number; name: string };
export type MockCategoryRow = { id: number; name: string; createdAt: string; updatedAt: string };
export type MockSeriesRow = { id: number; name: string; createdAt: string; updatedAt: string };
export type MockTagRow = { id: number; name: string; notes: string | null; createdAt: string; updatedAt: string };
export type MockCollectionRow = {
  id: number;
  name: string;
  notes: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};
export type MockFunkoRow = {
  id: number;
  name: string;
  number: string;
  type: FunkoType;
  categoryId: number;
  seriesId: number | null;
  isChase: boolean;
  exclusive: string;
  barcode: string | null;
  createdAt: string;
  updatedAt: string;
};
// `uploadedById`: the user who uploaded it, null once that user is deleted (the API clears it, keeping the image).
export type MockImageRow = FunkoImageApiModel & { funkoId: number; uploadedById: number | null };
export type MockItemRow = {
  id: number;
  collectionId: number;
  funkoId: number;
  quantity: number;
  condition: ItemCondition | null;
  purchasePriceCents: number | null;
  purchaseCurrency: string;
  purchasedAt: string | null;
  notes: string | null;
  tagIds: number[];
  createdAt: string;
  updatedAt: string;
};

export type MockPasskeyRow = PasskeyApiModel;
// The one user and this browser's session. `isSignInRecent`: signed in within the last 10 minutes, which changing a
// passkey or the password needs (the API answers 403 REAUTH_REQUIRED otherwise). `username` and `password` stay null
// until a password is set; the mocks keep the password as typed (the API keeps only an argon2id hash). `role`:
// an admin by default, a member through setMockUserRole() (the admin-only routes then answer 403 ADMIN_ONLY).
// `mustChangePassword`: signed in with a temporary password (setMockMustChangePassword(), or a password sign-in as a
// user an admin created): every route but replacing it and signing out answers 403 PASSWORD_CHANGE_REQUIRED.
export type MockAuth = {
  state: AuthState;
  userName: string;
  username: string | null;
  role: UserRole;
  password: string | null;
  mustChangePassword: boolean;
  isSignInRecent: boolean;
  passkeys: MockPasskeyRow[];
};

// The other users, as GET /users lists them, plus their password as typed (the temporary one an admin was shown),
// so a password sign-in as one of them works in mock mode. The API keeps only a hash.
// `isLastAdmin` is worked out from every row when the list is read, as the API does.
export type MockUserRow = Omit<UserApiModel, 'isLastAdmin'> & { password: string | null };

export type MockStore = {
  auth: MockAuth;
  users: MockUserRow[];
  categories: MockCategoryRow[];
  series: MockSeriesRow[];
  tags: MockTagRow[];
  collections: MockCollectionRow[];
  funkos: MockFunkoRow[];
  images: MockImageRow[];
  items: MockItemRow[];
};
