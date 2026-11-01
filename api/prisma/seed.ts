// Development data. Run with: yarn db:seed
import { randomBytes } from 'node:crypto';
import { env } from '../src/config/env.ts';
import { clearUploads, generateImage, processImage } from '../src/lib/imageStorage.ts';
import { logger } from '../src/lib/logger.ts';
import { hashPassword } from '../src/lib/passwordHash.ts';
import { prisma } from '../src/lib/prisma.ts';
import type { Prisma } from '../src/generated/prisma/client.ts';
import type { ItemCondition } from '../src/modules/collections/items/collectionItems.type.ts';
import type { FunkoType } from '../src/modules/funkos/funkos.type.ts';

type SeedFunko = {
  name: string;
  number: string;
  category: string;
  series?: string;
  type?: FunkoType;
  isChase?: boolean;
  exclusive?: string;
};
// Other members' submissions, so the admins' Submissions page has something to review: two waiting (the Thanos is
// maybe a double of the catalogue's #78 in Pop! Marvel), each with a photo of its sender's, one rejected with its
// reason and one merged. Mirrors web/src/mocks/mockSeed.ts.
type SeedSubmission = {
  name: string;
  number: string;
  category: string;
  sender: string;
  rejectionReason?: string;
  // The catalogue funko (by name, the regular one) an admin merged it into.
  mergedInto?: string;
};
type SeedItem = {
  funko: string;
  collection: string;
  quantity?: number;
  condition?: ItemCondition;
  priceCents?: number;
  purchasedAt?: string;
  tags?: string[];
  notes?: string;
};

const CATEGORY_NAMES = ['Pop! Marvel', 'Pop! Television', 'Pop! Star Wars', 'Pop! Animation', 'Pop! Games'];
const SERIES_NAMES = ['Daredevil: Born Again', 'The Mandalorian', 'Stranger Things'];
// Every user has "Owned" and "Wishlist" from the moment they exist (a trigger in the collections_per_user
// migration): the seed keeps them and only fills the first user's.
const OWNED_COLLECTION_NAME = 'Owned';
const REFERENCE_COLLECTION_NAMES = [OWNED_COLLECTION_NAME, 'Wishlist'];
const WEBAUTHN_USER_ID_BYTES = 32;
const TAG_NAMES = ['Box 1', 'Box 2', 'Display shelf'];
const HOUR_MS = 60 * 60 * 1000;
// Members who sent funkos in. No password or passkey: an admin gives one a temporary password on the Users page to
// sign in as them. Found by username, so seeding again keeps them (and their collections).
const SEED_MEMBER_USERNAMES = ['luke', 'han'];
const SUBMISSIONS: SeedSubmission[] = [
  { name: 'Thanos (Infinity Gauntlet)', number: '78', category: 'Pop! Marvel', sender: 'luke' },
  { name: 'Mandalorian with Grogu', number: '402', category: 'Pop! Star Wars', sender: 'han' },
  {
    name: 'Bluey',
    number: '1235',
    category: 'Pop! Animation',
    sender: 'luke',
    rejectionReason: 'The photo is from a shop listing. Please add a photo of your own box.',
  },
  { name: 'Baby Yoda', number: '368', category: 'Pop! Star Wars', sender: 'han', mergedInto: 'Grogu' },
];

// A funko an admin already removed from the catalogue while han had it: only his notification is left of it.
const REMOVED_FUNKO = {
  name: 'Boba Fett (Prototype)',
  reason: 'A double of Boba Fett #08, which stays in the catalogue',
  holder: 'han',
};

// --- Personas (issue #38): one seeded user per set of UI states, all signing in with DEV_PASSWORD (the dev sign-in
// picker on the web's sign-in page fills it in). Mirrors web/src/mocks/mockUsers.ts and
// web/src/common/utils/devSignInUtils.ts. Found by username, so seeding again resets their role, read-only setting and
// password. On a fresh database leia is the first user (an admin who owns the example items) and, lando being
// read-only, the last admin who can make changes. ---
// Kept in step with web/src/common/utils/devPasswordUtils.ts. 22 characters and not on the common list.
const DEV_PASSWORD = 'funko-dev-password-123';
const TEMPORARY_PASSWORD_LIFETIME_MS = 7 * 24 * HOUR_MS;

type SeedPersona = {
  username: string;
  role: Prisma.UserCreateInput['role'];
  isReadOnly: boolean;
  // Must replace DEV_PASSWORD on first sign-in (lands on /set-password).
  hasTemporaryPassword: boolean;
};

const FIRST_PERSONA = 'leia';
const SEED_PERSONAS: SeedPersona[] = [
  { username: FIRST_PERSONA, role: 'ADMIN', isReadOnly: false, hasTemporaryPassword: false },
  { username: 'rey', role: 'MEMBER', isReadOnly: false, hasTemporaryPassword: false },
  { username: 'poe', role: 'MEMBER', isReadOnly: true, hasTemporaryPassword: false },
  { username: 'lando', role: 'ADMIN', isReadOnly: true, hasTemporaryPassword: false },
  { username: 'finn', role: 'MEMBER', isReadOnly: false, hasTemporaryPassword: true },
];
const PERSONA_ADMINS = ['leia', 'lando'];
const TO_PERSONA_ADMINS = 'admins';

// rey's submissions in every state a member meets, and an orphan submission (no sender) for the review list.
type SeedPersonaSubmission = {
  name: string;
  number: string;
  category: string;
  sender: string | null;
  status: NonNullable<Prisma.FunkoCreateManyInput['status']>;
  rejectionReason?: string;
  mergedInto?: string;
  // Waiting again after a rejection: reviewed before.
  isResent?: boolean;
  isChangedByAdmin?: boolean;
};

const STEVE_REJECTION = 'The number on the box is 1300, not 1030. Please check it.';
const HOPPER_REJECTION = 'This one is a Walmart exclusive. Please add the store.';
const PERSONA_SUBMISSIONS: SeedPersonaSubmission[] = [
  { name: 'Rey with Lightsaber', number: '307', category: 'Pop! Star Wars', sender: 'rey', status: 'WAITING' },
  { name: 'BB-8', number: '61', category: 'Pop! Star Wars', sender: 'rey', status: 'WAITING', isResent: true },
  {
    name: 'Steve Harrington',
    number: '1300',
    category: 'Pop! Television',
    sender: 'rey',
    status: 'REJECTED',
    rejectionReason: STEVE_REJECTION,
  },
  {
    name: 'Jim Hopper',
    number: '1241',
    category: 'Pop! Television',
    sender: 'rey',
    status: 'REJECTED',
    rejectionReason: HOPPER_REJECTION,
    isChangedByAdmin: true,
  },
  {
    name: 'Darth Vader (Classic)',
    number: '01',
    category: 'Pop! Star Wars',
    sender: 'rey',
    status: 'MERGED',
    mergedInto: 'Darth Vader',
  },
  { name: 'Wednesday Addams', number: '1309', category: 'Pop! Television', sender: 'rey', status: 'APPROVED' },
  { name: 'Totoro', number: '1000', category: 'Pop! Animation', sender: null, status: 'WAITING' },
];

// Every notification kind, read and unread, for leia and lando ("admins") and for rey. An admin's approved, rejected
// and merged ones are from before they were made an admin. `funko` names a catalogue funko or a submission; none when
// it is gone.
type SeedPersonaNotification = {
  // A persona's username, or TO_PERSONA_ADMINS.
  to: string;
  kind: Prisma.NotificationCreateManyInput['kind'];
  funkoName: string;
  isGone?: boolean;
  reason?: string;
  isRead: boolean;
};

const PERSONA_NOTIFICATIONS: SeedPersonaNotification[] = [
  { to: TO_PERSONA_ADMINS, kind: 'SUBMISSION_SENT', funkoName: 'Rey with Lightsaber', isRead: false },
  { to: TO_PERSONA_ADMINS, kind: 'SUBMISSION_SENT', funkoName: 'Totoro', isRead: true },
  { to: TO_PERSONA_ADMINS, kind: 'SUBMISSION_RESENT', funkoName: 'BB-8', isRead: false },
  { to: TO_PERSONA_ADMINS, kind: 'SUBMISSION_RESENT', funkoName: 'Jim Hopper', isRead: true },
  {
    to: TO_PERSONA_ADMINS,
    kind: 'FUNKO_REMOVED',
    funkoName: 'Groot (Flocked)',
    isGone: true,
    reason: 'Sent in twice: Groot #1203 stays in the catalogue',
    isRead: false,
  },
  { to: TO_PERSONA_ADMINS, kind: 'SUBMISSION_APPROVED', funkoName: 'Groot', isRead: true },
  {
    to: TO_PERSONA_ADMINS,
    kind: 'SUBMISSION_REJECTED',
    funkoName: 'Groot (Glow)',
    isGone: true,
    reason: 'Not a real variant',
    isRead: true,
  },
  { to: TO_PERSONA_ADMINS, kind: 'SUBMISSION_MERGED', funkoName: 'Spider-Man', isRead: false },
  { to: 'rey', kind: 'SUBMISSION_APPROVED', funkoName: 'Wednesday Addams', isRead: false },
  { to: 'rey', kind: 'SUBMISSION_REJECTED', funkoName: 'Steve Harrington', reason: STEVE_REJECTION, isRead: false },
  { to: 'rey', kind: 'SUBMISSION_REJECTED', funkoName: 'Jim Hopper', reason: HOPPER_REJECTION, isRead: true },
  { to: 'rey', kind: 'SUBMISSION_MERGED', funkoName: 'Darth Vader', isRead: false },
  {
    to: 'rey',
    kind: 'FUNKO_REMOVED',
    funkoName: REMOVED_FUNKO.name,
    isGone: true,
    reason: REMOVED_FUNKO.reason,
    isRead: true,
  },
];

// Items in the personas' and members' own "Owned", so an admin deleting Darth Vader or Grogu meets a funko other users
// have. Mirrors the mock seed's other users' items.
type SeedPersonaItem = { username: string; funko: string };

const PERSONA_ITEMS: SeedPersonaItem[] = [
  { username: 'luke', funko: 'Grogu' },
  { username: 'han', funko: 'Grogu' },
  { username: 'luke', funko: 'Darth Vader' },
  { username: 'rey', funko: 'Darth Vader' },
  { username: 'rey', funko: 'Rey with Lightsaber' },
  { username: 'lando', funko: 'Darth Vader' },
  { username: 'poe', funko: 'Captain America' },
];
// --- end of the persona constants ---

// Example catalog rows; numbers are illustrative, not a price guide.
const FUNKOS: SeedFunko[] = [
  { name: 'Spider-Man', number: '03', category: 'Pop! Marvel' },
  { name: 'Iron Man', number: '04', category: 'Pop! Marvel' },
  { name: 'Captain America', number: '06', category: 'Pop! Marvel' },
  { name: 'Deadpool', number: '20', category: 'Pop! Marvel' },
  { name: 'Thanos', number: '78', category: 'Pop! Marvel' },
  { name: 'Thanos', number: '78', category: 'Pop! Marvel', isChase: true },
  { name: 'Groot', number: '1203', category: 'Pop! Marvel' },
  { name: 'Spider-Man (Integrated Suit)', number: '913', category: 'Pop! Marvel', exclusive: 'Walmart' },
  { name: 'Daredevil', number: '1406', category: 'Pop! Marvel', series: 'Daredevil: Born Again' },
  { name: 'Kingpin', number: '1408', category: 'Pop! Marvel', series: 'Daredevil: Born Again' },
  { name: 'Eleven', number: '421', category: 'Pop! Television', series: 'Stranger Things' },
  { name: 'Eddie Munson', number: '1250', category: 'Pop! Television', series: 'Stranger Things' },
  { name: 'Dustin', number: '424', category: 'Pop! Television', series: 'Stranger Things' },
  { name: 'Vecna', number: '1312', category: 'Pop! Television', series: 'Stranger Things' },
  { name: 'Walter White', number: '162', category: 'Pop! Television' },
  { name: 'Darth Vader', number: '01', category: 'Pop! Star Wars' },
  { name: 'Boba Fett', number: '08', category: 'Pop! Star Wars' },
  { name: 'Grogu', number: '368', category: 'Pop! Star Wars', series: 'The Mandalorian' },
  { name: 'The Mandalorian', number: '345', category: 'Pop! Star Wars', series: 'The Mandalorian' },
  { name: 'Ahsoka Tano', number: '464', category: 'Pop! Star Wars' },
  { name: 'Darth Maul', number: '09', category: 'Pop! Star Wars', exclusive: 'SDCC 2024' },
  { name: 'Goku', number: '09', category: 'Pop! Animation' },
  { name: 'Super Saiyan Goku', number: '14', category: 'Pop! Animation' },
  { name: 'Naruto', number: '71', category: 'Pop! Animation' },
  { name: 'Luffy', number: '98', category: 'Pop! Animation' },
  { name: 'Tanjiro', number: '867', category: 'Pop! Animation' },
  { name: 'Rick and Morty on Spaceship', number: '32', category: 'Pop! Animation', type: 'POP_RIDES' },
  { name: 'Link', number: '1026', category: 'Pop! Games' },
  { name: 'Mario', number: '09', category: 'Pop! Games' },
  { name: 'Pikachu', number: '353', category: 'Pop! Games' },
  { name: 'Master Chief', number: '07', category: 'Pop! Games' },
  { name: 'Kratos', number: '25', category: 'Pop! Games', type: 'POP_DELUXE' },
];

const ITEMS: SeedItem[] = [
  {
    funko: 'Spider-Man',
    collection: 'Owned',
    condition: 'MINT_IN_BOX',
    priceCents: 1499,
    purchasedAt: '2024-03-02',
    tags: ['Display shelf'],
  },
  {
    funko: 'Iron Man',
    collection: 'Owned',
    condition: 'MINT_IN_BOX',
    priceCents: 1299,
    purchasedAt: '2024-03-02',
    tags: ['Box 1'],
  },
  {
    funko: 'Deadpool',
    collection: 'Owned',
    quantity: 2,
    condition: 'MINT_IN_BOX',
    priceCents: 1599,
    purchasedAt: '2024-05-18',
    tags: ['Box 1'],
  },
  {
    funko: 'Thanos',
    collection: 'Owned',
    condition: 'OUT_OF_BOX',
    priceCents: 999,
    purchasedAt: '2023-11-11',
    tags: ['Display shelf'],
    notes: 'Box recycled',
  },
  {
    funko: 'Eleven',
    collection: 'Owned',
    condition: 'MINT_IN_BOX',
    priceCents: 1499,
    purchasedAt: '2024-07-20',
    tags: ['Box 2'],
  },
  {
    funko: 'Eddie Munson',
    collection: 'Owned',
    condition: 'MINT_IN_BOX',
    priceCents: 1799,
    purchasedAt: '2024-07-20',
    tags: ['Box 2'],
  },
  {
    funko: 'Darth Vader',
    collection: 'Owned',
    condition: 'BOX_DAMAGED',
    priceCents: 899,
    purchasedAt: '2022-12-24',
    tags: ['Box 1'],
    notes: 'Corner dent',
  },
  {
    funko: 'Grogu',
    collection: 'Owned',
    condition: 'MINT_IN_BOX',
    priceCents: 1499,
    purchasedAt: '2023-06-01',
    tags: ['Display shelf'],
  },
  {
    funko: 'The Mandalorian',
    collection: 'Owned',
    condition: 'MINT_IN_BOX',
    priceCents: 1499,
    purchasedAt: '2023-06-01',
    tags: ['Display shelf'],
  },
  {
    funko: 'Goku',
    collection: 'Owned',
    condition: 'MINT_IN_BOX',
    priceCents: 1399,
    purchasedAt: '2024-01-15',
    tags: ['Box 2'],
  },
  {
    funko: 'Naruto',
    collection: 'Owned',
    condition: 'MINT_IN_BOX',
    priceCents: 1399,
    purchasedAt: '2024-01-15',
    tags: ['Box 2'],
  },
  {
    funko: 'Link',
    collection: 'Owned',
    condition: 'MINT_IN_BOX',
    priceCents: 1599,
    purchasedAt: '2024-09-09',
    tags: ['Display shelf'],
  },
  {
    funko: 'Pikachu',
    collection: 'Owned',
    condition: 'MINT_IN_BOX',
    priceCents: 1299,
    purchasedAt: '2024-09-09',
    tags: ['Box 1'],
  },
  {
    funko: 'Kratos',
    collection: 'Owned',
    condition: 'MINT_IN_BOX',
    priceCents: 2499,
    purchasedAt: '2025-02-14',
    tags: ['Display shelf'],
  },
  {
    funko: 'Rick and Morty on Spaceship',
    collection: 'Owned',
    condition: 'MINT_IN_BOX',
    priceCents: 2999,
    purchasedAt: '2025-02-14',
    tags: ['Box 2'],
  },
  { funko: 'Vecna', collection: 'Wishlist' },
  { funko: 'Ahsoka Tano', collection: 'Wishlist' },
  { funko: 'Luffy', collection: 'Wishlist' },
  { funko: 'Master Chief', collection: 'Wishlist' },
  { funko: 'Groot', collection: 'Wishlist', notes: 'Wait for a sale' },
];

// Where an example submission stands: rejected (with a reason), merged (with a target), else still waiting.
function submissionStatusOf(submission: SeedSubmission): 'WAITING' | 'REJECTED' | 'MERGED' {
  if (submission.rejectionReason !== undefined) return 'REJECTED';
  if (submission.mergedInto !== undefined) return 'MERGED';

  return 'WAITING';
}

const IMAGES_PER_FUNKO = 2;
const SEED_IMAGE_PX = 900;
const HUE_STEP = 37;
const HUE_MAX = 360;
const SEED_SATURATION = 70;
const SEED_LIGHTNESS = 55;

if (env.NODE_ENV === 'production') {
  throw new Error('Refusing to seed a production database');
}

// One delete per table, children first, and the uploads folder with them. Users, sign-in data and every user's
// reference collections are left alone; every notification goes, since the funkos they name go.
await prisma.$transaction([
  prisma.notification.deleteMany(),
  prisma.collectionItemTag.deleteMany(),
  prisma.collectionItem.deleteMany(),
  prisma.funkoImage.deleteMany(),
  prisma.funko.deleteMany(),
  prisma.series.deleteMany(),
  prisma.collection.deleteMany({ where: { name: { notIn: REFERENCE_COLLECTION_NAMES } } }),
  prisma.tag.deleteMany(),
  prisma.category.deleteMany(),
]);
await clearUploads();

const NAME_SELECT = { id: true, name: true } as const;

// A name in the seed lists above that has no row is a typo there: stop with a clear message, not a foreign-key error.
function idFor(ids: Map<string, number>, kind: string, name: string): number {
  const id = ids.get(name);

  if (id === undefined) throw new Error(`Seed data names an unknown ${kind}: "${name}"`);

  return id;
}

const categoryRows = await prisma.category.createManyAndReturn({
  data: CATEGORY_NAMES.map((name) => ({ name })),
  select: NAME_SELECT,
});
const categoryIds = new Map(categoryRows.map((row) => [row.name, row.id]));

const seriesRows = await prisma.series.createManyAndReturn({
  data: SERIES_NAMES.map((name) => ({ name })),
  select: NAME_SELECT,
});
const seriesIds = new Map(seriesRows.map((row) => [row.name, row.id]));

const funkoRows = await prisma.funko.createManyAndReturn({
  data: FUNKOS.map((funko) => ({
    name: funko.name,
    number: funko.number,
    type: funko.type ?? 'POP',
    categoryId: idFor(categoryIds, 'category', funko.category),
    seriesId: funko.series ? idFor(seriesIds, 'series', funko.series) : null,
    isChase: funko.isChase ?? false,
    exclusive: funko.exclusive ?? '',
  })),
  select: { id: true, name: true, isChase: true },
});
// Items reference the regular (non-chase) figure by name.
const funkoIds = new Map(funkoRows.filter((row) => !row.isChase).map((row) => [row.name, row.id]));

// The first user owns the example items. With nobody set up yet (no user, or only the one the collections_per_user
// migration makes, with no way to sign in), that is leia, the first persona: an admin who signs in with DEV_PASSWORD,
// so the app counts as set up. `yarn auth:reset` prints a setup link to give her a passkey instead.
const devPasswordHash = await hashPassword(DEV_PASSWORD);
const leiaSignIn = {
  name: FIRST_PERSONA,
  username: FIRST_PERSONA,
  passwordHash: devPasswordHash,
  role: 'ADMIN' as const,
};
const firstUser = await prisma.user.findFirst({
  orderBy: { id: 'asc' },
  select: { id: true, username: true, passwordHash: true, _count: { select: { passkeys: true } } },
});
const isUnclaimed =
  firstUser !== null &&
  firstUser.username === null &&
  firstUser.passwordHash === null &&
  firstUser._count.passkeys === 0;
async function claimFirstUser(): Promise<{ id: number }> {
  if (firstUser === null) {
    return prisma.user.create({
      data: { ...leiaSignIn, webauthnUserId: randomBytes(WEBAUTHN_USER_ID_BYTES).toString('base64url') },
      select: { id: true },
    });
  }

  if (!isUnclaimed) return firstUser;

  return prisma.user.update({ where: { id: firstUser.id }, data: leiaSignIn, select: { id: true } });
}

const seedUser = await claimFirstUser();

const memberRows = await Promise.all(
  SEED_MEMBER_USERNAMES.map((username) =>
    prisma.user.upsert({
      where: { username },
      update: {},
      create: { name: username, username, webauthnUserId: randomBytes(WEBAUTHN_USER_ID_BYTES).toString('base64url') },
      select: { id: true, username: true },
    }),
  ),
);
const memberIds = new Map(memberRows.map((row) => [row.username ?? '', row.id]));

// --- Personas (issue #38): before the notifications below, so leia and lando hear of the members' submissions too.
const personaRows = await Promise.all(
  SEED_PERSONAS.map((persona) => {
    const standing = {
      role: persona.role,
      isReadOnly: persona.isReadOnly,
      passwordHash: devPasswordHash,
      temporaryPasswordExpiresAt: persona.hasTemporaryPassword
        ? new Date(Date.now() + TEMPORARY_PASSWORD_LIFETIME_MS)
        : null,
    };

    return prisma.user.upsert({
      where: { username: persona.username },
      update: standing,
      create: {
        name: persona.username,
        username: persona.username,
        webauthnUserId: randomBytes(WEBAUTHN_USER_ID_BYTES).toString('base64url'),
        ...standing,
      },
      select: { id: true, username: true },
    });
  }),
);
const personaIds = new Map(personaRows.map((row) => [row.username ?? '', row.id]));
// ---

const submissionRows = await prisma.funko.createManyAndReturn({
  data: SUBMISSIONS.map((submission) => {
    const isRejected = submission.rejectionReason !== undefined;
    const isMerged = submission.mergedInto !== undefined;

    return {
      name: submission.name,
      number: submission.number,
      categoryId: idFor(categoryIds, 'category', submission.category),
      status: submissionStatusOf(submission),
      submittedById: idFor(memberIds, 'member', submission.sender),
      rejectionReason: submission.rejectionReason ?? null,
      mergedIntoId: submission.mergedInto ? idFor(funkoIds, 'funko', submission.mergedInto) : null,
      reviewedAt: isRejected || isMerged ? new Date() : null,
    };
  }),
  select: NAME_SELECT,
});

// What the submissions above would have told people: every admin heard of each one sent in (the oldest and the merged
// one already read), the sender of the rejected one heard why, and the sender of the merged one heard where it went;
// han also heard of REMOVED_FUNKO. Mirrors web/src/mocks/mockSeed.ts.
const submissionIds = new Map(submissionRows.map((row) => [row.name, row.id]));
const adminRows = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
const notificationRows = await prisma.notification.createManyAndReturn({
  data: SUBMISSIONS.flatMap((submission, index): Prisma.NotificationCreateManyInput[] => {
    const funko = { funkoId: idFor(submissionIds, 'submission', submission.name), funkoName: submission.name };
    const sentAt = new Date(Date.now() - (SUBMISSIONS.length - index) * HOUR_MS);
    const toAdmins = adminRows.map((admin) => ({
      userId: admin.id,
      kind: 'SUBMISSION_SENT' as const,
      ...funko,
      readAt: index === 0 || submission.mergedInto !== undefined ? sentAt : null,
      createdAt: sentAt,
    }));

    const senderId = idFor(memberIds, 'member', submission.sender);

    if (submission.mergedInto !== undefined) {
      const target = { funkoId: idFor(funkoIds, 'funko', submission.mergedInto), funkoName: submission.mergedInto };

      return [...toAdmins, { userId: senderId, kind: 'SUBMISSION_MERGED' as const, ...target }];
    }

    if (submission.rejectionReason === undefined) return toAdmins;

    const toSender = {
      userId: senderId,
      kind: 'SUBMISSION_REJECTED' as const,
      ...funko,
      reason: submission.rejectionReason,
    };

    return [...toAdmins, toSender];
  }),
  select: { id: true },
});
const removalRows = await prisma.notification.createManyAndReturn({
  data: [
    {
      userId: idFor(memberIds, 'member', REMOVED_FUNKO.holder),
      kind: 'FUNKO_REMOVED' as const,
      funkoId: null,
      funkoName: REMOVED_FUNKO.name,
      reason: REMOVED_FUNKO.reason,
    },
  ],
  select: { id: true },
});

// --- Personas (issue #38): rey's submissions in every state, an orphan, every notification kind and the items that
// make Darth Vader and Grogu funkos other users have.
const catalogueIds = new Map([...funkoIds, ...submissionIds]);
const personaSubmissionRows = await prisma.funko.createManyAndReturn({
  data: PERSONA_SUBMISSIONS.map((submission) => {
    const isReviewed = submission.status !== 'WAITING' || submission.isResent === true;

    return {
      name: submission.name,
      number: submission.number,
      categoryId: idFor(categoryIds, 'category', submission.category),
      status: submission.status,
      submittedById: submission.sender === null ? null : idFor(personaIds, 'persona', submission.sender),
      rejectionReason: submission.rejectionReason ?? null,
      mergedIntoId: submission.mergedInto ? idFor(funkoIds, 'funko', submission.mergedInto) : null,
      reviewedAt: isReviewed ? new Date() : null,
      changedByAdminAt: submission.isChangedByAdmin ? new Date() : null,
    };
  }),
  select: NAME_SELECT,
});

for (const row of personaSubmissionRows) catalogueIds.set(row.name, row.id);

const personaAdminIds = PERSONA_ADMINS.map((username) => idFor(personaIds, 'persona', username));
// Older than the members' notifications above, an hour apart, so those stay on top.
const PERSONA_NOTIFICATIONS_HOURS_AGO = SUBMISSIONS.length + 1;
const personaNotificationRows = await prisma.notification.createManyAndReturn({
  data: PERSONA_NOTIFICATIONS.flatMap((notification, index): Prisma.NotificationCreateManyInput[] => {
    const createdAt = new Date(Date.now() - (PERSONA_NOTIFICATIONS_HOURS_AGO + index) * HOUR_MS);
    const userIds =
      notification.to === TO_PERSONA_ADMINS ? personaAdminIds : [idFor(personaIds, 'persona', notification.to)];
    const funkoId = notification.isGone ? null : idFor(catalogueIds, 'funko', notification.funkoName);

    return userIds.map((userId) => ({
      userId,
      kind: notification.kind,
      funkoId,
      funkoName: notification.funkoName,
      reason: notification.reason ?? null,
      readAt: notification.isRead ? createdAt : null,
      createdAt,
    }));
  }),
  select: { id: true },
});

const ownedByUser = new Map(
  (
    await prisma.collection.findMany({
      where: { name: OWNED_COLLECTION_NAME, user: { username: { in: PERSONA_ITEMS.map((item) => item.username) } } },
      select: { id: true, user: { select: { username: true } } },
    })
  ).map((row) => [row.user.username ?? '', row.id]),
);

await prisma.collectionItem.createMany({
  data: PERSONA_ITEMS.map((item) => ({
    collectionId: idFor(ownedByUser, 'Owned collection of', item.username),
    funkoId: idFor(catalogueIds, 'funko', item.funko),
  })),
});
// ---

const collectionRows = await prisma.collection.findMany({ where: { userId: seedUser.id }, select: NAME_SELECT });
const collectionIds = new Map(collectionRows.map((row) => [row.name, row.id]));

for (const name of REFERENCE_COLLECTION_NAMES) {
  if (!collectionIds.has(name)) throw new Error(`The "${name}" collection is missing: run yarn db:migrate first`);
}

// Tags belong to a user too: the example ones are the first user's, like the items they go on.
const tagRows = await prisma.tag.createManyAndReturn({
  data: TAG_NAMES.map((name) => ({ name, userId: seedUser.id })),
  select: NAME_SELECT,
});
const tagIds = new Map(tagRows.map((row) => [row.name, row.id]));

for (const item of ITEMS) {
  const itemTagIds = (item.tags ?? []).map((name) => idFor(tagIds, 'tag', name));

  await prisma.collectionItem.create({
    data: {
      collectionId: idFor(collectionIds, 'collection', item.collection),
      funkoId: idFor(funkoIds, 'funko', item.funko),
      quantity: item.quantity ?? 1,
      condition: item.condition ?? null,
      purchasePriceCents: item.priceCents ?? null,
      purchasedAt: item.purchasedAt ?? null,
      notes: item.notes ?? null,
      itemTags: { create: itemTagIds.map((tagId) => ({ tagId })) },
    },
  });
}

// Solid-colour placeholders through the real pipeline, so dev lists have thumbnails of the right shape.
function seedImage(hue: number): Promise<Buffer> {
  return generateImage({
    width: SEED_IMAGE_PX,
    height: SEED_IMAGE_PX,
    background: `hsl(${hue}, ${SEED_SATURATION}%, ${SEED_LIGHTNESS}%)`,
  });
}

let imageCount = 0;

for (const [index, row] of funkoRows.entries()) {
  for (let position = 0; position < IMAGES_PER_FUNKO; position += 1) {
    const hue = (index * HUE_STEP + position * (HUE_MAX / IMAGES_PER_FUNKO)) % HUE_MAX;
    const stored = await processImage(row.id, await seedImage(hue));

    await prisma.funkoImage.create({ data: { funkoId: row.id, uploadedById: seedUser.id, position, ...stored } });
    imageCount += 1;
  }
}

// Each waiting submission's own photo, uploaded by its sender, so merging one has an image to pick. Mirrors
// web/src/mocks/mockSeed.ts.
for (const [index, submission] of SUBMISSIONS.entries()) {
  const row = submissionRows.find((candidate) => candidate.name === submission.name);
  const isWaiting = submissionStatusOf(submission) === 'WAITING';

  if (!row || !isWaiting) continue;

  const stored = await processImage(row.id, await seedImage((index * HUE_STEP) % HUE_MAX));

  await prisma.funkoImage.create({
    data: { funkoId: row.id, uploadedById: idFor(memberIds, 'member', submission.sender), position: 0, ...stored },
  });
  imageCount += 1;
}

logger.info(
  {
    categories: categoryRows.length,
    series: seriesRows.length,
    funkos: funkoRows.length,
    members: memberRows.length,
    personas: personaRows.length,
    submissions: submissionRows.length + personaSubmissionRows.length,
    notifications: notificationRows.length + removalRows.length + personaNotificationRows.length,
    collections: collectionRows.length,
    tags: tagRows.length,
    items: ITEMS.length + PERSONA_ITEMS.length,
    images: imageCount,
  },
  'seeded',
);

await prisma.$disconnect();
