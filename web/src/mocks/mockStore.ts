// The in-memory data behind every mock handler. One store per page load (and per test, through resetMockStore()),
// so an add or a delete changes the next list the way the real API would.
import type { FunkoImageApiModel, PasskeyApiModel } from '@app-types/models';
import {
  AuthStateUtil,
  FunkoTypeUtil,
  ItemConditionUtil,
  type AuthStateUtil as AuthState,
  type FunkoTypeUtil as FunkoType,
  type ItemConditionUtil as ItemCondition,
} from '@app-types/utility';
import { DEFAULT_CURRENCY } from '@utils/moneyUtils';
import { createMockImageUrls, MOCK_IMAGE_SIZE_BYTES } from './mockImageUtils';

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
// The one user and this browser's session. `isSignInRecent`: signed in within the last 10 minutes, which removing a
// passkey needs (the API answers 403 REAUTH_REQUIRED otherwise).
export type MockAuth = {
  state: AuthState;
  userName: string;
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

// Vite's env in the browser and in Vitest. Playwright loads this file in plain Node, where import.meta.env does
// not exist, so it reads as empty there (the defaults: no extra funkos, signed in).
const viteEnv: ImportMetaEnv | undefined = import.meta.env;
const mockEnv: Partial<ImportMetaEnv> = viteEnv ?? {};

const FIRST_DATE = Date.UTC(2026, 0, 5, 9, 30);
const DAY_MS = 24 * 60 * 60 * 1000;
const OWNED_COLLECTION_ID = 1;
const WISHLIST_COLLECTION_ID = 2;

function mockDate(index: number): string {
  return new Date(FIRST_DATE + index * DAY_MS).toISOString();
}

const CATEGORY_NAMES = ['Pop! Marvel', 'Pop! Television', 'Star Wars', 'Pop! Animation', 'Pop! Games'];
const TAG_NAMES = ['Box 1', 'Box 2', 'Display shelf'];
const SERIES_NAMES = ['Daredevil: Born Again', 'The Mandalorian', 'Stranger Things'];

type SeedFunko = {
  name: string;
  number: string;
  category: number;
  // 1-based index into SERIES_NAMES; most funkos have none.
  series?: number;
  type?: FunkoType;
  isChase?: boolean;
  exclusive?: string;
  barcode?: string;
};

// Mirrors api/src/db/seed.ts so mock mode and a seeded API look alike.
const SEED_FUNKOS: SeedFunko[] = [
  { name: 'Spider-Man', number: '03', category: 1, barcode: '889698624008' },
  { name: 'Iron Man', number: '04', category: 1 },
  { name: 'Captain America', number: '06', category: 1 },
  { name: 'Deadpool', number: '20', category: 1 },
  { name: 'Thanos', number: '78', category: 1 },
  { name: 'Thanos', number: '78', category: 1, isChase: true },
  { name: 'Groot', number: '1203', category: 1 },
  { name: 'Spider-Man (Integrated Suit)', number: '913', category: 1, exclusive: 'Walmart' },
  { name: 'Eleven', number: '421', category: 2, series: 3 },
  { name: 'Eddie Munson', number: '1250', category: 2, series: 3 },
  { name: 'Dustin', number: '424', category: 2, series: 3 },
  { name: 'Vecna', number: '1312', category: 2, series: 3 },
  { name: 'Walter White', number: '162', category: 2 },
  { name: 'Darth Vader', number: '01', category: 3 },
  { name: 'Boba Fett', number: '08', category: 3 },
  { name: 'Grogu', number: '368', category: 3, series: 2 },
  { name: 'The Mandalorian', number: '345', category: 3, series: 2 },
  { name: 'Ahsoka Tano', number: '464', category: 3 },
  { name: 'Darth Maul', number: '09', category: 3, exclusive: 'SDCC 2024' },
  { name: 'Goku', number: '09', category: 4 },
  { name: 'Super Saiyan Goku', number: '14', category: 4 },
  { name: 'Naruto', number: '71', category: 4 },
  { name: 'Luffy', number: '98', category: 4 },
  { name: 'Tanjiro', number: '867', category: 4 },
  { name: 'Rick and Morty on Spaceship', number: '32', category: 4, type: FunkoTypeUtil.POP_RIDES },
  { name: 'Link', number: '1026', category: 5 },
  { name: 'Mario', number: '09', category: 5 },
  { name: 'Pikachu', number: '353', category: 5 },
  { name: 'Master Chief', number: '07', category: 5 },
  { name: 'Kratos', number: '25', category: 5, type: FunkoTypeUtil.POP_DELUXE },
];

type SeedItem = {
  funkoId: number;
  collectionId: number;
  quantity?: number;
  condition?: ItemCondition;
  priceCents?: number;
  purchasedAt?: string;
  tagIds?: number[];
  notes?: string;
};

const SEED_ITEMS: SeedItem[] = [
  {
    funkoId: 1,
    collectionId: OWNED_COLLECTION_ID,
    condition: ItemConditionUtil.MINT_IN_BOX,
    priceCents: 1499,
    purchasedAt: '2024-03-02',
    tagIds: [3],
  },
  {
    funkoId: 2,
    collectionId: OWNED_COLLECTION_ID,
    condition: ItemConditionUtil.MINT_IN_BOX,
    priceCents: 1299,
    purchasedAt: '2024-03-02',
    tagIds: [1],
  },
  {
    funkoId: 4,
    collectionId: OWNED_COLLECTION_ID,
    quantity: 2,
    condition: ItemConditionUtil.MINT_IN_BOX,
    priceCents: 1599,
    purchasedAt: '2024-05-18',
    tagIds: [1],
  },
  {
    funkoId: 5,
    collectionId: OWNED_COLLECTION_ID,
    condition: ItemConditionUtil.OUT_OF_BOX,
    priceCents: 999,
    purchasedAt: '2023-11-11',
    tagIds: [3],
    notes: 'Box recycled',
  },
  {
    funkoId: 9,
    collectionId: OWNED_COLLECTION_ID,
    condition: ItemConditionUtil.MINT_IN_BOX,
    priceCents: 1499,
    purchasedAt: '2024-07-20',
    tagIds: [2],
  },
  {
    funkoId: 10,
    collectionId: OWNED_COLLECTION_ID,
    condition: ItemConditionUtil.MINT_IN_BOX,
    priceCents: 1799,
    purchasedAt: '2024-07-20',
    tagIds: [2],
  },
  {
    funkoId: 14,
    collectionId: OWNED_COLLECTION_ID,
    condition: ItemConditionUtil.BOX_DAMAGED,
    priceCents: 899,
    purchasedAt: '2022-12-24',
    tagIds: [1],
    notes: 'Corner dent',
  },
  {
    funkoId: 16,
    collectionId: OWNED_COLLECTION_ID,
    condition: ItemConditionUtil.MINT_IN_BOX,
    priceCents: 1499,
    purchasedAt: '2023-06-01',
    tagIds: [3],
  },
  {
    funkoId: 17,
    collectionId: OWNED_COLLECTION_ID,
    condition: ItemConditionUtil.MINT_IN_BOX,
    priceCents: 1499,
    purchasedAt: '2023-06-01',
    tagIds: [3],
  },
  {
    funkoId: 20,
    collectionId: OWNED_COLLECTION_ID,
    condition: ItemConditionUtil.MINT_IN_BOX,
    priceCents: 1399,
    purchasedAt: '2024-01-15',
    tagIds: [2],
  },
  {
    funkoId: 22,
    collectionId: OWNED_COLLECTION_ID,
    condition: ItemConditionUtil.MINT_IN_BOX,
    priceCents: 1399,
    purchasedAt: '2024-01-15',
    tagIds: [2],
  },
  {
    funkoId: 26,
    collectionId: OWNED_COLLECTION_ID,
    condition: ItemConditionUtil.MINT_IN_BOX,
    priceCents: 1599,
    purchasedAt: '2024-09-09',
    tagIds: [3],
  },
  {
    funkoId: 28,
    collectionId: OWNED_COLLECTION_ID,
    condition: ItemConditionUtil.MINT_IN_BOX,
    priceCents: 1299,
    purchasedAt: '2024-09-09',
    tagIds: [1],
  },
  {
    funkoId: 30,
    collectionId: OWNED_COLLECTION_ID,
    condition: ItemConditionUtil.MINT_IN_BOX,
    priceCents: 2499,
    purchasedAt: '2025-02-14',
    tagIds: [3],
  },
  {
    funkoId: 25,
    collectionId: OWNED_COLLECTION_ID,
    condition: ItemConditionUtil.MINT_IN_BOX,
    priceCents: 2999,
    purchasedAt: '2025-02-14',
    tagIds: [2],
  },
  { funkoId: 12, collectionId: WISHLIST_COLLECTION_ID },
  { funkoId: 18, collectionId: WISHLIST_COLLECTION_ID },
  { funkoId: 23, collectionId: WISHLIST_COLLECTION_ID },
  { funkoId: 29, collectionId: WISHLIST_COLLECTION_ID },
  { funkoId: 7, collectionId: WISHLIST_COLLECTION_ID, notes: 'Wait for a sale' },
];

const IMAGES_PER_FUNKO = 2;
// Generated funkos (`yarn dev:big`) get one to six images of varied sizes, like a real shelf.
const EXTRA_MAX_IMAGES = 6;
const EXTRA_BASE_IMAGE_BYTES = 120_000;
const EXTRA_IMAGE_BYTES_STEP = 37_000;
const EXTRA_IMAGE_BYTES_SPREAD = 9;
const EXTRA_SERIES_EVERY = 4;
const EXTRA_OWNED_EVERY = 2;
const EXTRA_WISHLIST_EVERY = 7;
const EXTRA_CHASE_EVERY = 11;
const EXTRA_NUMBER_START = 2000;

// How many generated funkos to add: none in tests and normal mock mode.
const extraFunkoCount = Number(mockEnv.VITE_MOCK_EXTRA_FUNKOS ?? 0) || 0;

// "Iron Man 37": a seed name with a running number, in the seed's category, some with a series, a chase now and
// then. Only for trying long lists; never in tests.
function createExtraFunkos(startId: number, startIndex: number): MockFunkoRow[] {
  return Array.from({ length: extraFunkoCount }, (_, offset) => {
    const seed = SEED_FUNKOS[offset % SEED_FUNKOS.length] ?? SEED_FUNKOS[0];
    const index = startIndex + offset;
    const hasSeries = offset % EXTRA_SERIES_EVERY === 0;

    return {
      id: startId + offset,
      name: `${seed?.name ?? 'Funko'} ${offset + 1}`,
      number: String(EXTRA_NUMBER_START + offset),
      type: seed?.type ?? FunkoTypeUtil.POP,
      categoryId: seed?.category ?? 1,
      seriesId: hasSeries ? (offset % SERIES_NAMES.length) + 1 : null,
      isChase: offset % EXTRA_CHASE_EVERY === 0,
      exclusive: '',
      barcode: null,
      createdAt: mockDate(index),
      updatedAt: mockDate(index),
    };
  });
}

function createExtraImages(funkos: MockFunkoRow[], startId: number): MockImageRow[] {
  let nextId = startId;

  return funkos.flatMap((funko, funkoIndex) =>
    Array.from({ length: (funkoIndex % EXTRA_MAX_IMAGES) + 1 }, (_, position) => {
      const id = nextId;
      const sizeSpread = (funkoIndex + position) % EXTRA_IMAGE_BYTES_SPREAD;

      nextId += 1;

      return {
        id,
        funkoId: funko.id,
        position,
        sizeBytes: EXTRA_BASE_IMAGE_BYTES + sizeSpread * EXTRA_IMAGE_BYTES_STEP,
        createdAt: funko.createdAt,
        ...createMockImageUrls(funko.name, id),
      };
    }),
  );
}

// Every other generated funko is owned, every seventh wishlisted.
function createExtraItems(funkos: MockFunkoRow[], startId: number): MockItemRow[] {
  const memberships = funkos.flatMap((funko, funkoIndex) => [
    ...(funkoIndex % EXTRA_OWNED_EVERY === 0 ? [{ funko, collectionId: OWNED_COLLECTION_ID }] : []),
    ...(funkoIndex % EXTRA_WISHLIST_EVERY === 0 ? [{ funko, collectionId: WISHLIST_COLLECTION_ID }] : []),
  ]);

  return memberships.map(({ funko, collectionId }, offset) => ({
    id: startId + offset,
    collectionId,
    funkoId: funko.id,
    quantity: 1,
    condition: null,
    purchasePriceCents: null,
    purchaseCurrency: DEFAULT_CURRENCY,
    purchasedAt: null,
    notes: null,
    tagIds: [],
    createdAt: funko.createdAt,
    updatedAt: funko.updatedAt,
  }));
}

function createImages(funkos: MockFunkoRow[]): MockImageRow[] {
  let nextId = 1;

  return funkos.flatMap((funko, index) =>
    Array.from({ length: IMAGES_PER_FUNKO }, (_, position) => {
      const id = nextId;

      nextId += 1;

      return {
        id,
        funkoId: funko.id,
        position,
        sizeBytes: MOCK_IMAGE_SIZE_BYTES,
        createdAt: mockDate(index),
        ...createMockImageUrls(funko.name, index * IMAGES_PER_FUNKO + position),
      };
    }),
  );
}

// The first-run code the mocks accept, as the server would print it in /setup?code=...
export const MOCK_SETUP_CODE = 'funko-first-run';
const MOCK_USER_NAME = 'Mario';

const SEED_PASSKEYS: MockPasskeyRow[] = [
  {
    id: 'cGFzc2tleS1pcGhvbmU',
    name: 'iPhone',
    isSynced: true,
    createdAt: mockDate(20),
    lastUsedAt: mockDate(40),
  },
  {
    id: 'cGFzc2tleS15dWJpa2V5',
    name: 'YubiKey',
    isSynced: false,
    createdAt: mockDate(3),
    lastUsedAt: null,
  },
];

const AUTH_STATES = Object.values(AuthStateUtil);

function isAuthState(value: string | undefined): value is AuthState {
  return AUTH_STATES.some((state) => state === value);
}

// Mock mode can open on the login or the first-run page (VITE_MOCK_AUTH_STATE=signedOut / setup); signed in
// otherwise, so dev, Vitest and Playwright see the app as before.
const initialAuthState = isAuthState(mockEnv.VITE_MOCK_AUTH_STATE)
  ? mockEnv.VITE_MOCK_AUTH_STATE
  : AuthStateUtil.SIGNED_IN;

function createMockAuth(state: AuthState): MockAuth {
  const hasUser = state !== AuthStateUtil.SETUP;

  return {
    state,
    userName: hasUser ? MOCK_USER_NAME : '',
    isSignInRecent: true,
    passkeys: hasUser ? SEED_PASSKEYS.map((passkey) => ({ ...passkey })) : [],
  };
}

function createMockStore(): MockStore {
  const categories = CATEGORY_NAMES.map((name, index) => ({
    id: index + 1,
    name,
    createdAt: mockDate(index),
    updatedAt: mockDate(index),
  }));
  const series = SERIES_NAMES.map((name, index) => ({
    id: index + 1,
    name,
    createdAt: mockDate(index),
    updatedAt: mockDate(index),
  }));
  const tags = TAG_NAMES.map((name, index) => ({
    id: index + 1,
    name,
    notes: null,
    createdAt: mockDate(index),
    updatedAt: mockDate(index),
  }));
  const collections: MockCollectionRow[] = [
    {
      id: OWNED_COLLECTION_ID,
      name: 'Owned',
      notes: 'Everything on the shelves and in the boxes',
      isDefault: true,
      createdAt: mockDate(0),
      updatedAt: mockDate(0),
    },
    {
      id: WISHLIST_COLLECTION_ID,
      name: 'Wishlist',
      notes: 'Next buys',
      isDefault: false,
      createdAt: mockDate(1),
      updatedAt: mockDate(1),
    },
  ];
  const funkos: MockFunkoRow[] = SEED_FUNKOS.map((seed, index) => ({
    id: index + 1,
    name: seed.name,
    number: seed.number,
    type: seed.type ?? FunkoTypeUtil.POP,
    categoryId: seed.category,
    seriesId: seed.series ?? null,
    isChase: seed.isChase ?? false,
    exclusive: seed.exclusive ?? '',
    barcode: seed.barcode ?? null,
    createdAt: mockDate(index),
    updatedAt: mockDate(index),
  }));
  const items: MockItemRow[] = SEED_ITEMS.map((seed, index) => ({
    id: index + 1,
    collectionId: seed.collectionId,
    funkoId: seed.funkoId,
    quantity: seed.quantity ?? 1,
    condition: seed.condition ?? null,
    purchasePriceCents: seed.priceCents ?? null,
    purchaseCurrency: DEFAULT_CURRENCY,
    purchasedAt: seed.purchasedAt ?? null,
    notes: seed.notes ?? null,
    tagIds: seed.tagIds ?? [],
    createdAt: mockDate(index),
    updatedAt: mockDate(index),
  }));

  const seedImages = createImages(funkos);
  const extraFunkos = createExtraFunkos(funkos.length + 1, funkos.length);
  const extraImages = createExtraImages(extraFunkos, seedImages.length + 1);
  const extraItems = createExtraItems(extraFunkos, items.length + 1);

  return {
    auth: createMockAuth(initialAuthState),
    categories,
    series,
    tags,
    collections,
    funkos: [...funkos, ...extraFunkos],
    images: [...seedImages, ...extraImages],
    items: [...items, ...extraItems],
  };
}

export let mockStore: MockStore = createMockStore();

export function resetMockStore(): void {
  mockStore = createMockStore();
}

// For a test that starts signed out or before the first run. resetMockStore() signs back in.
export function setMockAuthState(state: AuthState): void {
  mockStore.auth = createMockAuth(state);
}

export function nextId(rows: MockRowWithId[]): number {
  return rows.reduce((highest, row) => Math.max(highest, row.id), 0) + 1;
}

export function nowIso(): string {
  return new Date().toISOString();
}
