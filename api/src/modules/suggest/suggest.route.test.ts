import { buildApp, type App } from '../../app.ts';
import { prepareTestDb, resetTestDb } from '../../db/testDb.ts';
import {
  createCategory,
  createCollection,
  createFunko,
  createSeries,
  createTag,
  type SignedInClient,
  signIn,
} from '../../testFixtures.ts';

let app: App;
let api: SignedInClient;

beforeAll(async () => {
  app = await buildApp();
  await prepareTestDb();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await resetTestDb();
  api = await signIn(app);
});

describe('GET /suggest', () => {
  it('returns the matching funkos, categories, collections and tags at once when q matches each', async () => {
    const marvel = await createCategory('Pop! Marvel');
    await createFunko({ name: 'Captain Marvel', categoryId: marvel.id });
    await createFunko({ name: 'Groot', categoryId: marvel.id });
    await createCollection({ name: 'Marvel shelf' });
    await createTag('Marvel box');
    await createTag('Box 1');

    const response = await api.inject({ method: 'GET', url: '/suggest', query: { q: 'marvel' } });

    expect(response.statusCode).toBe(200);
    const body = response.json<{
      funkos: { name: string }[];
      categories: { name: string }[];
      collections: { name: string }[];
      tags: { name: string }[];
    }>();
    expect(body.funkos.map((funko) => funko.name)).toEqual(['Captain Marvel', 'Groot']);
    expect(body.categories.map((category) => category.name)).toEqual(['Pop! Marvel']);
    expect(body.collections.map((collection) => collection.name)).toEqual(['Marvel shelf']);
    expect(body.tags.map((tag) => tag.name)).toEqual(['Marvel box']);
  });

  it('returns the matching series and their funkos carrying the series when q matches a series name', async () => {
    const mandalorian = await createSeries('The Mandalorian');
    await createSeries('Stranger Things');
    await createFunko({ name: 'Grogu', seriesId: mandalorian.id });

    const response = await api.inject({ method: 'GET', url: '/suggest', query: { q: 'mandalorian' } });

    const body = response.json<{ funkos: { name: string; series: unknown }[]; series: unknown[] }>();
    expect(body.series).toEqual([{ id: mandalorian.id, name: 'The Mandalorian' }]);
    expect(body.funkos).toEqual([
      expect.objectContaining({ name: 'Grogu', series: { id: mandalorian.id, name: 'The Mandalorian' } }),
    ]);
  });

  it('returns 400 when q is missing', async () => {
    const response = await api.inject({ method: 'GET', url: '/suggest' });

    expect(response.statusCode).toBe(400);
  });
});
