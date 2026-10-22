// Row factories for tests. Each test creates its own data through these; nothing is shared between tests.
import sharp from 'sharp';
import { db } from './db/client.ts';
import {
  categories,
  collectionItems,
  collectionItemTags,
  collections,
  funkos,
  tags,
  type FunkoType,
  type ItemCondition,
} from './db/schema/index.ts';
import { normaliseBarcode } from './lib/barcode.ts';

let sequence = 0;

function nextName(prefix: string): string {
  sequence += 1;

  return `${prefix} ${String(sequence).padStart(3, '0')}`;
}

export async function createCategory(name = nextName('Category')): Promise<{ id: number; name: string }> {
  return db.insert(categories).values({ name }).returning({ id: categories.id, name: categories.name }).get();
}

type FunkoOverrides = {
  name?: string;
  number?: string;
  categoryId?: number;
  type?: FunkoType;
  isChase?: boolean;
  exclusive?: string;
  barcode?: string | null;
};

export async function createFunko(
  overrides: FunkoOverrides = {},
): Promise<{ id: number; name: string; categoryId: number }> {
  const categoryId = overrides.categoryId ?? (await createCategory()).id;

  return db
    .insert(funkos)
    .values({
      name: overrides.name ?? nextName('Funko'),
      number: overrides.number ?? String(sequence),
      categoryId,
      type: overrides.type ?? 'POP',
      isChase: overrides.isChase ?? false,
      exclusive: overrides.exclusive ?? '',
      // Stored the way the service stores it, so lookups by either barcode form find the row.
      barcode: overrides.barcode ? normaliseBarcode(overrides.barcode) : null,
    })
    .returning({ id: funkos.id, name: funkos.name, categoryId: funkos.categoryId })
    .get();
}

export async function createCollection(
  overrides: { name?: string; isDefault?: boolean; notes?: string | null } = {},
): Promise<{ id: number; name: string }> {
  return db
    .insert(collections)
    .values({
      name: overrides.name ?? nextName('Collection'),
      isDefault: overrides.isDefault ?? false,
      notes: overrides.notes ?? null,
    })
    .returning({ id: collections.id, name: collections.name })
    .get();
}

export async function createTag(name = nextName('Tag')): Promise<{ id: number; name: string }> {
  return db.insert(tags).values({ name }).returning({ id: tags.id, name: tags.name }).get();
}

type ItemOverrides = {
  quantity?: number;
  condition?: ItemCondition | null;
  purchasePriceCents?: number | null;
  purchasedAt?: string | null;
  notes?: string | null;
  tagIds?: number[];
};

export async function createItem(
  collectionId: number,
  funkoId: number,
  overrides: ItemOverrides = {},
): Promise<{ id: number }> {
  const item = await db
    .insert(collectionItems)
    .values({
      collectionId,
      funkoId,
      quantity: overrides.quantity ?? 1,
      condition: overrides.condition ?? null,
      purchasePriceCents: overrides.purchasePriceCents ?? null,
      purchasedAt: overrides.purchasedAt ?? null,
      notes: overrides.notes ?? null,
    })
    .returning({ id: collectionItems.id })
    .get();
  const tagIds = overrides.tagIds ?? [];

  if (tagIds.length > 0) {
    await db.insert(collectionItemTags).values(tagIds.map((tagId) => ({ collectionItemId: item.id, tagId })));
  }

  return item;
}

type ImageOptions = { width?: number; height?: number; format?: 'png' | 'jpeg'; orientation?: number; noise?: boolean };

// A generated image; `noise: true` makes it incompressible, for size-limit tests.
export async function makeImage(options: ImageOptions = {}): Promise<Buffer> {
  const width = options.width ?? 64;
  const height = options.height ?? 48;
  const base = options.noise
    ? sharp(Buffer.from(Array.from({ length: width * height * 3 }, () => Math.floor(Math.random() * 256))), {
        raw: { width, height, channels: 3 },
      })
    : sharp({ create: { width, height, channels: 3, background: '#4466aa' } });
  const withOrientation = options.orientation ? base.withMetadata({ orientation: options.orientation }) : base;

  return options.format === 'jpeg' ? withOrientation.jpeg().toBuffer() : withOrientation.png().toBuffer();
}

export function toFormData(files: { buffer: Buffer; name?: string; field?: string }[]): FormData {
  const form = new FormData();

  for (const file of files) {
    form.append(file.field ?? 'file', new Blob([new Uint8Array(file.buffer)]), file.name ?? 'photo.png');
  }

  return form;
}
