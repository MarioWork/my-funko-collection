import { access } from 'node:fs/promises';
import { buildApp, type App } from '../../app.ts';
import { prepareTestDb, resetTestDb } from '../../db/testDb.ts';
import { funkoFolder } from '../../lib/imageStorage.ts';
import {
  createCategory,
  createCollection,
  createFunko,
  createItem,
  createSeries,
  createTag,
  makeImage,
  toFormData,
} from '../../testFixtures.ts';

const URL = '/funkos';
const MISSING_ID = 999;
// Typed and scanned as UPC-A (12 digits); stored and returned as EAN-13 (a leading zero).
const BARCODE = '889698624008';
const STORED_BARCODE = `0${BARCODE}`;

type FunkoBody = { id: number; name: string; number: string; matchedOn?: string[]; collections: { name: string }[] };
type ListBody = { data: FunkoBody[]; totalResultNumber: number; currentPage: number };

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

function names(body: ListBody): string[] {
  return body.data.map((funko) => funko.name);
}

async function seedCatalog() {
  const marvel = await createCategory('Pop! Marvel');
  const starWars = await createCategory('Star Wars');
  const spiderMan = await createFunko({ name: 'Spider-Man', number: '03', categoryId: marvel.id, barcode: BARCODE });
  const thanos = await createFunko({ name: 'Thanos', number: '78', categoryId: marvel.id });
  const thanosChase = await createFunko({ name: 'Thanos', number: '78', categoryId: marvel.id, isChase: true });
  const vader = await createFunko({
    name: 'Darth Vader',
    number: '01',
    categoryId: starWars.id,
    exclusive: 'SDCC 2024',
  });
  const owned = await createCollection({ name: 'Owned', isDefault: true });
  const wishlist = await createCollection({ name: 'Wishlist' });
  const box = await createTag('Box 3');
  await createItem(owned.id, spiderMan.id, { tagIds: [box.id] });
  await createItem(owned.id, vader.id);
  await createItem(wishlist.id, thanos.id);

  return { marvel, starWars, spiderMan, thanos, thanosChase, vader, owned, wishlist, box };
}

describe('GET /funkos', () => {
  it('lists every funko by name when no params are sent', async () => {
    await seedCatalog();

    const response = await app.inject({ method: 'GET', url: URL });

    expect(response.statusCode).toBe(200);
    const body = response.json<ListBody>();
    expect(names(body)).toEqual(['Darth Vader', 'Spider-Man', 'Thanos', 'Thanos']);
    expect(body.totalResultNumber).toBe(4);
    expect(body.data[1]?.collections.map((collection) => collection.name)).toEqual(['Owned']);
  });

  it('finds funkos through a tag name with q and reports the matched field', async () => {
    await seedCatalog();

    const response = await app.inject({ method: 'GET', url: URL, query: { q: 'box' } });

    const body = response.json<ListBody>();
    expect(names(body)).toEqual(['Spider-Man']);
    expect(body.data[0]?.matchedOn).toEqual(['TAG']);
  });

  it('matches every word of q somewhere: a collection name and a category name', async () => {
    await seedCatalog();

    const response = await app.inject({ method: 'GET', url: URL, query: { q: 'wishlist marvel' } });

    const body = response.json<ListBody>();
    expect(names(body)).toEqual(['Thanos']);
    expect(body.data[0]?.matchedOn).toEqual(expect.arrayContaining(['COLLECTION', 'CATEGORY']));
  });

  it('matches a box number written with a hash and an exclusive sticker text', async () => {
    await seedCatalog();

    const byNumber = await app.inject({ method: 'GET', url: URL, query: { q: '#01' } });
    const byExclusive = await app.inject({ method: 'GET', url: URL, query: { q: 'sdcc' } });

    expect(names(byNumber.json<ListBody>())).toEqual(['Darth Vader']);
    expect(names(byExclusive.json<ListBody>())).toEqual(['Darth Vader']);
  });

  it('tightens q with named params that are all ANDed', async () => {
    const { marvel } = await seedCatalog();

    const response = await app.inject({
      method: 'GET',
      url: URL,
      query: { q: 'thanos', categoryId: String(marvel.id), isChase: 'true' },
    });

    const body = response.json<ListBody>();
    expect(body.totalResultNumber).toBe(1);
    expect(body.data[0]).toMatchObject({ name: 'Thanos', isChase: true });
  });

  it('filters by tag id, collection name and category name without q', async () => {
    const { box } = await seedCatalog();

    const byTag = await app.inject({ method: 'GET', url: URL, query: { tagId: String(box.id) } });
    const byCollection = await app.inject({ method: 'GET', url: URL, query: { collection: 'owned' } });
    const byCategory = await app.inject({ method: 'GET', url: URL, query: { category: 'star' } });

    expect(names(byTag.json<ListBody>())).toEqual(['Spider-Man']);
    expect(names(byCollection.json<ListBody>())).toEqual(['Darth Vader', 'Spider-Man']);
    expect(names(byCategory.json<ListBody>())).toEqual(['Darth Vader']);
  });

  it('lists what is not in a collection yet with notInCollectionId', async () => {
    const { owned } = await seedCatalog();

    const response = await app.inject({ method: 'GET', url: URL, query: { notInCollectionId: String(owned.id) } });

    expect(names(response.json<ListBody>())).toEqual(['Thanos', 'Thanos']);
  });

  it('lists funkos in no collection and funkos with no tags', async () => {
    await seedCatalog();

    const inNone = await app.inject({ method: 'GET', url: URL, query: { hasCollections: 'false' } });
    const inSome = await app.inject({ method: 'GET', url: URL, query: { hasCollections: 'true' } });
    const untagged = await app.inject({ method: 'GET', url: URL, query: { hasTags: 'false' } });
    const tagged = await app.inject({ method: 'GET', url: URL, query: { hasTags: 'true' } });

    expect(names(inNone.json<ListBody>())).toEqual(['Thanos']);
    expect(names(inSome.json<ListBody>())).toEqual(['Darth Vader', 'Spider-Man', 'Thanos']);
    expect(names(untagged.json<ListBody>())).toEqual(['Darth Vader', 'Thanos', 'Thanos']);
    expect(names(tagged.json<ListBody>())).toEqual(['Spider-Man']);
  });

  it('sorts by the numeric value of the box number', async () => {
    const category = await createCategory();
    await createFunko({ name: 'Ten', number: '10', categoryId: category.id });
    await createFunko({ name: 'Two', number: '2', categoryId: category.id });
    await createFunko({ name: 'Nine', number: '09', categoryId: category.id });

    const response = await app.inject({ method: 'GET', url: URL, query: { sorting_fields: 'NUMBER' } });

    expect(names(response.json<ListBody>())).toEqual(['Two', 'Nine', 'Ten']);
  });

  it('puts an exact name match first when q is set', async () => {
    const category = await createCategory();
    await createFunko({ name: 'Amazing Groot', categoryId: category.id });
    await createFunko({ name: 'Groot', categoryId: category.id });
    await createFunko({ name: 'Groot Deluxe', categoryId: category.id });

    const response = await app.inject({ method: 'GET', url: URL, query: { q: 'groot' } });

    expect(names(response.json<ListBody>())).toEqual(['Groot', 'Groot Deluxe', 'Amazing Groot']);
  });

  it('treats % and _ in the query as plain characters', async () => {
    const category = await createCategory();
    await createFunko({ name: '100% Soft Groot', categoryId: category.id });
    await createFunko({ name: 'Groot', categoryId: category.id });

    const percent = await app.inject({ method: 'GET', url: URL, query: { q: '%' } });
    const underscore = await app.inject({ method: 'GET', url: URL, query: { name: 'gr_ot' } });

    expect(names(percent.json<ListBody>())).toEqual(['100% Soft Groot']);
    expect(names(underscore.json<ListBody>())).toEqual([]);
  });

  it('rejects a malformed id list with VALIDATION_ERROR', async () => {
    const response = await app.inject({ method: 'GET', url: URL, query: { tagId: '1,abc' } });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });
});

describe('GET /funkos/by-barcode/:barcode', () => {
  it('returns the funko that carries the barcode', async () => {
    await seedCatalog();

    const response = await app.inject({ method: 'GET', url: `${URL}/by-barcode/${BARCODE}` });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ name: 'Spider-Man', barcode: STORED_BARCODE });
  });

  it('returns 404 for an unknown barcode', async () => {
    const response = await app.inject({ method: 'GET', url: `${URL}/by-barcode/000000000000` });

    expect(response.statusCode).toBe(404);
  });
});

describe('GET /funkos/:funkoId', () => {
  it('returns the funko with its images, category and collections', async () => {
    const { spiderMan } = await seedCatalog();
    await app.inject({
      method: 'POST',
      url: `${URL}/${spiderMan.id}/images`,
      payload: toFormData([{ buffer: await makeImage() }]),
    });

    const response = await app.inject({ method: 'GET', url: `${URL}/${spiderMan.id}` });

    expect(response.statusCode).toBe(200);
    const body = response.json<{
      images: unknown[];
      primaryImage: { smallUrl: string } | null;
      category: { name: string };
    }>();
    expect(body.images).toHaveLength(1);
    expect(body.primaryImage?.smallUrl).toMatch(/\.sm\.webp$/);
    expect(body.category.name).toBe('Pop! Marvel');
  });

  it('returns 404 when it does not exist', async () => {
    const response = await app.inject({ method: 'GET', url: `${URL}/${MISSING_ID}` });

    expect(response.statusCode).toBe(404);
  });
});

describe('POST /funkos', () => {
  it('creates the funko with defaults and returns 201', async () => {
    const category = await createCategory();

    const response = await app.inject({
      method: 'POST',
      url: URL,
      payload: { name: ' Groot ', number: '1203', categoryId: category.id },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      name: 'Groot',
      number: '1203',
      type: 'POP',
      isChase: false,
      exclusive: '',
      barcode: null,
      primaryImage: null,
      collections: [],
    });
  });

  it('returns 409 with the existing id when the same funko already exists', async () => {
    const { thanos, marvel } = await seedCatalog();

    const response = await app.inject({
      method: 'POST',
      url: URL,
      payload: { name: 'Thanos', number: '78', categoryId: marvel.id },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ code: 'CONFLICT', existingId: thanos.id });
  });

  it('returns 409 with the existing id when the barcode is already used', async () => {
    const { spiderMan, marvel } = await seedCatalog();

    const response = await app.inject({
      method: 'POST',
      url: URL,
      payload: { name: 'Other', number: '99', categoryId: marvel.id, barcode: BARCODE },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ existingId: spiderMan.id });
  });

  it('returns 400 when the category does not exist or a field is invalid', async () => {
    const unknownCategory = await app.inject({
      method: 'POST',
      url: URL,
      payload: { name: 'X', number: '1', categoryId: MISSING_ID },
    });
    const badType = await app.inject({
      method: 'POST',
      url: URL,
      payload: { name: 'X', number: '1', categoryId: 1, type: 'FIGURE' },
    });

    expect(unknownCategory.statusCode).toBe(400);
    expect(badType.statusCode).toBe(400);
  });
});

describe('PATCH /funkos/:funkoId', () => {
  it('updates fields and keeps the rest', async () => {
    const { vader } = await seedCatalog();

    const response = await app.inject({ method: 'PATCH', url: `${URL}/${vader.id}`, payload: { isChase: true } });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ name: 'Darth Vader', isChase: true, exclusive: 'SDCC 2024' });
  });

  it('returns 409 when the change collides with another funko', async () => {
    const { thanos } = await seedCatalog();

    const response = await app.inject({ method: 'PATCH', url: `${URL}/${thanos.id}`, payload: { isChase: true } });

    expect(response.statusCode).toBe(409);
  });
});

describe('DELETE /funkos/:funkoId', () => {
  it('returns 409 naming the collections while the funko sits in one and force is not set', async () => {
    const { spiderMan } = await seedCatalog();

    const response = await app.inject({ method: 'DELETE', url: `${URL}/${spiderMan.id}` });

    expect(response.statusCode).toBe(409);
    const body = response.json<{ code: string; message: string }>();
    expect(body.code).toBe('CONFLICT');
    expect(body.message).toContain('"Owned"');
    expect((await app.inject({ method: 'GET', url: `${URL}/${spiderMan.id}` })).statusCode).toBe(200);
  });

  it('removes the funko from every collection and deletes it when force=true', async () => {
    const { spiderMan, thanos, owned, wishlist } = await seedCatalog();
    await createItem(wishlist.id, spiderMan.id);

    const response = await app.inject({ method: 'DELETE', url: `${URL}/${spiderMan.id}`, query: { force: 'true' } });

    expect(response.statusCode).toBe(204);
    expect((await app.inject({ method: 'GET', url: `${URL}/${spiderMan.id}` })).statusCode).toBe(404);
    const ownedItems = await app.inject({ method: 'GET', url: `/collections/${owned.id}/items` });
    const wishlistItems = await app.inject({ method: 'GET', url: `/collections/${wishlist.id}/items` });
    expect(ownedItems.json<{ data: { funko: { name: string } }[] }>().data.map((item) => item.funko.name)).toEqual([
      'Darth Vader',
    ]);
    expect(wishlistItems.json<{ data: { funko: { id: number } }[] }>().data.map((item) => item.funko.id)).toEqual([
      thanos.id,
    ]);
    const tagsLeft = await app.inject({ method: 'GET', url: '/tags' });
    expect(tagsLeft.json<{ data: { name: string; itemCount: number }[] }>().data).toEqual([
      expect.objectContaining({ name: 'Box 3', itemCount: 0 }),
    ]);
  });

  it('rejects a force value that is not true or false', async () => {
    const { thanosChase } = await seedCatalog();

    const response = await app.inject({ method: 'DELETE', url: `${URL}/${thanosChase.id}`, query: { force: 'yes' } });

    expect(response.statusCode).toBe(400);
  });

  it('removes the funko, its image rows and its folder when it is in no collection', async () => {
    const { thanosChase } = await seedCatalog();
    await app.inject({
      method: 'POST',
      url: `${URL}/${thanosChase.id}/images`,
      payload: toFormData([{ buffer: await makeImage() }]),
    });

    const response = await app.inject({ method: 'DELETE', url: `${URL}/${thanosChase.id}` });

    expect(response.statusCode).toBe(204);
    await expect(access(funkoFolder(thanosChase.id))).rejects.toThrow();
  });
});

type SeriesSummary = { id: number; name: string } | null;
type FunkoWithSeriesBody = FunkoBody & { series: SeriesSummary };

describe('series on funkos', () => {
  it('creates a funko with a series and returns it in the response', async () => {
    const category = await createCategory();
    const daredevil = await createSeries('Daredevil: Born Again');

    const response = await app.inject({
      method: 'POST',
      url: URL,
      payload: { name: 'Daredevil', number: '1406', categoryId: category.id, seriesId: daredevil.id },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ series: { id: daredevil.id, name: 'Daredevil: Born Again' } });
  });

  it('creates a funko without a series as series null', async () => {
    const category = await createCategory();

    const response = await app.inject({
      method: 'POST',
      url: URL,
      payload: { name: 'Groot', number: '1203', categoryId: category.id },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ series: null });
  });

  it('returns 400 when the series does not exist', async () => {
    const category = await createCategory();

    const response = await app.inject({
      method: 'POST',
      url: URL,
      payload: { name: 'X', number: '1', categoryId: category.id, seriesId: MISSING_ID },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR', message: `Series ${MISSING_ID} does not exist` });
  });

  it('sets a series with PATCH and clears it with null', async () => {
    const mandalorian = await createSeries('The Mandalorian');
    const funko = await createFunko({ name: 'Grogu' });

    const setResponse = await app.inject({
      method: 'PATCH',
      url: `${URL}/${funko.id}`,
      payload: { seriesId: mandalorian.id },
    });
    const renameResponse = await app.inject({ method: 'PATCH', url: `${URL}/${funko.id}`, payload: { name: 'Baby' } });
    const clearResponse = await app.inject({ method: 'PATCH', url: `${URL}/${funko.id}`, payload: { seriesId: null } });

    expect(setResponse.json()).toMatchObject({ series: { id: mandalorian.id, name: 'The Mandalorian' } });
    expect(renameResponse.json()).toMatchObject({ name: 'Baby', series: { id: mandalorian.id } });
    expect(clearResponse.statusCode).toBe(200);
    expect(clearResponse.json()).toMatchObject({ series: null });
  });

  it('returns 400 when PATCH points at a missing series', async () => {
    const funko = await createFunko();

    const response = await app.inject({
      method: 'PATCH',
      url: `${URL}/${funko.id}`,
      payload: { seriesId: MISSING_ID },
    });

    expect(response.statusCode).toBe(400);
  });

  it('includes the series in the detail response', async () => {
    const strangerThings = await createSeries('Stranger Things');
    const funko = await createFunko({ seriesId: strangerThings.id });

    const response = await app.inject({ method: 'GET', url: `${URL}/${funko.id}` });

    expect(response.json()).toMatchObject({ series: { id: strangerThings.id, name: 'Stranger Things' } });
  });

  it('filters by seriesId list and by series name', async () => {
    const strangerThings = await createSeries('Stranger Things');
    const mandalorian = await createSeries('The Mandalorian');
    await createFunko({ name: 'Eleven', seriesId: strangerThings.id });
    await createFunko({ name: 'Grogu', seriesId: mandalorian.id });
    await createFunko({ name: 'Groot' });

    const byIds = await app.inject({
      method: 'GET',
      url: URL,
      query: { seriesId: `${strangerThings.id},${mandalorian.id}` },
    });
    const byName = await app.inject({ method: 'GET', url: URL, query: { series: 'stranger' } });

    expect(names(byIds.json<ListBody>())).toEqual(['Eleven', 'Grogu']);
    expect(names(byName.json<ListBody>())).toEqual(['Eleven']);
  });

  it('lists funkos with no series and with one through hasSeries', async () => {
    const strangerThings = await createSeries('Stranger Things');
    await createFunko({ name: 'Eleven', seriesId: strangerThings.id });
    await createFunko({ name: 'Groot' });

    const without = await app.inject({ method: 'GET', url: URL, query: { hasSeries: 'false' } });
    const withSeries = await app.inject({ method: 'GET', url: URL, query: { hasSeries: 'true' } });

    expect(names(without.json<ListBody>())).toEqual(['Groot']);
    expect(names(withSeries.json<ListBody>())).toEqual(['Eleven']);
  });

  it('finds a funko through its series name with q and reports SERIES', async () => {
    const daredevil = await createSeries('Daredevil: Born Again');
    await createFunko({ name: 'Kingpin', seriesId: daredevil.id });
    await createFunko({ name: 'Groot' });

    const response = await app.inject({ method: 'GET', url: URL, query: { q: 'born' } });

    const body = response.json<{ data: FunkoWithSeriesBody[] }>();
    expect(body.data.map((funko) => funko.name)).toEqual(['Kingpin']);
    expect(body.data[0]?.matchedOn).toEqual(['SERIES']);
  });

  it('sorts by series name with funkos without a series last in both directions', async () => {
    const alpha = await createSeries('Alpha');
    const beta = await createSeries('Beta');
    await createFunko({ name: 'No series' });
    await createFunko({ name: 'In beta', seriesId: beta.id });
    await createFunko({ name: 'In alpha', seriesId: alpha.id });

    const ascending = await app.inject({ method: 'GET', url: URL, query: { sorting_fields: 'SERIES' } });
    const descending = await app.inject({
      method: 'GET',
      url: URL,
      query: { sorting_fields: 'SERIES', direction: 'DESC' },
    });

    expect(names(ascending.json<ListBody>())).toEqual(['In alpha', 'In beta', 'No series']);
    expect(names(descending.json<ListBody>())).toEqual(['In beta', 'In alpha', 'No series']);
  });
});
