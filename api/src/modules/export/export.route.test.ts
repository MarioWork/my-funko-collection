import { buildApp, type App } from '../../app.ts';
import { prepareTestDb, resetTestDb } from '../../db/testDb.ts';
import {
  createCategory,
  createCollection,
  createFunko,
  createItem,
  createSeries,
  createTag,
} from '../../testFixtures.ts';

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
  it('returns every table as one JSON download', async () => {
    const { funko, box, homecoming } = await seed();

    const response = await app.inject({ method: 'GET', url: '/export' });

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
  it('writes one quoted line per item with the price in units', async () => {
    const { funko } = await seed();

    const response = await app.inject({ method: 'GET', url: '/export/items.csv' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
    const [header, line] = response.body.split('\r\n');
    expect(header).toBe(
      'collection,funko_id,name,number,category,series,type,is_chase,exclusive,barcode,quantity,condition,purchase_price,purchase_currency,purchased_at,tags,notes',
    );
    expect(line).toBe(
      `Owned,${funko.id},"Spider-Man, ""Classic""",03,Pop! Marvel,Homecoming,POP,false,,,1,,14.99,EUR,2024-03-02,Box 3,`,
    );
  });
});
