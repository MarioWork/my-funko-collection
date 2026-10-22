import { buildApp, type App } from '../../app.ts';
import { prepareTestDb, resetTestDb } from '../../db/testDb.ts';
import { createCategory, createCollection, createFunko, createTag } from '../../testFixtures.ts';

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

describe('GET /suggest', () => {
  it('returns matching funkos, categories, collections and tags at once', async () => {
    const marvel = await createCategory('Pop! Marvel');
    await createFunko({ name: 'Captain Marvel', categoryId: marvel.id });
    await createFunko({ name: 'Groot', categoryId: marvel.id });
    await createCollection({ name: 'Marvel shelf' });
    await createTag('Marvel box');
    await createTag('Box 1');

    const response = await app.inject({ method: 'GET', url: '/suggest', query: { q: 'marvel' } });

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

  it('returns 400 without a query', async () => {
    const response = await app.inject({ method: 'GET', url: '/suggest' });

    expect(response.statusCode).toBe(400);
  });
});
