import { access, stat } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { buildApp, type App } from '../../../app.ts';
import { env } from '../../../config/env.ts';
import { prepareTestDb, resetTestDb } from '../../../db/testDb.ts';
import { funkoFolder } from '../../../lib/imageStorage.ts';
import { createFunko, makeImage, toFormData } from '../../../testFixtures.ts';

const MISSING_ID = 999;
const MAX_PLACEHOLDER_BYTES = 1024;
const OVERSIZE_PX = 1100;

type ImageBody = {
  id: number;
  url: string;
  mediumUrl: string;
  smallUrl: string;
  placeholder: string;
  width: number;
  height: number;
  position: number;
};

let app: App;

beforeAll(async () => {
  app = await buildApp();
  await prepareTestDb();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await resetTestDb();
});

function imagesUrl(funkoId: number): string {
  return `/funkos/${funkoId}/images`;
}

async function upload(funkoId: number, buffers: Buffer[]) {
  return app.inject({
    method: 'POST',
    url: imagesUrl(funkoId),
    payload: toFormData(buffers.map((buffer) => ({ buffer }))),
  });
}

function filePath(url: string): string {
  return join(env.UPLOADS_DIR, url.replace('/uploads/', ''));
}

async function dimensionsOf(url: string): Promise<{ width: number; height: number }> {
  const metadata = await sharp(filePath(url)).metadata();

  return { width: metadata.width, height: metadata.height };
}

describe('POST /funkos/:funkoId/images', () => {
  it('stores three WebP variants, caps the large one and keeps the placeholder tiny', async () => {
    const funko = await createFunko();

    const response = await upload(funko.id, [await makeImage({ width: 4000, height: 3000, format: 'jpeg' })]);

    expect(response.statusCode).toBe(201);
    const [image] = response.json<ImageBody[]>();
    expect(image).toMatchObject({ width: 2000, height: 1500, position: 0 });
    expect(await dimensionsOf(image?.url ?? '')).toEqual({ width: 2000, height: 1500 });
    expect(await dimensionsOf(image?.mediumUrl ?? '')).toEqual({ width: 1200, height: 900 });
    expect(await dimensionsOf(image?.smallUrl ?? '')).toEqual({ width: 480, height: 360 });
    expect(image?.placeholder.startsWith('data:image/webp;base64,')).toBe(true);
    expect(image?.placeholder.length).toBeLessThan(MAX_PLACEHOLDER_BYTES);
  });

  it('never enlarges a small input and drops its metadata', async () => {
    const funko = await createFunko();

    const response = await upload(funko.id, [await makeImage({ width: 300, height: 200 })]);

    const [image] = response.json<ImageBody[]>();
    expect(image).toMatchObject({ width: 300, height: 200 });
    const metadata = await sharp(filePath(image?.url ?? '')).metadata();
    expect(metadata.exif).toBeUndefined();
  });

  it('applies the EXIF orientation so a sideways phone photo lands upright', async () => {
    const funko = await createFunko();
    const sideways = await makeImage({ width: 600, height: 400, format: 'jpeg', orientation: 6 });

    const response = await upload(funko.id, [sideways]);

    const [image] = response.json<ImageBody[]>();
    expect(image).toMatchObject({ width: 400, height: 600 });
  });

  it('numbers several files in one request in order', async () => {
    const funko = await createFunko();

    const response = await upload(funko.id, [
      await makeImage({ width: 64, height: 64 }),
      await makeImage({ width: 65, height: 64 }),
    ]);

    expect(response.statusCode).toBe(201);
    expect(response.json<ImageBody[]>().map((image) => image.position)).toEqual([0, 1]);
  });

  it('returns 409 with the existing id when the same bytes are uploaded twice', async () => {
    const funko = await createFunko();
    const photo = await makeImage();
    const first = await upload(funko.id, [photo]);

    const second = await upload(funko.id, [photo]);

    expect(second.statusCode).toBe(409);
    expect(second.json()).toMatchObject({ code: 'CONFLICT', existingId: first.json<ImageBody[]>()[0]?.id });
  });

  it('returns 400 when the file is not an image', async () => {
    const funko = await createFunko();

    const response = await app.inject({
      method: 'POST',
      url: imagesUrl(funko.id),
      payload: toFormData([{ buffer: Buffer.from('not an image'), name: 'fake.png' }]),
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR', message: 'Not a supported image' });
  });

  it('returns 413 with PAYLOAD_TOO_LARGE when a file is over the limit', async () => {
    const funko = await createFunko();

    const response = await upload(funko.id, [
      await makeImage({ width: OVERSIZE_PX, height: OVERSIZE_PX, noise: true }),
    ]);

    expect(response.statusCode).toBe(413);
    expect(response.json()).toMatchObject({ code: 'PAYLOAD_TOO_LARGE' });
  });

  it('returns 400 when the funko would hold more than the allowed number of images', async () => {
    const funko = await createFunko();
    await upload(funko.id, [await makeImage({ width: 10, height: 10 }), await makeImage({ width: 11, height: 10 })]);

    const response = await upload(funko.id, [
      await makeImage({ width: 12, height: 10 }),
      await makeImage({ width: 13, height: 10 }),
    ]);

    expect(response.statusCode).toBe(400);
  });

  it('returns 404 when the funko does not exist', async () => {
    const response = await upload(MISSING_ID, [await makeImage()]);

    expect(response.statusCode).toBe(404);
  });
});

describe('GET /uploads/...', () => {
  it('serves the variant with a one-year immutable cache header', async () => {
    const funko = await createFunko();
    const [image] = (await upload(funko.id, [await makeImage()])).json<ImageBody[]>();

    const response = await app.inject({ method: 'GET', url: image?.smallUrl ?? '' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toBe('image/webp');
    expect(response.headers['cache-control']).toBe('public, max-age=31536000, immutable');
  });
});

describe('POST /funkos/:funkoId/images/from-url', () => {
  it('refuses a URL that points at the local machine', async () => {
    const funko = await createFunko();

    const response = await app.inject({
      method: 'POST',
      url: `${imagesUrl(funko.id)}/from-url`,
      payload: { url: 'http://127.0.0.1:9/photo.jpg' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('rejects a non-http URL in validation', async () => {
    const funko = await createFunko();

    const response = await app.inject({
      method: 'POST',
      url: `${imagesUrl(funko.id)}/from-url`,
      payload: { url: 'ftp://example.com/photo.jpg' },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe('PATCH /funkos/:funkoId/images/order', () => {
  it('makes the first listed image the primary one', async () => {
    const funko = await createFunko();
    const [first, second] = (
      await upload(funko.id, [await makeImage({ width: 20, height: 20 }), await makeImage({ width: 21, height: 20 })])
    ).json<ImageBody[]>();

    const response = await app.inject({
      method: 'PATCH',
      url: `${imagesUrl(funko.id)}/order`,
      payload: { imageIds: [second?.id, first?.id] },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json<ImageBody[]>().map((image) => image.id)).toEqual([second?.id, first?.id]);
    const detail = await app.inject({ method: 'GET', url: `/funkos/${funko.id}` });
    expect(detail.json<{ primaryImage: { smallUrl: string } }>().primaryImage.smallUrl).toBe(second?.smallUrl);
  });

  it('returns 400 when the list does not name every image exactly once', async () => {
    const funko = await createFunko();
    const [first] = (await upload(funko.id, [await makeImage()])).json<ImageBody[]>();

    const response = await app.inject({
      method: 'PATCH',
      url: `${imagesUrl(funko.id)}/order`,
      payload: { imageIds: [first?.id, MISSING_ID] },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe('POST /funkos/:funkoId/images/:imageId/rotate', () => {
  it('rotates the image, gives it new URLs and removes the old files', async () => {
    const funko = await createFunko();
    const [image] = (await upload(funko.id, [await makeImage({ width: 300, height: 200 })])).json<ImageBody[]>();

    const response = await app.inject({
      method: 'POST',
      url: `${imagesUrl(funko.id)}/${image?.id}/rotate`,
      payload: { degrees: 90 },
    });

    expect(response.statusCode).toBe(200);
    const rotated = response.json<ImageBody>();
    expect(rotated).toMatchObject({ id: image?.id, width: 200, height: 300 });
    expect(rotated.url).not.toBe(image?.url);
    await expect(access(filePath(image?.url ?? ''))).rejects.toThrow();
    expect((await stat(filePath(rotated.url))).size).toBeGreaterThan(0);
  });

  it('returns 400 for an unsupported angle', async () => {
    const funko = await createFunko();
    const [image] = (await upload(funko.id, [await makeImage()])).json<ImageBody[]>();

    const response = await app.inject({
      method: 'POST',
      url: `${imagesUrl(funko.id)}/${image?.id}/rotate`,
      payload: { degrees: 45 },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe('DELETE /funkos/:funkoId/images/:imageId', () => {
  it('removes the row and the three files', async () => {
    const funko = await createFunko();
    const [image] = (await upload(funko.id, [await makeImage()])).json<ImageBody[]>();

    const response = await app.inject({ method: 'DELETE', url: `${imagesUrl(funko.id)}/${image?.id}` });

    expect(response.statusCode).toBe(204);
    for (const url of [image?.url, image?.mediumUrl, image?.smallUrl]) {
      await expect(access(filePath(url ?? ''))).rejects.toThrow();
    }
    const detail = await app.inject({ method: 'GET', url: `/funkos/${funko.id}` });
    expect(detail.json<{ images: unknown[] }>().images).toEqual([]);
    expect(await access(funkoFolder(funko.id)).then(() => true)).toBe(true);
  });

  it('returns 404 when the image does not exist', async () => {
    const funko = await createFunko();

    const response = await app.inject({ method: 'DELETE', url: `${imagesUrl(funko.id)}/${MISSING_ID}` });

    expect(response.statusCode).toBe(404);
  });
});
