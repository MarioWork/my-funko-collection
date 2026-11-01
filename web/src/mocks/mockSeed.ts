// The seed rows behind the mock store.
import {
  FunkoTypeUtil,
  ItemConditionUtil,
  NotificationKindUtil,
  UserRoleUtil,
  SubmissionStatusUtil,
  type FunkoTypeUtil as FunkoType,
  type ItemConditionUtil as ItemCondition,
} from '@app-types/utility';
import { DEFAULT_CURRENCY } from '@utils/moneyUtils';
import { MOCK_USER_ID } from './mockAuth';
import { createMockImageUrls, MOCK_IMAGE_SIZE_BYTES } from './mockImageUtils';
import type {
  MockCollectionRow,
  MockFunkoRow,
  MockImageRow,
  MockItemRow,
  MockNotificationRow,
  MockOtherUserItemRow,
  MockStore,
  MockUserRow,
  MockSubmissionColumns,
} from './mockStore.type';
import { mockDate, mockEnv, mockRecentDate, NOT_REVIEWED } from './mockStoreUtils';
import {
  MOCK_MEMBER_ID,
  MOCK_OTHER_ADMIN_ID,
  MOCK_PERSONA_MEMBER_ID,
  MOCK_READ_ONLY_ADMIN_ID,
  MOCK_READ_ONLY_MEMBER_ID,
  MOCK_SECOND_MEMBER_ID,
} from './mockUsers';

type MockSeedData = Omit<MockStore, 'auth' | 'users'>;

// How many hours before the mock clock the first seed submission was sent in; each next one an hour later.
const FIRST_NOTIFICATION_HOURS_AGO = 3;

const OWNED_COLLECTION_ID = 1;
const WISHLIST_COLLECTION_ID = 2;

const CATEGORY_NAMES = ['Pop! Marvel', 'Pop! Television', 'Pop! Star Wars', 'Pop! Animation', 'Pop! Games'];
const TAG_NAMES = ['Box 1', 'Box 2', 'Display shelf'];
// Every funko has one. Mirrors api/prisma/seed.ts, in the same order (ids are positions).
const SERIES_NAMES = [
  'Daredevil: Born Again',
  'The Mandalorian',
  'Stranger Things',
  'Spider-Man',
  'Iron Man',
  'Captain America',
  'Deadpool',
  'Avengers: Infinity War',
  'Guardians of the Galaxy',
  'Breaking Bad',
  'Star Wars',
  'Star Wars: The Clone Wars',
  'Dragon Ball Z',
  'Naruto Shippuden',
  'One Piece',
  'Demon Slayer',
  'Rick and Morty',
  'The Legend of Zelda',
  'Super Mario',
  'Pokémon',
  'Halo',
  'God of War',
  'Bluey',
  'Wednesday',
  'My Neighbor Totoro',
];

type SeedFunko = {
  name: string;
  number: string;
  category: number;
  // 1-based index into SERIES_NAMES: every funko has one.
  series: number;
  type?: FunkoType;
  isChase?: boolean;
  exclusive?: string;
  barcode?: string;
};

// Mirrors api/prisma/seed.ts so mock mode and a seeded API look alike.
const SEED_FUNKOS: SeedFunko[] = [
  { name: 'Spider-Man', number: '03', category: 1, series: 4, barcode: '889698624008' },
  { name: 'Iron Man', number: '04', category: 1, series: 5 },
  { name: 'Captain America', number: '06', category: 1, series: 6 },
  { name: 'Deadpool', number: '20', category: 1, series: 7 },
  { name: 'Thanos', number: '78', category: 1, series: 8 },
  { name: 'Thanos', number: '78', category: 1, series: 8, isChase: true },
  { name: 'Groot', number: '1203', category: 1, series: 9 },
  { name: 'Spider-Man (Integrated Suit)', number: '913', category: 1, series: 4, exclusive: 'Walmart' },
  { name: 'Eleven', number: '421', category: 2, series: 3 },
  { name: 'Eddie Munson', number: '1250', category: 2, series: 3 },
  { name: 'Dustin', number: '424', category: 2, series: 3 },
  { name: 'Vecna', number: '1312', category: 2, series: 3 },
  { name: 'Walter White', number: '162', category: 2, series: 10 },
  { name: 'Darth Vader', number: '01', category: 3, series: 11 },
  { name: 'Boba Fett', number: '08', category: 3, series: 11 },
  { name: 'Grogu', number: '368', category: 3, series: 2 },
  { name: 'The Mandalorian', number: '345', category: 3, series: 2 },
  { name: 'Ahsoka Tano', number: '464', category: 3, series: 12 },
  { name: 'Darth Maul', number: '09', category: 3, series: 11, exclusive: 'SDCC 2024' },
  { name: 'Goku', number: '09', category: 4, series: 13 },
  { name: 'Super Saiyan Goku', number: '14', category: 4, series: 13 },
  { name: 'Naruto', number: '71', category: 4, series: 14 },
  { name: 'Luffy', number: '98', category: 4, series: 15 },
  { name: 'Tanjiro', number: '867', category: 4, series: 16 },
  { name: 'Rick and Morty on Spaceship', number: '32', category: 4, series: 17, type: FunkoTypeUtil.POP_RIDES },
  { name: 'Link', number: '1026', category: 5, series: 18 },
  { name: 'Mario', number: '09', category: 5, series: 19 },
  { name: 'Pikachu', number: '353', category: 5, series: 20 },
  { name: 'Master Chief', number: '07', category: 5, series: 21 },
  { name: 'Kratos', number: '25', category: 5, series: 22, type: FunkoTypeUtil.POP_DELUXE },
];

// Other members' submissions, so the admins' Submissions page has something to review: two waiting (Thanos is
// maybe a double of the catalogue's #78 in Pop! Marvel), one rejected and one merged into the catalogue's Grogu.
// Nobody else sees them, as on the API.
type SeedSubmission = Omit<SeedFunko, 'type' | 'isChase' | 'exclusive'> & {
  // null: an orphan submission, its sender removed.
  submittedById: number | null;
  day: number;
  rejectionReason?: string;
  // The catalogue funko (by name) an admin merged it into.
  mergedInto?: string;
  // Approved by an admin: in the catalogue for everyone.
  isApproved?: boolean;
  // Waiting again after a rejection: reviewed before, sent in again.
  isResent?: boolean;
  // The day an admin last changed it before reviewing it again.
  changedByAdminDay?: number;
};

const HAN_ID = MOCK_SECOND_MEMBER_ID;
const SUBMISSION_REVIEW_DAY = 45;

// Funkos luke and han have in their own collections, so an admin deleting one is asked for a reason.
type SeedOtherUserItem = { userId: number; funkoName: string };

const SEED_OTHER_USERS_ITEMS: SeedOtherUserItem[] = [
  { userId: MOCK_MEMBER_ID, funkoName: 'Grogu' },
  { userId: HAN_ID, funkoName: 'Grogu' },
  { userId: MOCK_MEMBER_ID, funkoName: 'Darth Vader' },
  // The dev sign-in personas' own (mockPersonas.ts), mirroring api/prisma/seed.ts.
  { userId: MOCK_PERSONA_MEMBER_ID, funkoName: 'Darth Vader' },
  { userId: MOCK_READ_ONLY_ADMIN_ID, funkoName: 'Darth Vader' },
  { userId: MOCK_READ_ONLY_MEMBER_ID, funkoName: 'Captain America' },
];

// A funko an admin already removed from the catalogue while han had it: only his notification is left of it.
const REMOVED_FUNKO = {
  name: 'Boba Fett (Prototype)',
  reason: 'A double of Boba Fett #08, which stays in the catalogue',
  holderId: HAN_ID,
};

const SEED_SUBMISSIONS: SeedSubmission[] = [
  { name: 'Thanos (Infinity Gauntlet)', number: '78', category: 1, series: 8, submittedById: MOCK_MEMBER_ID, day: 40 },
  { name: 'Mandalorian with Grogu', number: '402', category: 3, series: 2, submittedById: HAN_ID, day: 42 },
  {
    name: 'Bluey',
    number: '1235',
    category: 4,
    series: 23,
    submittedById: MOCK_MEMBER_ID,
    day: 38,
    rejectionReason: 'The photo is from a shop listing. Please add a photo of your own box.',
  },
  { name: 'Baby Yoda', number: '368', category: 3, series: 2, submittedById: HAN_ID, day: 36, mergedInto: 'Grogu' },
];

// --- Every submission state (issue #38), mirroring api/prisma/seed.ts: rey's in each state a member meets, and an
// orphan submission for the admins' review list. ---
const REY_ID = MOCK_PERSONA_MEMBER_ID;
const STEVE_REJECTION = 'The number on the box is 1300, not 1030. Please check it.';
const HOPPER_REJECTION = 'This one is a Walmart exclusive. Please add the store.';
const PERSONA_SUBMISSIONS: SeedSubmission[] = [
  { name: 'Rey with Lightsaber', number: '307', category: 3, series: 11, submittedById: REY_ID, day: 44 },
  { name: 'BB-8', number: '61', category: 3, series: 11, submittedById: REY_ID, day: 43, isResent: true },
  {
    name: 'Steve Harrington',
    number: '1300',
    category: 2,
    series: 3,
    submittedById: REY_ID,
    day: 39,
    rejectionReason: STEVE_REJECTION,
  },
  {
    name: 'Jim Hopper',
    number: '1241',
    category: 2,
    series: 3,
    submittedById: REY_ID,
    day: 37,
    rejectionReason: HOPPER_REJECTION,
    changedByAdminDay: 46,
  },
  {
    name: 'Darth Vader (Classic)',
    number: '01',
    category: 3,
    series: 11,
    submittedById: REY_ID,
    day: 35,
    mergedInto: 'Darth Vader',
  },
  {
    name: 'Wednesday Addams',
    number: '1309',
    category: 2,
    series: 24,
    submittedById: REY_ID,
    day: 34,
    isApproved: true,
  },
  { name: 'Totoro', number: '1000', category: 4, series: 25, submittedById: null, day: 41 },
];

// Whom a seed notification goes to: the persona admins (leia and lando, not the mock user tests sign in as), or one
// user.
const PERSONA_ADMINS = 'personaAdmins';
const PERSONA_ADMIN_IDS = [MOCK_OTHER_ADMIN_ID, MOCK_READ_ONLY_ADMIN_ID];

type SeedNotification = {
  to: number | typeof PERSONA_ADMINS;
  kind: NotificationKindUtil;
  // The funko it names, by name (a seed funko or a submission); no link when `isGone`.
  funkoName: string;
  isGone?: boolean;
  reason?: string;
  isRead: boolean;
};

// Every notification kind, read and unread, for leia and lando and for rey. Older than the ones above, so those stay
// on top. An admin's approved, rejected and merged ones are from before they were made an admin.
const PERSONA_NOTIFICATIONS: SeedNotification[] = [
  { to: PERSONA_ADMINS, kind: NotificationKindUtil.SUBMISSION_SENT, funkoName: 'Rey with Lightsaber', isRead: false },
  { to: PERSONA_ADMINS, kind: NotificationKindUtil.SUBMISSION_SENT, funkoName: 'Totoro', isRead: true },
  { to: PERSONA_ADMINS, kind: NotificationKindUtil.SUBMISSION_RESENT, funkoName: 'BB-8', isRead: false },
  { to: PERSONA_ADMINS, kind: NotificationKindUtil.SUBMISSION_RESENT, funkoName: 'Jim Hopper', isRead: true },
  {
    to: PERSONA_ADMINS,
    kind: NotificationKindUtil.FUNKO_REMOVED,
    funkoName: 'Groot (Flocked)',
    isGone: true,
    reason: 'Sent in twice: Groot #1203 stays in the catalogue',
    isRead: false,
  },
  { to: PERSONA_ADMINS, kind: NotificationKindUtil.SUBMISSION_APPROVED, funkoName: 'Groot', isRead: true },
  {
    to: PERSONA_ADMINS,
    kind: NotificationKindUtil.SUBMISSION_REJECTED,
    funkoName: 'Groot (Glow)',
    isGone: true,
    reason: 'Not a real variant',
    isRead: true,
  },
  { to: PERSONA_ADMINS, kind: NotificationKindUtil.SUBMISSION_MERGED, funkoName: 'Spider-Man', isRead: false },
  { to: REY_ID, kind: NotificationKindUtil.SUBMISSION_APPROVED, funkoName: 'Wednesday Addams', isRead: false },
  {
    to: REY_ID,
    kind: NotificationKindUtil.SUBMISSION_REJECTED,
    funkoName: 'Steve Harrington',
    reason: STEVE_REJECTION,
    isRead: false,
  },
  {
    to: REY_ID,
    kind: NotificationKindUtil.SUBMISSION_REJECTED,
    funkoName: 'Jim Hopper',
    reason: HOPPER_REJECTION,
    isRead: true,
  },
  { to: REY_ID, kind: NotificationKindUtil.SUBMISSION_MERGED, funkoName: 'Darth Vader', isRead: false },
  {
    to: REY_ID,
    kind: NotificationKindUtil.FUNKO_REMOVED,
    funkoName: 'Boba Fett (Prototype)',
    isGone: true,
    reason: 'A double of Boba Fett #08, which stays in the catalogue',
    isRead: true,
  },
];
// How many hours before the mock clock the first of PERSONA_NOTIFICATIONS was written; each next one an hour older.
const PERSONA_NOTIFICATIONS_HOURS_AGO = 5;

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
// The last seed funko's images were uploaded by a user who has since been deleted: the Images page shows a
// removed user. Every other image is the mock user's.
const REMOVED_UPLOADER_FUNKO_INDEX = SEED_FUNKOS.length - 1;
// Generated funkos (`yarn dev:big`) get one to six images of varied sizes, like a real shelf.
const EXTRA_MAX_IMAGES = 6;
const EXTRA_BASE_IMAGE_BYTES = 120_000;
const EXTRA_IMAGE_BYTES_STEP = 37_000;
const EXTRA_IMAGE_BYTES_SPREAD = 9;
const EXTRA_OWNED_EVERY = 2;
const EXTRA_WISHLIST_EVERY = 7;
const EXTRA_CHASE_EVERY = 11;
const EXTRA_NUMBER_START = 2000;

// The seed is the catalogue, as in the API's seed: approved, with no sender.
const APPROVED_COLUMNS: MockSubmissionColumns = { status: SubmissionStatusUtil.APPROVED, submittedById: null };

// How many generated funkos to add: none in tests and normal mock mode.
const extraFunkoCount = Number(mockEnv.VITE_MOCK_EXTRA_FUNKOS ?? 0) || 0;

// "Iron Man 37": a seed name with a running number, in the seed's category and series, a chase now and
// then. Only for trying long lists; never in tests.
function createExtraFunkos(startId: number, startIndex: number): MockFunkoRow[] {
  return Array.from({ length: extraFunkoCount }, (_, offset) => {
    const seed = SEED_FUNKOS[offset % SEED_FUNKOS.length] ?? SEED_FUNKOS[0];
    const index = startIndex + offset;

    return {
      id: startId + offset,
      name: `${seed?.name ?? 'Funko'} ${offset + 1}`,
      number: String(EXTRA_NUMBER_START + offset),
      type: seed?.type ?? FunkoTypeUtil.POP,
      categoryId: seed?.category ?? 1,
      seriesId: seed?.series ?? 1,
      isChase: offset % EXTRA_CHASE_EVERY === 0,
      exclusive: '',
      barcode: null,
      ...APPROVED_COLUMNS,
      ...NOT_REVIEWED,
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
        uploadedById: MOCK_USER_ID,
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

// Where a seed submission stands: rejected (with a reason), merged (with a target), approved, else still waiting.
function submissionStatusOf(seed: SeedSubmission): SubmissionStatusUtil {
  if (seed.rejectionReason !== undefined) return SubmissionStatusUtil.REJECTED;
  if (seed.mergedInto !== undefined) return SubmissionStatusUtil.MERGED;
  if (seed.isApproved) return SubmissionStatusUtil.APPROVED;

  return SubmissionStatusUtil.WAITING;
}

// The seed catalogue's funko by name (its id is its place in SEED_FUNKOS), for a merged submission's target.
function seedFunkoIdOf(name: string | undefined): number | null {
  const index = SEED_FUNKOS.findIndex((seed) => seed.name === name);

  return index === -1 ? null : index + 1;
}

function seedFunkoNameOf(id: number | null): string | undefined {
  return id === null ? undefined : SEED_FUNKOS[id - 1]?.name;
}

// After every other funko, so the seed's ids (and the generated ones) stay as they were.
function createSubmissions(seeds: SeedSubmission[], startId: number): MockFunkoRow[] {
  return seeds.map((seed, offset) => {
    const status = submissionStatusOf(seed);
    const isReviewed = status !== SubmissionStatusUtil.WAITING || seed.isResent === true;

    return {
      id: startId + offset,
      name: seed.name,
      number: seed.number,
      type: FunkoTypeUtil.POP,
      categoryId: seed.category,
      seriesId: seed.series,
      isChase: false,
      exclusive: '',
      barcode: seed.barcode ?? null,
      status,
      submittedById: seed.submittedById,
      reviewedAt: isReviewed ? mockDate(SUBMISSION_REVIEW_DAY) : null,
      rejectionReason: seed.rejectionReason ?? null,
      changedByAdminAt: seed.changedByAdminDay === undefined ? null : mockDate(seed.changedByAdminDay),
      mergedIntoId: seedFunkoIdOf(seed.mergedInto),
      createdAt: mockDate(seed.day),
      updatedAt: mockDate(seed.day),
    };
  });
}

// What the seed submissions told people, as api/prisma/seed.ts writes them: every admin (the signed-in user and the
// other admins) heard of each one sent in, the oldest and the merged one already read, the sender of the rejected
// one heard why, and the sender of the merged one heard where it went; han also heard of REMOVED_FUNKO.
function createNotifications(submissions: MockFunkoRow[], users: MockUserRow[]): MockNotificationRow[] {
  const adminIds = [MOCK_USER_ID, ...users.filter((user) => user.role === UserRoleUtil.ADMIN).map((user) => user.id)];
  const rows = submissions.flatMap((submission, index): Omit<MockNotificationRow, 'id'>[] => {
    const createdAt = mockRecentDate(FIRST_NOTIFICATION_HOURS_AGO - index);
    const funko = { funkoId: submission.id, funkoName: submission.name, createdAt };
    const toAdmins = adminIds.map((userId) => ({
      userId,
      kind: NotificationKindUtil.SUBMISSION_SENT,
      reason: null,
      isRead: index === 0 || submission.status === SubmissionStatusUtil.MERGED,
      ...funko,
    }));

    if (submission.submittedById === null) return toAdmins;

    if (submission.status === SubmissionStatusUtil.MERGED) {
      const toSender = {
        userId: submission.submittedById,
        kind: NotificationKindUtil.SUBMISSION_MERGED,
        reason: null,
        isRead: false,
        createdAt,
        funkoId: submission.mergedIntoId,
        funkoName: seedFunkoNameOf(submission.mergedIntoId) ?? submission.name,
      };

      return [...toAdmins, toSender];
    }

    if (submission.status !== SubmissionStatusUtil.REJECTED) return toAdmins;

    const toSender = {
      userId: submission.submittedById,
      kind: NotificationKindUtil.SUBMISSION_REJECTED,
      reason: submission.rejectionReason,
      isRead: false,
      ...funko,
    };

    return [...toAdmins, toSender];
  });
  const removal = {
    userId: REMOVED_FUNKO.holderId,
    kind: NotificationKindUtil.FUNKO_REMOVED,
    funkoId: null,
    funkoName: REMOVED_FUNKO.name,
    reason: REMOVED_FUNKO.reason,
    isRead: false,
    createdAt: mockRecentDate(FIRST_NOTIFICATION_HOURS_AGO),
  };

  return [...rows, removal].map((row, index) => ({ id: index + 1, ...row }));
}

// PERSONA_NOTIFICATIONS as rows, numbered on from `startId`, each an hour older than the one before.
function createPersonaNotifications(funkos: MockFunkoRow[], startId: number): MockNotificationRow[] {
  const rows = PERSONA_NOTIFICATIONS.flatMap((seed, index) => {
    const funko = funkos.find((candidate) => candidate.name === seed.funkoName && !candidate.isChase);
    const userIds = seed.to === PERSONA_ADMINS ? PERSONA_ADMIN_IDS : [seed.to];

    return userIds.map((userId) => ({
      userId,
      kind: seed.kind,
      funkoId: seed.isGone ? null : (funko?.id ?? null),
      funkoName: seed.funkoName,
      reason: seed.reason ?? null,
      isRead: seed.isRead,
      createdAt: mockRecentDate(PERSONA_NOTIFICATIONS_HOURS_AGO + index),
    }));
  });

  return rows.map((row, index) => ({ id: startId + index, ...row }));
}

function createOtherUsersItems(funkos: MockFunkoRow[]): MockOtherUserItemRow[] {
  return SEED_OTHER_USERS_ITEMS.map(({ userId, funkoName }) => {
    const funko = funkos.find((candidate) => candidate.name === funkoName);

    if (!funko) throw new Error(`The mock seed has no funko named ${funkoName}`);

    return { userId, funkoId: funko.id };
  });
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
        uploadedById: index === REMOVED_UPLOADER_FUNKO_INDEX ? null : MOCK_USER_ID,
        ...createMockImageUrls(funko.name, index * IMAGES_PER_FUNKO + position),
      };
    }),
  );
}

// Each waiting submission's own photo, uploaded by its sender, so merging one has an image to pick (as the API seed).
function createSubmissionImages(submissions: MockFunkoRow[], startId: number): MockImageRow[] {
  const waiting = submissions.filter((submission) => submission.status === SubmissionStatusUtil.WAITING);

  return waiting.map((submission, offset) => ({
    id: startId + offset,
    funkoId: submission.id,
    position: 0,
    sizeBytes: MOCK_IMAGE_SIZE_BYTES,
    createdAt: submission.createdAt,
    uploadedById: submission.submittedById,
    ...createMockImageUrls(submission.name, startId + offset),
  }));
}

// Every table but auth, fresh: the seed rows, plus the generated ones for `yarn dev:big`.
export function createSeedData(users: MockUserRow[]): MockSeedData {
  const categories = CATEGORY_NAMES.map((name, index) => ({
    id: index + 1,
    name,
    ...APPROVED_COLUMNS,
    createdAt: mockDate(index),
    updatedAt: mockDate(index),
  }));
  const series = SERIES_NAMES.map((name, index) => ({
    id: index + 1,
    name,
    ...APPROVED_COLUMNS,
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
    seriesId: seed.series,
    isChase: seed.isChase ?? false,
    exclusive: seed.exclusive ?? '',
    barcode: seed.barcode ?? null,
    ...APPROVED_COLUMNS,
    ...NOT_REVIEWED,
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
  const submissions = createSubmissions(SEED_SUBMISSIONS, funkos.length + extraFunkos.length + 1);
  const personaSubmissions = createSubmissions(
    PERSONA_SUBMISSIONS,
    funkos.length + extraFunkos.length + submissions.length + 1,
  );
  const allFunkos = [...funkos, ...extraFunkos, ...submissions, ...personaSubmissions];
  const notifications = createNotifications(submissions, users);
  const personaNotifications = createPersonaNotifications(allFunkos, notifications.length + 1);
  const submissionImages = createSubmissionImages(submissions, seedImages.length + extraImages.length + 1);

  return {
    categories,
    series,
    tags,
    collections,
    funkos: allFunkos,
    images: [...seedImages, ...extraImages, ...submissionImages],
    items: [...items, ...extraItems],
    otherUsersItems: createOtherUsersItems(funkos),
    notifications: [...notifications, ...personaNotifications],
  };
}
