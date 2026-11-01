import { buildApp, type App } from '../../app.ts';
import { resetTestDb } from '../../testDb.ts';
import { funkoFolderExists } from '../../lib/imageStorage.ts';
import {
  createCategory,
  createCollection,
  createFunko,
  createItem,
  createSeries,
  createTag,
  makeImage,
  type SignedInClient,
  signIn,
  toFormData,
} from '../../testFixtures.ts';

const URL = '/funkos';
const MISSING_ID = 999;
// Typed and scanned as UPC-A (12 digits); stored and returned as EAN-13 (a leading zero).
const BARCODE = '889698624008';
const STORED_BARCODE = `0${BARCODE}`;

type FunkoBody = { id: number; name: string; number: string; matchedOn?: string[]; collections: { name: string }[] };
type ListBody = { data: FunkoBody[]; totalResultNumber: number; currentPage: number };
type SeriesSummary = { id: number; name: string } | null;
type FunkoWithSeriesBody = FunkoBody & { series: SeriesSummary };

let app: App;
let api: SignedInClient;

beforeAll(async () => {
  app = await buildApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await resetTestDb();
  api = await signIn(app);
});

function names(body: ListBody): string[] {
  return body.data.map((funko) => funko.name);
}

async function seedCatalog() {
  const marvel = await createCategory('Pop! Marvel');
  const starWars = await createCategory('Pop! Star Wars');
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

    const response = await api.inject({ method: 'GET', url: URL });

    expect(response.statusCode).toBe(200);
    const body = response.json<ListBody>();
    expect(names(body)).toEqual(['Darth Vader', 'Spider-Man', 'Thanos', 'Thanos']);
    expect(body.totalResultNumber).toBe(4);
    expect(body.data[1]?.collections.map((collection) => collection.name)).toEqual(['Owned']);
  });

  it('finds funkos and reports TAG as the matched field when q matches a tag name', async () => {
    await seedCatalog();

    const response = await api.inject({ method: 'GET', url: URL, query: { q: 'box' } });

    const body = response.json<ListBody>();
    expect(names(body)).toEqual(['Spider-Man']);
    expect(body.data[0]?.matchedOn).toEqual(['TAG']);
  });

  it('keeps only funkos matched by every word when q has a collection name and a category name', async () => {
    await seedCatalog();

    const response = await api.inject({ method: 'GET', url: URL, query: { q: 'wishlist marvel' } });

    const body = response.json<ListBody>();
    expect(names(body)).toEqual(['Thanos']);
    expect(body.data[0]?.matchedOn).toEqual(expect.arrayContaining(['COLLECTION', 'CATEGORY']));
  });

  it('matches the box number and the exclusive sticker when q is a hashed number or sticker text', async () => {
    await seedCatalog();

    const byNumber = await api.inject({ method: 'GET', url: URL, query: { q: '#01' } });
    const byExclusive = await api.inject({ method: 'GET', url: URL, query: { q: 'sdcc' } });

    expect(names(byNumber.json<ListBody>())).toEqual(['Darth Vader']);
    expect(names(byExclusive.json<ListBody>())).toEqual(['Darth Vader']);
  });

  it('ANDs q with the named params when both are sent', async () => {
    const { marvel } = await seedCatalog();

    const response = await api.inject({
      method: 'GET',
      url: URL,
      query: { q: 'thanos', categoryId: String(marvel.id), isChase: 'true' },
    });

    const body = response.json<ListBody>();
    expect(body.totalResultNumber).toBe(1);
    expect(body.data[0]).toMatchObject({ name: 'Thanos', isChase: true });
  });

  it('filters by tag id, collection name and category name when only those params are sent', async () => {
    const { box } = await seedCatalog();

    const byTag = await api.inject({ method: 'GET', url: URL, query: { tagId: String(box.id) } });
    const byCollection = await api.inject({ method: 'GET', url: URL, query: { collection: 'owned' } });
    const byCategory = await api.inject({ method: 'GET', url: URL, query: { category: 'star' } });

    expect(names(byTag.json<ListBody>())).toEqual(['Spider-Man']);
    expect(names(byCollection.json<ListBody>())).toEqual(['Darth Vader', 'Spider-Man']);
    expect(names(byCategory.json<ListBody>())).toEqual(['Darth Vader']);
  });

  it('filters by type when only type is sent', async () => {
    await seedCatalog();
    await createFunko({ name: 'Millennium Falcon', type: 'POP_RIDES' });

    const response = await api.inject({ method: 'GET', url: URL, query: { type: 'POP_RIDES' } });

    expect(names(response.json<ListBody>())).toEqual(['Millennium Falcon']);
  });

  it('splits funkos with and without images when hasImages is true or false', async () => {
    const { vader } = await seedCatalog();
    await api.inject({
      method: 'POST',
      url: `${URL}/${vader.id}/images`,
      payload: toFormData([{ buffer: await makeImage() }]),
    });

    const withImages = await api.inject({ method: 'GET', url: URL, query: { hasImages: 'true' } });
    const withoutImages = await api.inject({ method: 'GET', url: URL, query: { hasImages: 'false' } });

    expect(names(withImages.json<ListBody>())).toEqual(['Darth Vader']);
    expect(names(withoutImages.json<ListBody>())).not.toContain('Darth Vader');
    expect(withoutImages.json<ListBody>().totalResultNumber).toBe(3);
  });

  it('lists what is not in a collection yet when notInCollectionId is set', async () => {
    const { owned } = await seedCatalog();

    const response = await api.inject({ method: 'GET', url: URL, query: { notInCollectionId: String(owned.id) } });

    expect(names(response.json<ListBody>())).toEqual(['Thanos', 'Thanos']);
  });

  it('splits funkos by collection and tag presence when hasCollections or hasTags is set', async () => {
    await seedCatalog();

    const inNone = await api.inject({ method: 'GET', url: URL, query: { hasCollections: 'false' } });
    const inSome = await api.inject({ method: 'GET', url: URL, query: { hasCollections: 'true' } });
    const untagged = await api.inject({ method: 'GET', url: URL, query: { hasTags: 'false' } });
    const tagged = await api.inject({ method: 'GET', url: URL, query: { hasTags: 'true' } });

    expect(names(inNone.json<ListBody>())).toEqual(['Thanos']);
    expect(names(inSome.json<ListBody>())).toEqual(['Darth Vader', 'Spider-Man', 'Thanos']);
    expect(names(untagged.json<ListBody>())).toEqual(['Darth Vader', 'Thanos', 'Thanos']);
    expect(names(tagged.json<ListBody>())).toEqual(['Spider-Man']);
  });

  it('orders by the numeric value of the box number when sorting by NUMBER', async () => {
    const category = await createCategory();
    await createFunko({ name: 'Ten', number: '10', categoryId: category.id });
    await createFunko({ name: 'Two', number: '2', categoryId: category.id });
    await createFunko({ name: 'Nine', number: '09', categoryId: category.id });

    const response = await api.inject({ method: 'GET', url: URL, query: { sorting_fields: 'NUMBER' } });

    expect(names(response.json<ListBody>())).toEqual(['Two', 'Nine', 'Ten']);
  });

  it('sorts a number with no digits first when sorting by NUMBER and a box says "SE"', async () => {
    const category = await createCategory();
    await createFunko({ name: 'Two', number: '2', categoryId: category.id });
    await createFunko({ name: 'Special', number: 'SE', categoryId: category.id });

    const response = await api.inject({ method: 'GET', url: URL, query: { sorting_fields: 'NUMBER' } });

    expect(response.statusCode).toBe(200);
    expect(names(response.json<ListBody>())).toEqual(['Special', 'Two']);
  });

  it('puts an exact name match first when q is set', async () => {
    const category = await createCategory();
    await createFunko({ name: 'Amazing Groot', categoryId: category.id });
    await createFunko({ name: 'Groot', categoryId: category.id });
    await createFunko({ name: 'Groot Deluxe', categoryId: category.id });

    const response = await api.inject({ method: 'GET', url: URL, query: { q: 'groot' } });

    expect(names(response.json<ListBody>())).toEqual(['Groot', 'Groot Deluxe', 'Amazing Groot']);
  });

  it('matches % and _ literally when the query contains them', async () => {
    const category = await createCategory();
    await createFunko({ name: '100% Soft Groot', categoryId: category.id });
    await createFunko({ name: 'Groot', categoryId: category.id });

    const percent = await api.inject({ method: 'GET', url: URL, query: { q: '%' } });
    const underscore = await api.inject({ method: 'GET', url: URL, query: { name: 'gr_ot' } });

    expect(names(percent.json<ListBody>())).toEqual(['100% Soft Groot']);
    expect(names(underscore.json<ListBody>())).toEqual([]);
  });

  it('keeps funkos by series when seriesId lists ids or series names a fragment', async () => {
    const strangerThings = await createSeries('Stranger Things');
    const mandalorian = await createSeries('The Mandalorian');
    await createFunko({ name: 'Eleven', seriesId: strangerThings.id });
    await createFunko({ name: 'Grogu', seriesId: mandalorian.id });
    await createFunko({ name: 'Groot' });

    const byIds = await api.inject({
      method: 'GET',
      url: URL,
      query: { seriesId: `${strangerThings.id},${mandalorian.id}` },
    });
    const byName = await api.inject({ method: 'GET', url: URL, query: { series: 'stranger' } });

    expect(names(byIds.json<ListBody>())).toEqual(['Eleven', 'Grogu']);
    expect(names(byName.json<ListBody>())).toEqual(['Eleven']);
  });

  it('splits funkos with and without a series when hasSeries is set', async () => {
    const strangerThings = await createSeries('Stranger Things');
    await createFunko({ name: 'Eleven', seriesId: strangerThings.id });
    await createFunko({ name: 'Groot' });

    const without = await api.inject({ method: 'GET', url: URL, query: { hasSeries: 'false' } });
    const withSeries = await api.inject({ method: 'GET', url: URL, query: { hasSeries: 'true' } });

    expect(names(without.json<ListBody>())).toEqual(['Groot']);
    expect(names(withSeries.json<ListBody>())).toEqual(['Eleven']);
  });

  it('finds the funko and reports SERIES when q matches its series name', async () => {
    const daredevil = await createSeries('Daredevil: Born Again');
    await createFunko({ name: 'Kingpin', seriesId: daredevil.id });
    await createFunko({ name: 'Groot' });

    const response = await api.inject({ method: 'GET', url: URL, query: { q: 'born' } });

    const body = response.json<{ data: FunkoWithSeriesBody[] }>();
    expect(body.data.map((funko) => funko.name)).toEqual(['Kingpin']);
    expect(body.data[0]?.matchedOn).toEqual(['SERIES']);
  });

  it('puts funkos without a series last in both directions when sorting by SERIES', async () => {
    const alpha = await createSeries('Alpha');
    const beta = await createSeries('Beta');
    await createFunko({ name: 'No series' });
    await createFunko({ name: 'In beta', seriesId: beta.id });
    await createFunko({ name: 'In alpha', seriesId: alpha.id });

    const ascending = await api.inject({ method: 'GET', url: URL, query: { sorting_fields: 'SERIES' } });
    const descending = await api.inject({
      method: 'GET',
      url: URL,
      query: { sorting_fields: 'SERIES', direction: 'DESC' },
    });

    expect(names(ascending.json<ListBody>())).toEqual(['In alpha', 'In beta', 'No series']);
    expect(names(descending.json<ListBody>())).toEqual(['In beta', 'In alpha', 'No series']);
  });

  it('returns 400 with VALIDATION_ERROR when an id list is malformed', async () => {
    const response = await api.inject({ method: 'GET', url: URL, query: { tagId: '1,abc' } });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });
});

describe('GET /funkos/by-barcode/:barcode', () => {
  it('returns the funko when a funko carries the barcode', async () => {
    await seedCatalog();

    const response = await api.inject({ method: 'GET', url: `${URL}/by-barcode/${BARCODE}` });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ name: 'Spider-Man', barcode: STORED_BARCODE });
  });

  it('returns 400 when the barcode is not digits', async () => {
    const response = await api.inject({ method: 'GET', url: `${URL}/by-barcode/ABCDEFGHIJ` });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 404 when no funko carries the barcode', async () => {
    const response = await api.inject({ method: 'GET', url: `${URL}/by-barcode/000000000000` });

    expect(response.statusCode).toBe(404);
  });
});

describe('GET /funkos/:funkoId', () => {
  it('returns the funko with its images, category and collections when it exists', async () => {
    const { spiderMan } = await seedCatalog();
    await api.inject({
      method: 'POST',
      url: `${URL}/${spiderMan.id}/images`,
      payload: toFormData([{ buffer: await makeImage() }]),
    });

    const response = await api.inject({ method: 'GET', url: `${URL}/${spiderMan.id}` });

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

  it('includes the series when the funko has one', async () => {
    const strangerThings = await createSeries('Stranger Things');
    const funko = await createFunko({ seriesId: strangerThings.id });

    const response = await api.inject({ method: 'GET', url: `${URL}/${funko.id}` });

    expect(response.json()).toMatchObject({ series: { id: strangerThings.id, name: 'Stranger Things' } });
  });

  it('returns 400 when the id is not a positive integer', async () => {
    const response = await api.inject({ method: 'GET', url: `${URL}/0` });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 404 when it does not exist', async () => {
    const response = await api.inject({ method: 'GET', url: `${URL}/${MISSING_ID}` });

    expect(response.statusCode).toBe(404);
  });
});

describe('POST /funkos', () => {
  it('creates the funko with defaults and returns 201 when only the required fields are sent', async () => {
    const category = await createCategory();

    const response = await api.inject({
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
      series: null,
    });
  });

  it('returns the series in the response when the body names one', async () => {
    const category = await createCategory();
    const daredevil = await createSeries('Daredevil: Born Again');

    const response = await api.inject({
      method: 'POST',
      url: URL,
      payload: { name: 'Daredevil', number: '1406', categoryId: category.id, seriesId: daredevil.id },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ series: { id: daredevil.id, name: 'Daredevil: Born Again' } });
  });

  it('returns 409 with the existing id when the same funko already exists', async () => {
    const { thanos, marvel } = await seedCatalog();

    const response = await api.inject({
      method: 'POST',
      url: URL,
      payload: { name: 'Thanos', number: '78', categoryId: marvel.id },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ code: 'CONFLICT', existingId: thanos.id });
  });

  it('returns 409 with the existing id when the barcode is already used', async () => {
    const { spiderMan, marvel } = await seedCatalog();

    const response = await api.inject({
      method: 'POST',
      url: URL,
      payload: { name: 'Other', number: '99', categoryId: marvel.id, barcode: BARCODE },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ existingId: spiderMan.id });
  });

  it('returns 400 when the category does not exist or a field is invalid', async () => {
    const unknownCategory = await api.inject({
      method: 'POST',
      url: URL,
      payload: { name: 'X', number: '1', categoryId: MISSING_ID },
    });
    const badType = await api.inject({
      method: 'POST',
      url: URL,
      payload: { name: 'X', number: '1', categoryId: 1, type: 'FIGURE' },
    });

    expect(unknownCategory.statusCode).toBe(400);
    expect(badType.statusCode).toBe(400);
  });

  it('returns 400 naming the series when the series does not exist', async () => {
    const category = await createCategory();

    const response = await api.inject({
      method: 'POST',
      url: URL,
      payload: { name: 'X', number: '1', categoryId: category.id, seriesId: MISSING_ID },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR', message: `Series ${MISSING_ID} does not exist` });
  });
});

describe('PATCH /funkos/:funkoId', () => {
  it('updates the sent fields and keeps the rest when the funko exists', async () => {
    const { vader } = await seedCatalog();

    const response = await api.inject({ method: 'PATCH', url: `${URL}/${vader.id}`, payload: { isChase: true } });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ name: 'Darth Vader', isChase: true, exclusive: 'SDCC 2024' });
  });

  it('sets the series, keeps it across other changes and clears it when seriesId is null', async () => {
    const mandalorian = await createSeries('The Mandalorian');
    const funko = await createFunko({ name: 'Grogu' });

    const setResponse = await api.inject({
      method: 'PATCH',
      url: `${URL}/${funko.id}`,
      payload: { seriesId: mandalorian.id },
    });
    const renameResponse = await api.inject({ method: 'PATCH', url: `${URL}/${funko.id}`, payload: { name: 'Baby' } });
    const clearResponse = await api.inject({ method: 'PATCH', url: `${URL}/${funko.id}`, payload: { seriesId: null } });

    expect(setResponse.json()).toMatchObject({ series: { id: mandalorian.id, name: 'The Mandalorian' } });
    expect(renameResponse.json()).toMatchObject({ name: 'Baby', series: { id: mandalorian.id } });
    expect(clearResponse.statusCode).toBe(200);
    expect(clearResponse.json()).toMatchObject({ series: null });
  });

  it('returns 409 when the change collides with another funko', async () => {
    const { thanos } = await seedCatalog();

    const response = await api.inject({ method: 'PATCH', url: `${URL}/${thanos.id}`, payload: { isChase: true } });

    expect(response.statusCode).toBe(409);
  });

  it('returns 400 when the body points at a missing series', async () => {
    const funko = await createFunko();

    const response = await api.inject({
      method: 'PATCH',
      url: `${URL}/${funko.id}`,
      payload: { seriesId: MISSING_ID },
    });

    expect(response.statusCode).toBe(400);
  });

  it('returns 400 when the body carries an unknown key', async () => {
    const funko = await createFunko();

    const response = await api.inject({ method: 'PATCH', url: `${URL}/${funko.id}`, payload: { colour: 'red' } });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 404 when it does not exist', async () => {
    const response = await api.inject({ method: 'PATCH', url: `${URL}/${MISSING_ID}`, payload: { name: 'x' } });

    expect(response.statusCode).toBe(404);
  });
});

describe('DELETE /funkos/:funkoId', () => {
  it('returns 409 IN_COLLECTIONS naming the collections when the funko sits in one and force is not set', async () => {
    const { spiderMan } = await seedCatalog();

    const response = await api.inject({ method: 'DELETE', url: `${URL}/${spiderMan.id}` });

    expect(response.statusCode).toBe(409);
    const body = response.json<{ code: string; message: string }>();
    expect(body.code).toBe('IN_COLLECTIONS');
    expect(body.message).toContain('"Owned"');
    expect((await api.inject({ method: 'GET', url: `${URL}/${spiderMan.id}` })).statusCode).toBe(200);
  });

  it('removes the funko from every collection and deletes it when force=true', async () => {
    const { spiderMan, thanos, owned, wishlist } = await seedCatalog();
    await createItem(wishlist.id, spiderMan.id);

    const response = await api.inject({ method: 'DELETE', url: `${URL}/${spiderMan.id}`, query: { force: 'true' } });

    expect(response.statusCode).toBe(204);
    expect((await api.inject({ method: 'GET', url: `${URL}/${spiderMan.id}` })).statusCode).toBe(404);
    const ownedItems = await api.inject({ method: 'GET', url: `/collections/${owned.id}/items` });
    const wishlistItems = await api.inject({ method: 'GET', url: `/collections/${wishlist.id}/items` });
    expect(ownedItems.json<{ data: { funko: { name: string } }[] }>().data.map((item) => item.funko.name)).toEqual([
      'Darth Vader',
    ]);
    expect(wishlistItems.json<{ data: { funko: { id: number } }[] }>().data.map((item) => item.funko.id)).toEqual([
      thanos.id,
    ]);
    const tagsLeft = await api.inject({ method: 'GET', url: '/tags' });
    expect(tagsLeft.json<{ data: { name: string; itemCount: number }[] }>().data).toEqual([
      expect.objectContaining({ name: 'Box 3', itemCount: 0 }),
    ]);
  });

  it('returns 400 when force is not true or false', async () => {
    const { thanosChase } = await seedCatalog();

    const response = await api.inject({ method: 'DELETE', url: `${URL}/${thanosChase.id}`, query: { force: 'yes' } });

    expect(response.statusCode).toBe(400);
  });

  it('removes the funko, its image rows and its folder when it is in no collection', async () => {
    const { thanosChase } = await seedCatalog();
    await api.inject({
      method: 'POST',
      url: `${URL}/${thanosChase.id}/images`,
      payload: toFormData([{ buffer: await makeImage() }]),
    });

    const response = await api.inject({ method: 'DELETE', url: `${URL}/${thanosChase.id}` });

    expect(response.statusCode).toBe(204);
    expect(await funkoFolderExists(thanosChase.id)).toBe(false);
  });

  it('returns 404 when it does not exist', async () => {
    const response = await api.inject({ method: 'DELETE', url: `${URL}/${MISSING_ID}` });

    expect(response.statusCode).toBe(404);
  });
});
