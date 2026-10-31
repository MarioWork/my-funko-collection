// Row factories for tests. Each test creates its own data through these; nothing is shared between tests.
import type { InjectOptions, LightMyRequestResponse } from 'fastify';
import { randomBytes } from 'node:crypto';
import type { App } from './app.ts';
import { normaliseBarcode } from './lib/barcode.ts';
import { generateImage, type GeneratedImageOptions } from './lib/imageStorage.ts';
import type { SignInMethod, UserRole } from './generated/prisma/client.ts';
import { prisma } from './lib/prisma.ts';
import { createSecureToken, hashSecureToken } from './lib/secureToken.ts';
import { SESSION_COOKIE_NAME } from './lib/sessionCookie.ts';
import type { ItemCondition } from './modules/collections/items/collectionItems.type.ts';
import type { FunkoType } from './modules/funkos/funkos.type.ts';

let sequence = 0;

function nextName(prefix: string): string {
  sequence += 1;

  return `${prefix} ${String(sequence).padStart(3, '0')}`;
}

export async function createCategory(name = nextName('Category')): Promise<{ id: number; name: string }> {
  return prisma.category.create({ data: { name }, select: { id: true, name: true } });
}

export async function createSeries(name = nextName('Series')): Promise<{ id: number; name: string }> {
  return prisma.series.create({ data: { name }, select: { id: true, name: true } });
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

  return prisma.funko.create({
    data: {
      name: overrides.name ?? nextName('Funko'),
      number: overrides.number ?? String(sequence),
      categoryId,
      seriesId: overrides.seriesId ?? null,
      type: overrides.type ?? 'POP',
      isChase: overrides.isChase ?? false,
      exclusive: overrides.exclusive ?? '',
      // Stored the way the service stores it, so lookups by either barcode form find the row.
      barcode: overrides.barcode ? normaliseBarcode(overrides.barcode) : null,
    },
    select: { id: true, name: true, categoryId: true, seriesId: true },
  });
}

export async function createCollection(
  overrides: { name?: string; isDefault?: boolean; notes?: string | null } = {},
): Promise<{ id: number; name: string }> {
  return prisma.collection.create({
    data: {
      name: overrides.name ?? nextName('Collection'),
      isDefault: overrides.isDefault ?? false,
      notes: overrides.notes ?? null,
    },
    select: { id: true, name: true },
  });
}

export async function createTag(name = nextName('Tag')): Promise<{ id: number; name: string }> {
  return prisma.tag.create({ data: { name }, select: { id: true, name: true } });
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
  const item = await prisma.collectionItem.create({
    data: {
      collectionId,
      funkoId,
      quantity: overrides.quantity ?? 1,
      condition: overrides.condition ?? null,
      purchasePriceCents: overrides.purchasePriceCents ?? null,
      purchasedAt: overrides.purchasedAt ?? null,
      notes: overrides.notes ?? null,
    },
    select: { id: true },
  });
  const tagIds = overrides.tagIds ?? [];

  if (tagIds.length > 0) {
    await prisma.collectionItemTag.createMany({ data: tagIds.map((tagId) => ({ collectionItemId: item.id, tagId })) });
  }

  return item;
}

type ImageOptions = Partial<GeneratedImageOptions>;

const DEFAULT_IMAGE_WIDTH = 64;
const DEFAULT_IMAGE_HEIGHT = 48;

// Drops a funko's image rows but leaves their files on disk: the state a crash between the two would leave.
export async function forgetImageRows(funkoId: number): Promise<void> {
  await prisma.funkoImage.deleteMany({ where: { funkoId } });
}

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

const TEST_USER_NAME = 'Tester';
const RANDOM_ID_BYTES = 32;

export type SignedInClient = {
  userId: number;
  token: string;
  inject: (options: InjectOptions) => Promise<LightMyRequestResponse>;
};

const TEST_USER_NAMES: Record<UserRole, string> = { ADMIN: TEST_USER_NAME, MEMBER: 'Member' };

// The test user of a role, made once per database: one admin, and one member for the admin-only checks.
async function findOrCreateTestUser(role: UserRole): Promise<{ id: number }> {
  const existing = await prisma.user.findFirst({ where: { role }, select: { id: true } });

  if (existing) return existing;

  return prisma.user.create({
    data: { name: TEST_USER_NAMES[role], role, webauthnUserId: randomBytes(RANDOM_ID_BYTES).toString('base64url') },
    select: { id: true },
  });
}

// A passkey row with a made-up key: enough for sessions to point at, it can't sign anything.
export async function createPasskeyRow(
  userId: number,
  name = nextName('Passkey'),
): Promise<{ id: number; credentialId: string }> {
  return prisma.passkey.create({
    data: {
      credentialId: randomBytes(RANDOM_ID_BYTES).toString('base64url'),
      userId,
      name,
      publicKey: randomBytes(RANDOM_ID_BYTES),
      counter: 0,
      transports: ['internal'],
      isSynced: true,
    },
    select: { id: true, credentialId: true },
  });
}

// A user with a live session, straight in the database (no passkey ceremony): `inject` sends its cookie.
// `signedInAt` / `lastSeenAt` backdate the session, for the "signed in recently" and timeout rules.
// `signInMethod` PASSWORD opens it without a passkey; PASSKEY (the default) makes a passkey row to open it.
// `role` MEMBER signs in as the member instead of the admin (the default).
export async function signIn(
  app: App,
  options: { signedInAt?: Date; lastSeenAt?: Date; signInMethod?: SignInMethod; role?: UserRole } = {},
): Promise<SignedInClient> {
  const user = await findOrCreateTestUser(options.role ?? 'ADMIN');
  const signInMethod = options.signInMethod ?? 'PASSKEY';
  const passkey = signInMethod === 'PASSKEY' ? await createPasskeyRow(user.id) : undefined;
  const token = createSecureToken();
  const signedInAt = options.signedInAt ?? new Date();
  const lastSeenAt = options.lastSeenAt ?? signedInAt;

  await prisma.session.create({
    data: {
      tokenHash: hashSecureToken(token),
      userId: user.id,
      signInMethod,
      passkeyId: passkey?.id ?? null,
      signedInAt,
      lastSeenAt,
    },
  });

  return {
    userId: user.id,
    token,
    inject: (injectOptions) =>
      app.inject({ ...injectOptions, cookies: { ...injectOptions.cookies, [SESSION_COOKIE_NAME]: token } }),
  };
}
