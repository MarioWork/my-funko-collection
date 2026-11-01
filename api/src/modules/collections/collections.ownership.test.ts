// Collections and items belong to one user (docs/adr/0001-shared-catalogue-own-collections.md): two users never see
// or touch each other's, and another user's id answers 404 like one that does not exist.
import { buildApp, type App } from '../../app.ts';
import { resetTestDb } from '../../testDb.ts';
import {
  createCollection,
  createFunko,
  createItem,
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
let theirCollection: Named;
let theirItemId: number;
let funkoId: number;

beforeAll(async () => {
  app = await buildApp();
});

afterAll(async () => {
  await app.close();
});

// The signed-in test user ("me") and a second user ("them"), each with their own "For sale" holding one funko.
beforeEach(async () => {
  await resetTestDb();
  me = await signIn(app);
  them = await signIn(app, { userId: (await createUser()).id });
  funkoId = (await createFunko({ name: 'Grogu' })).id;
  theirCollection = await createCollection({ name: 'For sale', userId: them.userId });
  theirItemId = (await createItem(theirCollection.id, funkoId, { notes: 'theirs' })).id;
  await createItem((await createCollection({ name: 'For sale' })).id, funkoId);
});

describe('GET /collections (a second user)', () => {
  it('lists the user’s own "Owned" as the default and "Wishlist" when the user was just made', async () => {
    const response = await them.inject({ method: 'GET', url: '/collections' });

    const rows = response.json<Page<Named & { isDefault: boolean }>>().data;
    expect(rows.map(({ name, isDefault }) => ({ name, isDefault }))).toEqual([
      { name: 'For sale', isDefault: false },
      { name: 'Owned', isDefault: true },
      { name: 'Wishlist', isDefault: false },
    ]);
  });
});

describe('GET /collections', () => {
  it('lists only the signed-in user’s collections when another user has the same names', async () => {
    const response = await me.inject({ method: 'GET', url: '/collections' });

    const rows = response.json<Page<Named>>().data;
    expect(rows.map(({ name }) => name)).toEqual(['For sale', 'Owned', 'Wishlist']);
    expect(rows.map(({ id }) => id)).not.toContain(theirCollection.id);
  });
});

describe('GET|PATCH|DELETE /collections/:collectionId', () => {
  it('returns 404 and leaves the collection as it was when another user reads, renames or deletes it', async () => {
    const url = `/collections/${theirCollection.id}`;

    const read = await me.inject({ method: 'GET', url });
    const rename = await me.inject({ method: 'PATCH', url, payload: { name: 'Mine now' } });
    const makeDefault = await me.inject({ method: 'PATCH', url, payload: { isDefault: true } });
    const remove = await me.inject({ method: 'DELETE', url });

    expect([read.statusCode, rename.statusCode, makeDefault.statusCode, remove.statusCode]).toEqual([
      404, 404, 404, 404,
    ]);
    const stillTheirs = await them.inject({ method: 'GET', url });
    expect(stillTheirs.json()).toMatchObject({ name: 'For sale', isDefault: false, itemCount: 1 });
  });
});

describe('POST /collections', () => {
  it('creates the collection and moves only the user’s own default when another user already has that name', async () => {
    const created = await me.inject({
      method: 'POST',
      url: '/collections',
      payload: { name: 'Display', isDefault: true },
    });
    await them.inject({ method: 'POST', url: '/collections', payload: { name: 'Display' } });

    expect(created.statusCode).toBe(201);
    const theirDefault = await them.inject({
      method: 'GET',
      url: `/collections/${await defaultCollectionId(them.userId)}`,
    });
    expect(theirDefault.json()).toMatchObject({ name: 'Owned', isDefault: true });
  });
});

describe('GET|POST|PATCH|DELETE /collections/:collectionId/items/*', () => {
  it('returns 404 on every item route when the collection is another user’s', async () => {
    const itemsUrl = `/collections/${theirCollection.id}/items`;
    const itemUrl = `${itemsUrl}/${theirItemId}`;
    const myOwnedId = await defaultCollectionId(me.userId);

    const responses = await Promise.all([
      me.inject({ method: 'GET', url: itemsUrl }),
      me.inject({ method: 'POST', url: itemsUrl, payload: { funkoId: (await createFunko()).id } }),
      me.inject({ method: 'GET', url: itemUrl }),
      me.inject({ method: 'PATCH', url: itemUrl, payload: { quantity: 9 } }),
      me.inject({ method: 'POST', url: `${itemUrl}/move`, payload: { toCollectionId: myOwnedId } }),
      me.inject({ method: 'DELETE', url: itemUrl }),
    ]);

    expect(responses.map((response) => response.statusCode)).toEqual([404, 404, 404, 404, 404, 404]);
    const stillTheirs = await them.inject({ method: 'GET', url: itemUrl });
    expect(stillTheirs.json()).toMatchObject({ quantity: 1, notes: 'theirs', collection: { id: theirCollection.id } });
  });

  it('returns 404 when moving the user’s own item into another user’s collection', async () => {
    const myOwnedId = await defaultCollectionId(me.userId);
    const myItem = await createItem(myOwnedId, (await createFunko()).id);

    const response = await me.inject({
      method: 'POST',
      url: `/collections/${myOwnedId}/items/${myItem.id}/move`,
      payload: { toCollectionId: theirCollection.id },
    });

    expect(response.statusCode).toBe(404);
  });
});

describe('GET /items', () => {
  it('lists only the signed-in user’s items, even when asked for another user’s collection', async () => {
    const everything = await me.inject({ method: 'GET', url: '/items' });
    const theirs = await me.inject({ method: 'GET', url: `/items?collectionId=${theirCollection.id}` });

    const rows = everything.json<Page<{ id: number; collection: Named }>>().data;
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).not.toBe(theirItemId);
    expect(theirs.json()).toMatchObject({ data: [], totalResultNumber: 0 });
  });
});

describe('GET /funkos', () => {
  it('shows only the signed-in user’s collections on a funko both users have', async () => {
    const detail = await me.inject({ method: 'GET', url: `/funkos/${funkoId}` });
    const list = await me.inject({ method: 'GET', url: '/funkos' });

    const myForSale = detail.json<{ collections: Named[] }>().collections;
    expect(myForSale).toHaveLength(1);
    expect(myForSale[0]?.id).not.toBe(theirCollection.id);
    expect(list.json<Page<{ collections: Named[] }>>().data[0]?.collections).toEqual(myForSale);
  });

  it('narrows by the signed-in user’s collections only when filtering or searching by collection', async () => {
    const theirsOnly = await createFunko({ name: 'Kratos' });
    await createItem(await defaultCollectionId(them.userId), theirsOnly.id);

    const inMine = await me.inject({ method: 'GET', url: '/funkos?hasCollections=true' });
    const inNone = await me.inject({ method: 'GET', url: '/funkos?hasCollections=false' });
    const byTheirId = await me.inject({ method: 'GET', url: `/funkos?collectionId=${theirCollection.id}` });

    expect(inMine.json<Page<Named>>().data.map(({ name }) => name)).toEqual(['Grogu']);
    expect(inNone.json<Page<Named>>().data.map(({ name }) => name)).toEqual(['Kratos']);
    expect(byTheirId.json()).toMatchObject({ data: [], totalResultNumber: 0 });
  });
});

describe('DELETE /funkos/:funkoId', () => {
  it('names only the user’s own collections when a funko another user has cannot be deleted', async () => {
    const response = await me.inject({ method: 'DELETE', url: `/funkos/${funkoId}` });

    expect(response.statusCode).toBe(409);
    expect(response.json<{ message: string }>().message).toBe(
      'The funko is in "For sale", the collections of 1 other user. Send force=true and a reason to remove it from them and delete it',
    );
  });
});

describe('GET /suggest', () => {
  it('suggests only the signed-in user’s collections when another user has a matching one', async () => {
    await createCollection({ name: 'Signed boxes', userId: them.userId });

    const response = await me.inject({ method: 'GET', url: '/suggest?q=s' });

    const names = response.json<{ collections: Named[] }>().collections.map(({ name }) => name);
    expect(names).not.toContain('Signed boxes');
    expect(response.json<{ collections: Named[] }>().collections.map(({ id }) => id)).not.toContain(theirCollection.id);
  });
});
