// The rows of the in-memory mock store (mockStore.ts), shaped like the API's tables.
import type { FunkoImageApiModel, PasskeyApiModel } from '@app-types/models';
import type {
  AuthStateUtil as AuthState,
  FunkoTypeUtil as FunkoType,
  ItemConditionUtil as ItemCondition,
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
export type MockImageRow = FunkoImageApiModel & { funkoId: number };
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
// until a password is set; the mocks keep the password as typed (the API keeps only an argon2id hash).
export type MockAuth = {
  state: AuthState;
  userName: string;
  username: string | null;
  password: string | null;
  isSignInRecent: boolean;
  passkeys: MockPasskeyRow[];
};

export type MockStore = {
  auth: MockAuth;
  categories: MockCategoryRow[];
  series: MockSeriesRow[];
  tags: MockTagRow[];
  collections: MockCollectionRow[];
  funkos: MockFunkoRow[];
  images: MockImageRow[];
  items: MockItemRow[];
};
