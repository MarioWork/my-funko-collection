// Row factories for tests. Each test creates its own data through these; nothing is shared between tests.
import { db } from './db/client.ts';
import {
  categories,
  collectionItems,
  collectionItemTags,
  collections,
  funkos,
  series,
  tags,
  type FunkoType,
  type ItemCondition,
} from './db/schema/index.ts';
import { normaliseBarcode } from './lib/barcode.ts';
import { generateImage, type GeneratedImageOptions } from './lib/imageStorage.ts';

let sequence = 0;

function nextName(prefix: string): string {
  sequence += 1;

  return `${prefix} ${String(sequence).padStart(3, '0')}`;
}

export async function createCategory(name = nextName('Category')): Promise<{ id: number; name: string }> {
  return db.insert(categories).values({ name }).returning({ id: categories.id, name: categories.name }).get();
}

export async function createSeries(name = nextName('Series')): Promise<{ id: number; name: string }> {
  return db.insert(series).values({ name }).returning({ id: series.id, name: series.name }).get();
}

type FunkoOverrides = {
  name?: string;
  number?: string;
  categoryId?: number;
  seriesId?: number | null;
  type?: FunkoType;
  isChase?: boolean;
  exclusive?: string;
  barcode?: string | null;
};

export async function createFunko(
  overrides: FunkoOverrides = {},
): Promise<{ id: number; name: string; categoryId: number; seriesId: number | null }> {
  const categoryId = overrides.categoryId ?? (await createCategory()).id;

  return db
    .insert(funkos)
    .values({
      name: overrides.name ?? nextName('Funko'),
      number: overrides.number ?? String(sequence),
      categoryId,
      seriesId: overrides.seriesId ?? null,
      type: overrides.type ?? 'POP',
      isChase: overrides.isChase ?? false,
      exclusive: overrides.exclusive ?? '',
      // Stored the way the service stores it, so lookups by either barcode form find the row.
      barcode: overrides.barcode ? normaliseBarcode(overrides.barcode) : null,
    })
    .returning({ id: funkos.id, name: funkos.name, categoryId: funkos.categoryId, seriesId: funkos.seriesId })
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

type ImageOptions = Partial<GeneratedImageOptions>;

const DEFAULT_IMAGE_WIDTH = 64;
const DEFAULT_IMAGE_HEIGHT = 48;

// A generated image; `noise: true` makes it incompressible, for size-limit tests.
export async function makeImage(options: ImageOptions = {}): Promise<Buffer> {
  return generateImage({ width: DEFAULT_IMAGE_WIDTH, height: DEFAULT_IMAGE_HEIGHT, ...options });
}

export function toFormData(files: { buffer: Buffer; name?: string; field?: string }[]): FormData {
  const form = new FormData();

  for (const file of files) {
    form.append(file.field ?? 'file', new Blob([new Uint8Array(file.buffer)]), file.name ?? 'photo.png');
  }

  return form;
}
