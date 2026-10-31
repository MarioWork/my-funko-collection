// Tags belong to one user, like collections (docs/adr/0001-shared-catalogue-own-collections.md): two users never see
// or use each other's, and another user's tag id answers 404 like one that does not exist.
import { buildApp, type App } from '../../app.ts';
import { resetTestDb } from '../../testDb.ts';
import {
  createFunko,
  createItem,
  createTag,
  createUser,
  defaultCollectionId,
  type SignedInClient,
  signIn,
} from '../../testFixtures.ts';

type Named = { id: number; name: string };
type Page<Row> = { data: Row[]; totalResultNumber: number };

let app: App;
let me: SignedInClient;
let them: SignedInClient;
let myTag: Named;
let theirTag: Named;

beforeAll(async () => {
  app = await buildApp();
});

afterAll(async () => {
  await app.close();
});

// The signed-in test user ("me") and a second user ("them"), each with their own "Box 1".
beforeEach(async () => {
  await resetTestDb();
  me = await signIn(app);
  them = await signIn(app, { userId: (await createUser()).id });
  myTag = await createTag('Box 1');
  theirTag = await createTag('Box 1', them.userId);
});

describe('GET /tags', () => {
  it('lists only the signed-in user’s tags when another user has one with the same name', async () => {
    await createTag('Shelf', them.userId);

    const response = await me.inject({ method: 'GET', url: '/tags' });

    expect(response.json<Page<Named>>()).toMatchObject({ data: [myTag], totalResultNumber: 1 });
  });
});

describe('GET|PATCH|DELETE /tags/:tagId', () => {
  it('returns 404 and leaves the tag as it was when another user reads, renames or deletes it', async () => {
    const url = `/tags/${theirTag.id}`;

    const read = await me.inject({ method: 'GET', url });
    const rename = await me.inject({ method: 'PATCH', url, payload: { name: 'Mine now' } });
    const remove = await me.inject({ method: 'DELETE', url });

    expect([read.statusCode, rename.statusCode, remove.statusCode]).toEqual([404, 404, 404]);
    const stillTheirs = await them.inject({ method: 'GET', url });
    expect(stillTheirs.json()).toMatchObject({ name: 'Box 1' });
  });
});

describe('POST /tags', () => {
  it('creates the tag when only another user has that name', async () => {
    const response = await me.inject({ method: 'POST', url: '/tags', payload: { name: 'Shelf' } });
    const theirs = await them.inject({ method: 'POST', url: '/tags', payload: { name: 'Shelf' } });

    expect([response.statusCode, theirs.statusCode]).toEqual([201, 201]);
  });

  it('returns 409 when the user already has a tag with that name', async () => {
    const response = await me.inject({ method: 'POST', url: '/tags', payload: { name: 'Box 1' } });

    expect(response.statusCode).toBe(409);
  });
});

describe('PATCH /tags/:tagId', () => {
  it('renames the tag when only another user has the new name', async () => {
    await createTag('Shelf', them.userId);

    const response = await me.inject({ method: 'PATCH', url: `/tags/${myTag.id}`, payload: { name: 'Shelf' } });

    expect(response.statusCode).toBe(200);
  });
});

describe('POST|PATCH /collections/:collectionId/items', () => {
  it('returns 404 and tags nothing when the user puts another user’s tag on their own item', async () => {
    const myOwnedId = await defaultCollectionId(me.userId);
    const myItem = await createItem(myOwnedId, (await createFunko()).id, { tagIds: [myTag.id] });

    const create = await me.inject({
      method: 'POST',
      url: `/collections/${myOwnedId}/items`,
      payload: { funkoId: (await createFunko()).id, tagIds: [theirTag.id] },
    });
    const update = await me.inject({
      method: 'PATCH',
      url: `/collections/${myOwnedId}/items/${myItem.id}`,
      payload: { tagIds: [myTag.id, theirTag.id] },
    });

    expect([create.statusCode, update.statusCode]).toEqual([404, 404]);
    const item = await me.inject({ method: 'GET', url: `/collections/${myOwnedId}/items/${myItem.id}` });
    expect(item.json<{ tags: Named[] }>().tags).toEqual([myTag]);
    const myItems = await me.inject({ method: 'GET', url: '/items' });
    expect(myItems.json<Page<{ id: number }>>().totalResultNumber).toBe(1);
  });

  it('returns 404 when the user puts their own tag on another user’s item', async () => {
    const theirOwnedId = await defaultCollectionId(them.userId);
    const theirItem = await createItem(theirOwnedId, (await createFunko()).id);

    const response = await me.inject({
      method: 'PATCH',
      url: `/collections/${theirOwnedId}/items/${theirItem.id}`,
      payload: { tagIds: [myTag.id] },
    });

    expect(response.statusCode).toBe(404);
  });
});

describe('GET /items and GET /funkos', () => {
  it('finds nothing when filtering or searching by another user’s tag, its name, or by having tags', async () => {
    const funko = await createFunko({ name: 'Grogu' });
    await createItem(await defaultCollectionId(them.userId), funko.id, { tagIds: [theirTag.id] });
    await createTag('Signed', them.userId);

    const itemsByTheirTag = await me.inject({ method: 'GET', url: `/items?tagId=${theirTag.id}` });
    const funkosByTheirTag = await me.inject({ method: 'GET', url: `/funkos?tagId=${theirTag.id}` });
    const funkosByTagName = await me.inject({ method: 'GET', url: '/funkos?tag=Box' });
    const funkosWithTags = await me.inject({ method: 'GET', url: '/funkos?hasTags=true' });
    const funkosSearchedByTagName = await me.inject({ method: 'GET', url: '/funkos?q=Box' });

    expect(itemsByTheirTag.json()).toMatchObject({ data: [], totalResultNumber: 0 });
    expect(funkosByTheirTag.json()).toMatchObject({ data: [], totalResultNumber: 0 });
    expect(funkosByTagName.json()).toMatchObject({ data: [], totalResultNumber: 0 });
    expect(funkosWithTags.json()).toMatchObject({ data: [], totalResultNumber: 0 });
    expect(funkosSearchedByTagName.json()).toMatchObject({ data: [], totalResultNumber: 0 });
  });
});

describe('GET /suggest', () => {
  it('suggests only the signed-in user’s tags when another user has a matching one', async () => {
    await createTag('Box 2', them.userId);

    const response = await me.inject({ method: 'GET', url: '/suggest?q=box' });

    expect(response.json<{ tags: Named[] }>().tags).toEqual([myTag]);
  });
});

describe('GET /stats', () => {
  it('counts only the signed-in user’s tags when another user has some', async () => {
    await createTag('Shelf', them.userId);

    const response = await me.inject({ method: 'GET', url: '/stats' });

    expect(response.json<{ tagCount: number }>().tagCount).toBe(1);
  });
});

describe('GET /export', () => {
  it('exports only the signed-in user’s tags when another user has some', async () => {
    const response = await me.inject({ method: 'GET', url: '/export' });

    expect(response.json<{ tags: Named[] }>().tags.map(({ id }) => id)).toEqual([myTag.id]);
  });

  it('returns 404 when exporting the funkos of another user’s tag', async () => {
    const response = await me.inject({ method: 'GET', url: `/export/funkos.csv?tagId=${theirTag.id}` });

    expect(response.statusCode).toBe(404);
  });
});
