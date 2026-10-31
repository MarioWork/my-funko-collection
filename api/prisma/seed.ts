// Development data. Run with: yarn db:seed
import { randomBytes } from 'node:crypto';
import { env } from '../src/config/env.ts';
import { clearUploads, generateImage, processImage } from '../src/lib/imageStorage.ts';
import { logger } from '../src/lib/logger.ts';
import { prisma } from '../src/lib/prisma.ts';
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
const REFERENCE_COLLECTION_NAMES = ['Owned', 'Wishlist'];
// Who owns the example items when nobody is set up yet. No password or passkey: the first setup signs in as them.
const SEED_USER_NAME = 'Collector';
const WEBAUTHN_USER_ID_BYTES = 32;
const TAG_NAMES = ['Box 1', 'Box 2', 'Display shelf'];

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
// reference collections are left alone.
await prisma.$transaction([
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

// The first user owns the example items. With nobody set up yet, a user with no way to sign in is made for them.
const owner =
  (await prisma.user.findFirst({ orderBy: { id: 'asc' }, select: { id: true } })) ??
  (await prisma.user.create({
    data: { name: SEED_USER_NAME, webauthnUserId: randomBytes(WEBAUTHN_USER_ID_BYTES).toString('base64url') },
    select: { id: true },
  }));

const collectionRows = await prisma.collection.findMany({ where: { userId: owner.id }, select: NAME_SELECT });
const collectionIds = new Map(collectionRows.map((row) => [row.name, row.id]));

for (const name of REFERENCE_COLLECTION_NAMES) {
  if (!collectionIds.has(name)) throw new Error(`The "${name}" collection is missing: run yarn db:migrate first`);
}

const tagRows = await prisma.tag.createManyAndReturn({
  data: TAG_NAMES.map((name) => ({ name })),
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

    await prisma.funkoImage.create({ data: { funkoId: row.id, position, ...stored } });
    imageCount += 1;
  }
}

logger.info(
  {
    categories: categoryRows.length,
    series: seriesRows.length,
    funkos: funkoRows.length,
    collections: collectionRows.length,
    tags: tagRows.length,
    items: ITEMS.length,
    images: imageCount,
  },
  'seeded',
);

await prisma.$disconnect();
