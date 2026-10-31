import { buildApp, type App } from '../../app.ts';
import { resetTestDb } from '../../testDb.ts';
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
import { readXlsxFile } from '../../testXlsx.ts';

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

async function seed() {
  const marvel = await createCategory('Pop! Marvel');
  const owned = await createCollection({ name: 'Owned', isDefault: true });
  const box = await createTag('Box 3');
  const homecoming = await createSeries('Homecoming');
  const funko = await createFunko({
    name: 'Spider-Man, "Classic"',
    number: '03',
    categoryId: marvel.id,
    seriesId: homecoming.id,
  });
  await createItem(owned.id, funko.id, { purchasePriceCents: 1499, purchasedAt: '2024-03-02', tagIds: [box.id] });

  return { marvel, owned, box, homecoming, funko };
}

describe('GET /export', () => {
  it('returns every table as one JSON download when the catalog has data', async () => {
    const { funko, box, homecoming } = await seed();

    const response = await api.inject({ method: 'GET', url: '/export' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-disposition']).toContain('attachment');
    const body = response.json<{
      funkos: { id: number; seriesId: number | null }[];
      series: { id: number; name: string }[];
      items: { tagIds: number[] }[];
      collections: unknown[];
      categories: unknown[];
      tags: unknown[];
    }>();
    expect(body.funkos.map((row) => [row.id, row.seriesId])).toEqual([[funko.id, homecoming.id]]);
    expect(body.series).toEqual([{ id: homecoming.id, name: 'Homecoming' }]);
    expect(body.items[0]?.tagIds).toEqual([box.id]);
    expect(body.categories).toHaveLength(1);
    expect(body.collections).toHaveLength(1);
    expect(body.tags).toHaveLength(1);
  });
});

describe('GET /export/items.csv', () => {
  it('writes one quoted line per item with the price in units when an item has a price', async () => {
    const { funko } = await seed();

    const response = await api.inject({ method: 'GET', url: '/export/items.csv' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
    const [header, line] = response.body.split('\r\n');
    expect(header).toBe(
      'collection,funko_id,name,number,category,series,type,is_chase,exclusive,barcode,quantity,condition,purchase_price,purchase_currency,purchased_at,tags,notes,image_urls',
    );
    expect(line).toBe(
      `Owned,${funko.id},"Spider-Man, ""Classic""",03,Pop! Marvel,Homecoming,POP,false,,,1,,14.99,EUR,2024-03-02,Box 3,,`,
    );
  });

  it('defuses formula-like text and keeps plain numbers when a cell starts with =, +, - or @', async () => {
    const { owned } = await seed();
    const marvel = await createCategory('=HYPERLINK("http://evil.example","Click")');
    const funko = await createFunko({ name: '@SUM(A1)', number: '-7', categoryId: marvel.id });
    await createItem(owned.id, funko.id, { notes: '+cmd', purchasePriceCents: 1499 });

    const response = await api.inject({ method: 'GET', url: '/export/items.csv' });

    const line = response.body.split('\r\n').find((row) => row.includes('SUM'));
    expect(line).toContain(`'@SUM(A1)`);
    expect(line).toContain(`"'=HYPERLINK(""http://evil.example"",""Click"")"`);
    expect(line).toContain(`'+cmd`);
    expect(line).toContain(',-7,');
    expect(line).toContain(',14.99,');
  });
});

describe('GET /export/funkos.csv', () => {
  function csvLines(body: string): string[] {
    return body.trim().split('\r\n');
  }

  it('returns the category’s funkos, one in no collection included, when filtered by category', async () => {
    const { marvel } = await seed();
    await createFunko({ name: 'Loose Hulk', categoryId: marvel.id });
    await createFunko({ name: 'Other line' });

    const response = await api.inject({
      method: 'GET',
      url: '/export/funkos.csv',
      query: { categoryId: String(marvel.id) },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-disposition']).toBe('attachment; filename="category-pop-marvel.csv"');
    const lines = csvLines(response.body);
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain('Owned');
    expect(lines[2]).toMatch(/^,\d+,Loose Hulk,/);
    expect(response.body).not.toContain('Other line');
  });

  it('returns only the lines of that collection when filtered by collection', async () => {
    const { owned, funko } = await seed();
    const wishlist = await createCollection({ name: 'Wishlist' });
    await createItem(wishlist.id, funko.id);

    const response = await api.inject({
      method: 'GET',
      url: '/export/funkos.csv',
      query: { collectionId: String(owned.id) },
    });

    expect(response.headers['content-disposition']).toBe('attachment; filename="collection-owned.csv"');
    const lines = csvLines(response.body);
    expect(lines).toHaveLength(2);
    expect(lines[1]?.startsWith('Owned,')).toBe(true);
  });

  it('returns only the items carrying the tag when filtered by tag', async () => {
    const { box, owned } = await seed();
    await createItem(owned.id, (await createFunko({ name: 'Untagged' })).id);

    const response = await api.inject({ method: 'GET', url: '/export/funkos.csv', query: { tagId: String(box.id) } });

    expect(response.headers['content-disposition']).toBe('attachment; filename="tag-box-3.csv"');
    expect(csvLines(response.body)).toHaveLength(2);
    expect(response.body).not.toContain('Untagged');
  });

  it('returns the series’ funkos when filtered by series', async () => {
    const { homecoming } = await seed();
    await createFunko({ name: 'No series' });

    const response = await api.inject({
      method: 'GET',
      url: '/export/funkos.csv',
      query: { seriesId: String(homecoming.id) },
    });

    expect(response.headers['content-disposition']).toBe('attachment; filename="series-homecoming.csv"');
    expect(csvLines(response.body)).toHaveLength(2);
  });

  it('returns 404 when the category does not exist', async () => {
    const response = await api.inject({ method: 'GET', url: '/export/funkos.csv', query: { categoryId: '999' } });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: 'NOT_FOUND' });
  });

  it.each([['seriesId'], ['collectionId'], ['tagId']])('returns 404 when the %s does not exist', async (filter) => {
    const response = await api.inject({ method: 'GET', url: '/export/funkos.csv', query: { [filter]: '999' } });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: 'NOT_FOUND' });
  });

  it('returns 400 when two filters are sent at once', async () => {
    const response = await api.inject({
      method: 'GET',
      url: '/export/funkos.csv',
      query: { categoryId: '1', tagId: '1' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });
});

describe('GET /export/funkos.json', () => {
  it('returns one entry per funko with its items inside when filtered by category', async () => {
    const { marvel, funko } = await seed();
    const wishlist = await createCollection({ name: 'Wishlist' });
    await createItem(wishlist.id, funko.id);
    await createFunko({ name: 'Loose Hulk', categoryId: marvel.id });

    const response = await api.inject({
      method: 'GET',
      url: '/export/funkos.json',
      query: { categoryId: String(marvel.id) },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-disposition']).toBe('attachment; filename="category-pop-marvel.json"');
    const body = response.json<{
      scope: unknown;
      funkos: { name: string; series: string | null; items: unknown[] }[];
    }>();
    expect(body.scope).toEqual({ kind: 'category', name: 'Pop! Marvel' });
    expect(body.funkos.map(({ name, series, items }) => ({ name, series, itemCount: items.length }))).toEqual([
      { name: 'Spider-Man, "Classic"', series: 'Homecoming', itemCount: 2 },
      { name: 'Loose Hulk', series: null, itemCount: 0 },
    ]);
    expect(body.funkos[0]?.items[0]).toMatchObject({ collection: 'Owned', purchasePrice: 14.99, tags: ['Box 3'] });
  });

  it('returns 404 when the tag does not exist', async () => {
    const response = await api.inject({ method: 'GET', url: '/export/funkos.json', query: { tagId: '999' } });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('GET /export/funkos.xlsx', () => {
  // An .xlsx is a zip file: it starts with the bytes "PK".
  const ZIP_SIGNATURE = 'PK';

  it('returns an .xlsx spreadsheet named after the collection when filtered by collection', async () => {
    const { owned } = await seed();

    const response = await api.inject({
      method: 'GET',
      url: '/export/funkos.xlsx',
      query: { collectionId: String(owned.id) },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(response.headers['content-disposition']).toBe('attachment; filename="collection-owned.xlsx"');
    expect(response.rawPayload.subarray(0, 2).toString('latin1')).toBe(ZIP_SIGNATURE);
  });

  it('returns 400 when the id is not a number', async () => {
    const response = await api.inject({ method: 'GET', url: '/export/funkos.xlsx', query: { seriesId: 'abc' } });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });
});

describe('GET /export/<list>.{csv,json,xlsx}', () => {
  function csvLines(body: string): string[] {
    return body.trim().split('\r\n');
  }

  it('returns every category with its funko count as CSV when funkos are not included', async () => {
    await seed();
    await createCategory('Empty line');

    const response = await api.inject({ method: 'GET', url: '/export/categories.csv' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-disposition']).toBe('attachment; filename="my-funko-collection-categories.csv"');
    expect(csvLines(response.body)).toEqual([
      'id,name,funko_count',
      expect.stringMatching(/^\d+,Empty line,0$/),
      expect.stringMatching(/^\d+,Pop! Marvel,1$/),
    ]);
  });

  it('returns each tagged item once when tags are exported with their funkos', async () => {
    const { owned, box, funko } = await seed();
    const shelf = await createTag('Shelf');
    await createItem(owned.id, (await createFunko({ name: 'Two tags' })).id, { tagIds: [box.id, shelf.id] });

    const response = await api.inject({ method: 'GET', url: '/export/tags.csv', query: { includeFunkos: 'true' } });

    expect(response.headers['content-disposition']).toBe(
      'attachment; filename="my-funko-collection-tags-with-funkos.csv"',
    );
    const lines = csvLines(response.body);
    expect(lines).toHaveLength(3);
    expect(lines.filter((line) => line.includes('Two tags'))).toHaveLength(1);
    expect(response.body).toContain(String(funko.id));
  });

  it('nests each collection’s funkos when collections are exported as JSON with funkos', async () => {
    const { owned } = await seed();
    await createCollection({ name: 'Wishlist' });

    const response = await api.inject({
      method: 'GET',
      url: '/export/collections.json',
      query: { includeFunkos: 'true' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json<{
      includesFunkos: boolean;
      entries: { id: number; name: string; totalSpent: number; funkos: unknown[] }[];
    }>();
    expect(body.includesFunkos).toBe(true);
    expect(body.entries.map(({ name, funkos }) => [name, funkos.length])).toEqual([
      ['Owned', 1],
      ['Wishlist', 0],
    ]);
    expect(body.entries.find((entry) => entry.id === owned.id)?.totalSpent).toBe(14.99);
  });

  it('leaves the funkos out of the JSON when they are not asked for', async () => {
    await seed();

    const response = await api.inject({ method: 'GET', url: '/export/series.json' });

    expect(response.json<{ entries: object[] }>().entries[0]).not.toHaveProperty('funkos');
  });

  it('folds each series shut over its funkos, on one sheet, when funkos are included', async () => {
    await seed();
    await createSeries('Empty series');

    const response = await api.inject({ method: 'GET', url: '/export/series.xlsx', query: { includeFunkos: 'true' } });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-disposition']).toBe(
      'attachment; filename="my-funko-collection-series-with-funkos.xlsx"',
    );
    expect(readXlsxFile(response.rawPayload, 'xl/worksheets/sheet2.xml')).toBeUndefined();
    const sheet = readXlsxFile(response.rawPayload, 'xl/worksheets/sheet1.xml') ?? '';
    // Header, "Empty series" (nothing to open), "Homecoming" (collapsed), its one funko (hidden inside the group).
    expect(sheet).toMatch(/<row r="3"[^>]*collapsed="1"/);
    expect(sheet).toMatch(/<row r="4"[^>]*outlineLevel="1"[^>]*hidden="1"/);
    // No filter arrows here: LibreOffice reads hidden rows inside a filter range as filtered out, not folded.
    expect(sheet).not.toContain('<autoFilter');
  });

  it('keeps the plain table when funkos are not included', async () => {
    await seed();

    const response = await api.inject({ method: 'GET', url: '/export/series.xlsx' });

    const sheet = readXlsxFile(response.rawPayload, 'xl/worksheets/sheet1.xml') ?? '';
    expect(sheet).not.toContain('outlineLevel');
    expect(sheet).toContain('<autoFilter ref="A1:C2"/>');
  });

  it('returns 400 when includeFunkos is not true or false', async () => {
    const response = await api.inject({ method: 'GET', url: '/export/tags.csv', query: { includeFunkos: 'yes' } });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });
});

describe('GET /export/funkos.{csv,json,xlsx}?funkoId=', () => {
  async function seedWithPhotos() {
    const { funko } = await seed();
    const images = [await makeImage({ width: 600, height: 800 }), await makeImage({ width: 800, height: 600 })];
    await api.inject({
      method: 'POST',
      url: `/funkos/${funko.id}/images`,
      payload: toFormData(images.map((buffer) => ({ buffer }))),
    });

    return funko;
  }

  it('links every image in full size when one funko is exported as JSON', async () => {
    const funko = await seedWithPhotos();

    const response = await api.inject({
      method: 'GET',
      url: '/export/funkos.json',
      query: { funkoId: String(funko.id) },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-disposition']).toBe('attachment; filename="funko-spider-man-classic.json"');
    const body = response.json<{ scope: unknown; funkos: { imageUrls: string[] }[] }>();
    expect(body.scope).toEqual({ kind: 'funko', name: 'Spider-Man, "Classic"' });
    expect(body.funkos).toHaveLength(1);
    expect(body.funkos[0]?.imageUrls).toEqual([
      expect.stringMatching(new RegExp(`^http://localhost:5173/uploads/funkos/${funko.id}/.+\\.webp$`)),
      expect.stringMatching(/\.webp$/),
    ]);
  });

  it('puts the image links in the last CSV column when one funko is exported as CSV', async () => {
    const funko = await seedWithPhotos();

    const response = await api.inject({
      method: 'GET',
      url: '/export/funkos.csv',
      query: { funkoId: String(funko.id) },
    });

    const [, line] = response.body.trim().split('\r\n');
    expect(line?.split(',').at(-1)?.split(' ')).toHaveLength(2);
  });

  it('embeds the images on a sheet of their own when one funko is exported as a spreadsheet', async () => {
    const funko = await seedWithPhotos();

    const response = await api.inject({
      method: 'GET',
      url: '/export/funkos.xlsx',
      query: { funkoId: String(funko.id) },
    });

    expect(response.statusCode).toBe(200);
    // The zip's file list: the Photos sheet and the two pictures stored inside the file.
    expect(response.rawPayload.includes('xl/worksheets/sheet2.xml')).toBe(true);
    expect(response.rawPayload.includes('xl/media/sheet2-image1.jpeg')).toBe(true);
    expect(response.rawPayload.includes('xl/media/sheet2-image2.jpeg')).toBe(true);
  });

  it('gives each image its own short Open link when one funko is exported as a spreadsheet', async () => {
    const funko = await seedWithPhotos();

    const response = await api.inject({
      method: 'GET',
      url: '/export/funkos.xlsx',
      query: { funkoId: String(funko.id) },
    });

    const sheet = readXlsxFile(response.rawPayload, 'xl/worksheets/sheet1.xml') ?? '';
    expect(sheet).toMatch(
      /<f>HYPERLINK\("http:\/\/localhost:5173\/uploads\/funkos\/\d+\/[^"]+\.webp","Open"\)<\/f>.*<f>HYPERLINK\("[^"]+","Open"\)<\/f>/,
    );
  });

  it('keeps the spreadsheet to one sheet when the funko has no images', async () => {
    const { funko } = await seed();

    const response = await api.inject({
      method: 'GET',
      url: '/export/funkos.xlsx',
      query: { funkoId: String(funko.id) },
    });

    expect(response.rawPayload.includes('xl/worksheets/sheet2.xml')).toBe(false);
  });

  it('returns 404 when the funko does not exist', async () => {
    const response = await api.inject({ method: 'GET', url: '/export/funkos.csv', query: { funkoId: '999' } });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('GET /export/images.{csv,json,xlsx}', () => {
  it('lists every stored image with its funko and absolute links, but no file, when exported as JSON', async () => {
    const { funko } = await seed();
    await api.inject({
      method: 'POST',
      url: `/funkos/${funko.id}/images`,
      payload: toFormData([{ buffer: await makeImage({ width: 600, height: 800 }) }]),
    });

    const response = await api.inject({ method: 'GET', url: '/export/images.json' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-disposition']).toBe('attachment; filename="my-funko-collection-images.json"');
    const body = response.json<{ images: { funkoId: number; funkoName: string; isMain: boolean; url: string }[] }>();
    expect(body.images).toHaveLength(1);
    expect(body.images[0]).toMatchObject({ funkoId: funko.id, funkoName: 'Spider-Man, "Classic"', isMain: true });
    expect(body.images[0]?.url).toMatch(/^http:\/\/localhost:5173\/uploads\/funkos\/\d+\/.+\.webp$/);
  });

  it('writes one CSV line per image with its links when exported as CSV', async () => {
    const { funko } = await seed();
    await api.inject({
      method: 'POST',
      url: `/funkos/${funko.id}/images`,
      payload: toFormData([{ buffer: await makeImage() }, { buffer: await makeImage({ width: 70 }) }]),
    });

    const response = await api.inject({ method: 'GET', url: '/export/images.csv' });

    const lines = response.body.trim().split('\r\n');
    expect(lines[0]).toBe(
      'funko_id,funko_name,funko_number,file_name,is_main,width,height,size_bytes,uploaded_at,url,medium_url,small_url',
    );
    expect(lines).toHaveLength(3);
  });

  it('returns a spreadsheet of the images when exported as xlsx', async () => {
    const response = await api.inject({ method: 'GET', url: '/export/images.xlsx' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-disposition']).toBe('attachment; filename="my-funko-collection-images.xlsx"');
  });
});
