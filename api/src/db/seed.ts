// Development data. Run with: yarn db:seed
import { rm } from 'node:fs/promises';
import sharp from 'sharp';
import { env } from '../config/env.ts';
import { processImage } from '../lib/imageStorage.ts';
import { logger } from '../lib/logger.ts';
import { applyPragmas, client, db } from './client.ts';
import {
  categories,
  collectionItems,
  collectionItemTags,
  collections,
  funkoImages,
  funkos,
  tags,
  type FunkoType,
  type ItemCondition,
} from './schema/index.ts';

type SeedFunko = {
  name: string;
  number: string;
  category: string;
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

const CATEGORY_NAMES = ['Pop! Marvel', 'Pop! Television', 'Star Wars', 'Pop! Animation', 'Pop! Games'];
const COLLECTIONS: { name: string; isDefault: boolean; notes: string | null }[] = [
  { name: 'Owned', isDefault: true, notes: 'Everything on the shelves and in the boxes' },
  { name: 'Wishlist', isDefault: false, notes: 'Next buys' },
];
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
  { name: 'Eleven', number: '421', category: 'Pop! Television' },
  { name: 'Eddie Munson', number: '1250', category: 'Pop! Television' },
  { name: 'Dustin', number: '424', category: 'Pop! Television' },
  { name: 'Vecna', number: '1312', category: 'Pop! Television' },
  { name: 'Walter White', number: '162', category: 'Pop! Television' },
  { name: 'Darth Vader', number: '01', category: 'Star Wars' },
  { name: 'Boba Fett', number: '08', category: 'Star Wars' },
  { name: 'Grogu', number: '368', category: 'Star Wars' },
  { name: 'The Mandalorian', number: '345', category: 'Star Wars' },
  { name: 'Ahsoka Tano', number: '464', category: 'Star Wars' },
  { name: 'Darth Maul', number: '09', category: 'Star Wars', exclusive: 'SDCC 2024' },
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

await applyPragmas(client);

// One delete per table, children first, and the uploads folder with them.
await db.delete(collectionItemTags);
await db.delete(collectionItems);
await db.delete(funkoImages);
await db.delete(funkos);
await db.delete(collections);
await db.delete(tags);
await db.delete(categories);
await rm(env.UPLOADS_DIR, { recursive: true, force: true });

const categoryRows = await db
  .insert(categories)
  .values(CATEGORY_NAMES.map((name) => ({ name })))
  .returning({ id: categories.id, name: categories.name });
const categoryIds = new Map(categoryRows.map((row) => [row.name, row.id]));

const funkoRows = await db
  .insert(funkos)
  .values(
    FUNKOS.map((funko) => ({
      name: funko.name,
      number: funko.number,
      type: funko.type ?? 'POP',
      categoryId: categoryIds.get(funko.category) ?? 0,
      isChase: funko.isChase ?? false,
      exclusive: funko.exclusive ?? '',
    })),
  )
  .returning({ id: funkos.id, name: funkos.name, isChase: funkos.isChase });
// Items reference the regular (non-chase) figure by name.
const funkoIds = new Map(funkoRows.filter((row) => !row.isChase).map((row) => [row.name, row.id]));

const collectionRows = await db
  .insert(collections)
  .values(COLLECTIONS)
  .returning({ id: collections.id, name: collections.name });
const collectionIds = new Map(collectionRows.map((row) => [row.name, row.id]));

const tagRows = await db
  .insert(tags)
  .values(TAG_NAMES.map((name) => ({ name })))
  .returning({ id: tags.id, name: tags.name });
const tagIds = new Map(tagRows.map((row) => [row.name, row.id]));

for (const item of ITEMS) {
  const inserted = await db
    .insert(collectionItems)
    .values({
      collectionId: collectionIds.get(item.collection) ?? 0,
      funkoId: funkoIds.get(item.funko) ?? 0,
      quantity: item.quantity ?? 1,
      condition: item.condition ?? null,
      purchasePriceCents: item.priceCents ?? null,
      purchasedAt: item.purchasedAt ?? null,
      notes: item.notes ?? null,
    })
    .returning({ id: collectionItems.id })
    .get();
  const itemTagIds = (item.tags ?? []).map((name) => tagIds.get(name) ?? 0);

  if (itemTagIds.length > 0) {
    await db.insert(collectionItemTags).values(itemTagIds.map((tagId) => ({ collectionItemId: inserted.id, tagId })));
  }
}

// Solid-colour placeholders through the real pipeline, so dev lists have thumbnails of the right shape.
function seedImage(hue: number): Promise<Buffer> {
  return sharp({
    create: {
      width: SEED_IMAGE_PX,
      height: SEED_IMAGE_PX,
      channels: 3,
      background: `hsl(${hue}, ${SEED_SATURATION}%, ${SEED_LIGHTNESS}%)`,
    },
  })
    .png()
    .toBuffer();
}

let imageCount = 0;

for (const [index, row] of funkoRows.entries()) {
  for (let position = 0; position < IMAGES_PER_FUNKO; position += 1) {
    const hue = (index * HUE_STEP + position * (HUE_MAX / IMAGES_PER_FUNKO)) % HUE_MAX;
    const stored = await processImage(row.id, await seedImage(hue));

    await db.insert(funkoImages).values({ funkoId: row.id, position, ...stored });
    imageCount += 1;
  }
}

logger.info(
  {
    categories: categoryRows.length,
    funkos: funkoRows.length,
    collections: collectionRows.length,
    tags: tagRows.length,
    items: ITEMS.length,
    images: imageCount,
  },
  'seeded',
);

client.close();
