import { copyFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { buildApp, type App } from '../../app.ts';
import { prepareTestDb, resetTestDb } from '../../db/testDb.ts';
import { funkoFolder } from '../../lib/imageStorage.ts';
import { createFunko, makeImage, toFormData } from '../../testFixtures.ts';

const URL = '/images';
const LOOSE_FILE_NAME = 'leftover.webp';

type ImageEntry = {
  key: string;
  id: number | null;
  funko: { name: string } | null;
  fileName: string;
  isMain: boolean;
  sizeBytes: number;
  variantCount: number;
  width: number | null;
};
type ListBody = { data: ImageEntry[]; totalResultNumber: number };
type ImageGroupBody = {
  key: string;
  funko: { name: string } | null;
  imageCount: number;
  sizeBytes: number;
  images: ImageEntry[];
};
type GroupListBody = { data: ImageGroupBody[]; totalResultNumber: number };

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

async function uploadImage(funkoId: number, width = 64): Promise<void> {
  await app.inject({
    method: 'POST',
    url: `/funkos/${funkoId}/images`,
    payload: toFormData([{ buffer: await makeImage({ width, noise: true }) }]),
  });
}

// Two images on Eleven (the first is the main one), one on Groot, and a loose file in Groot's folder that no row uses.
async function seedImages() {
  const eleven = await createFunko({ name: 'Eleven' });
  const groot = await createFunko({ name: 'Groot' });
  await uploadImage(eleven.id, 64);
  await uploadImage(eleven.id, 200);
  await uploadImage(groot.id, 120);

  const grootFolder = funkoFolder(groot.id);
  const [grootLarge] = (await readdir(grootFolder)).filter((file) => !file.includes('.md.') && !file.includes('.sm.'));
  await copyFile(join(grootFolder, grootLarge ?? ''), join(grootFolder, LOOSE_FILE_NAME));

  return { eleven, groot };
}

describe('GET /images', () => {
  it('lists every image row with its funko, plus loose files with none', async () => {
    await seedImages();

    const response = await app.inject({ method: 'GET', url: URL });

    expect(response.statusCode).toBe(200);
    const body = response.json<ListBody>();
    expect(body.totalResultNumber).toBe(4);
    const loose = body.data.filter((entry) => entry.funko === null);
    expect(loose).toHaveLength(1);
    expect(loose[0]).toMatchObject({ id: null, fileName: LOOSE_FILE_NAME, variantCount: 1, isMain: false });
    expect(loose[0]?.width).toBeGreaterThan(0);
    const mains = body.data.filter((entry) => entry.isMain).map((entry) => entry.funko?.name);
    expect(mains.sort()).toEqual(['Eleven', 'Groot']);
  });

  it('keeps only the loose files with hasFunko=false and only rows with true', async () => {
    await seedImages();

    const loose = await app.inject({ method: 'GET', url: URL, query: { hasFunko: 'false' } });
    const linked = await app.inject({ method: 'GET', url: URL, query: { hasFunko: 'true' } });

    expect(loose.json<ListBody>().data.map((entry) => entry.fileName)).toEqual([LOOSE_FILE_NAME]);
    expect(linked.json<ListBody>().totalResultNumber).toBe(3);
  });

  it('searches the funko name and the file name', async () => {
    await seedImages();

    const byFunko = await app.inject({ method: 'GET', url: URL, query: { q: 'elev' } });
    const byFile = await app.inject({ method: 'GET', url: URL, query: { q: 'leftover' } });

    expect(byFunko.json<ListBody>().data.map((entry) => entry.funko?.name)).toEqual(['Eleven', 'Eleven']);
    expect(byFile.json<ListBody>().data.map((entry) => entry.fileName)).toEqual([LOOSE_FILE_NAME]);
  });

  it('sorts by size in either direction and pages the result', async () => {
    await seedImages();

    const ascending = await app.inject({
      method: 'GET',
      url: URL,
      query: { sorting_fields: 'SIZE', direction: 'ASC' },
    });
    const descending = await app.inject({
      method: 'GET',
      url: URL,
      query: { sorting_fields: 'SIZE', direction: 'DESC', size: '2', page: '2' },
    });

    const sizes = ascending.json<ListBody>().data.map((entry) => entry.sizeBytes);
    expect(sizes).toEqual([...sizes].sort((first, second) => first - second));
    const secondPage = descending.json<ListBody>();
    expect(secondPage.data).toHaveLength(2);
    expect(secondPage.data.map((entry) => entry.sizeBytes)).toEqual(sizes.slice(0, 2).reverse());
  });

  it('groups by funko with counts and total sizes, biggest first, loose files last', async () => {
    await seedImages();

    const response = await app.inject({ method: 'GET', url: `${URL}/groups` });

    expect(response.statusCode).toBe(200);
    const body = response.json<GroupListBody>();
    expect(body.totalResultNumber).toBe(3);
    expect(body.data.map((group) => group.funko?.name ?? group.key)).toEqual(['Eleven', 'Groot', 'loose']);
    const [eleven] = body.data;
    expect(eleven?.imageCount).toBe(2);
    expect(eleven?.sizeBytes).toBe(eleven?.images.reduce((total, image) => total + image.sizeBytes, 0));
  });

  it('filters and searches before grouping', async () => {
    await seedImages();

    const response = await app.inject({ method: 'GET', url: `${URL}/groups`, query: { q: 'groot', hasFunko: 'true' } });

    expect(response.json<GroupListBody>().data.map((group) => group.funko?.name)).toEqual(['Groot']);
  });

  it('rejects an unknown sort field with VALIDATION_ERROR', async () => {
    const response = await app.inject({ method: 'GET', url: URL, query: { sorting_fields: 'COLOUR' } });

    expect(response.statusCode).toBe(400);
    expect(response.json<{ code: string }>().code).toBe('VALIDATION_ERROR');
  });
});
