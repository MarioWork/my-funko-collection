import { buildApp, type App } from '../../../app.ts';
import { resetTestDb } from '../../../testDb.ts';
import {
  createCategory,
  createCollection,
  createFunko,
  createItem,
  createSeries,
  createTag,
  type SignedInClient,
  signIn,
} from '../../../testFixtures.ts';

const MISSING_ID = 999;
const INVALID_ID = 'abc';
// One past the largest Postgres integer, the type of the price column.
const PRICE_PAST_INTEGER_RANGE = 2_147_483_648;

type ItemBody = {
  id: number;
  collection: { id: number; name: string };
  funko: { id: number; name: string; category: { name: string } };
  quantity: number;
  condition: string | null;
  purchasePriceCents: number | null;
  purchaseCurrency: string;
  purchasedAt: string | null;
  notes: string | null;
  tags: { id: number; name: string }[];
};
type ListBody = { data: ItemBody[]; totalResultNumber: number };

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

function itemsUrl(collectionId: number): string {
  return `/collections/${collectionId}/items`;
}

async function seed() {
  const owned = await createCollection({ name: 'Owned', isDefault: true });
  const wishlist = await createCollection({ name: 'Wishlist' });
  const marvel = await createCategory('Pop! Marvel');
  const spiderMan = await createFunko({ name: 'Spider-Man', number: '03', categoryId: marvel.id });
  const vader = await createFunko({ name: 'Darth Vader', number: '01' });
  const box = await createTag('Box 3');
  const shelf = await createTag('Shelf');

  return { owned, wishlist, marvel, spiderMan, vader, box, shelf };
}

describe('GET /collections/:collectionId/items', () => {
  it('lists the items of one collection with funko summary and tags when no params are sent', async () => {
    const { owned, wishlist, spiderMan, vader, box } = await seed();
    await createItem(owned.id, spiderMan.id, { tagIds: [box.id], purchasePriceCents: 1499 });
    await createItem(wishlist.id, vader.id);

    const response = await api.inject({ method: 'GET', url: itemsUrl(owned.id) });

    expect(response.statusCode).toBe(200);
    const body = response.json<ListBody>();
    expect(body.totalResultNumber).toBe(1);
    expect(body.data[0]).toMatchObject({
      collection: { name: 'Owned' },
      funko: { name: 'Spider-Man', category: { name: 'Pop! Marvel' } },
      purchasePriceCents: 1499,
      purchaseCurrency: 'EUR',
      tags: [{ name: 'Box 3' }],
    });
  });

  it('filters by tag, condition and purchase date range and sorts by price when those params are sent', async () => {
    const { owned, spiderMan, vader, box } = await seed();
    const third = await createFunko({ name: 'Groot' });
    await createItem(owned.id, spiderMan.id, {
      tagIds: [box.id],
      condition: 'MINT_IN_BOX',
      purchasePriceCents: 1499,
      purchasedAt: '2024-03-02',
    });
    await createItem(owned.id, vader.id, {
      condition: 'MINT_IN_BOX',
      purchasePriceCents: 899,
      purchasedAt: '2022-12-24',
    });
    await createItem(owned.id, third.id, {
      condition: 'OUT_OF_BOX',
      purchasePriceCents: 2999,
      purchasedAt: '2025-01-01',
    });

    const byTag = await api.inject({ method: 'GET', url: itemsUrl(owned.id), query: { tagId: String(box.id) } });
    const byCondition = await api.inject({
      method: 'GET',
      url: itemsUrl(owned.id),
      query: { condition: 'MINT_IN_BOX' },
    });
    const byDate = await api.inject({
      method: 'GET',
      url: itemsUrl(owned.id),
      query: { purchasedFrom: '2024-01-01', purchasedTo: '2024-12-31' },
    });
    const byPrice = await api.inject({
      method: 'GET',
      url: itemsUrl(owned.id),
      query: { sorting_fields: 'PURCHASE_PRICE', direction: 'DESC' },
    });

    expect(byTag.json<ListBody>().data.map((item) => item.funko.name)).toEqual(['Spider-Man']);
    expect(byCondition.json<ListBody>().totalResultNumber).toBe(2);
    expect(byDate.json<ListBody>().data.map((item) => item.funko.name)).toEqual(['Spider-Man']);
    expect(byPrice.json<ListBody>().data.map((item) => item.purchasePriceCents)).toEqual([2999, 1499, 899]);
  });

  it('keeps the series items and embeds the series in the funko summary when seriesId is set', async () => {
    const { owned, spiderMan, vader } = await seed();
    const mandalorian = await createSeries('The Mandalorian');
    const grogu = await createFunko({ name: 'Grogu', seriesId: mandalorian.id });
    await createItem(owned.id, spiderMan.id);
    await createItem(owned.id, vader.id);
    await createItem(owned.id, grogu.id);

    const response = await api.inject({
      method: 'GET',
      url: itemsUrl(owned.id),
      query: { seriesId: String(mandalorian.id) },
    });

    const body = response.json<ListBody>();
    expect(body.totalResultNumber).toBe(1);
    expect(body.data[0]?.funko).toMatchObject({
      name: 'Grogu',
      series: { id: mandalorian.id, name: 'The Mandalorian' },
    });
  });

  it('returns 400 with VALIDATION_ERROR when the condition is unknown', async () => {
    const { owned } = await seed();

    const response = await api.inject({ method: 'GET', url: itemsUrl(owned.id), query: { condition: 'SHINY' } });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 404 when the collection does not exist', async () => {
    const response = await api.inject({ method: 'GET', url: itemsUrl(MISSING_ID) });

    expect(response.statusCode).toBe(404);
  });
});

describe('GET /collections/:collectionId/items/:itemId', () => {
  it('returns the item with its funko and tags when it is in the collection', async () => {
    const { owned, spiderMan, box } = await seed();
    const item = await createItem(owned.id, spiderMan.id, { tagIds: [box.id], notes: 'Gift' });

    const response = await api.inject({ method: 'GET', url: `${itemsUrl(owned.id)}/${item.id}` });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      id: item.id,
      collection: { id: owned.id, name: 'Owned' },
      funko: { id: spiderMan.id, name: 'Spider-Man' },
      notes: 'Gift',
      tags: [{ id: box.id, name: 'Box 3' }],
    });
  });

  it('returns 400 when the item id is not a positive integer', async () => {
    const { owned } = await seed();

    const response = await api.inject({ method: 'GET', url: `${itemsUrl(owned.id)}/${INVALID_ID}` });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 404 when the item is in another collection', async () => {
    const { owned, wishlist, spiderMan } = await seed();
    const item = await createItem(wishlist.id, spiderMan.id);

    const response = await api.inject({ method: 'GET', url: `${itemsUrl(owned.id)}/${item.id}` });

    expect(response.statusCode).toBe(404);
  });
});

describe('GET /items', () => {
  it('lists items across collections and narrows them when collectionId or tagId is set', async () => {
    const { owned, wishlist, spiderMan, vader, box } = await seed();
    await createItem(owned.id, spiderMan.id, { tagIds: [box.id] });
    await createItem(wishlist.id, vader.id, { tagIds: [box.id] });

    const all = await api.inject({ method: 'GET', url: '/items', query: { tagId: String(box.id) } });
    const onlyWishlist = await api.inject({
      method: 'GET',
      url: '/items',
      query: { collectionId: String(wishlist.id) },
    });

    expect(all.json<ListBody>().totalResultNumber).toBe(2);
    expect(onlyWishlist.json<ListBody>().data.map((item) => item.funko.name)).toEqual(['Darth Vader']);
  });

  it('returns 400 with VALIDATION_ERROR when a date filter is not an ISO date', async () => {
    const response = await api.inject({ method: 'GET', url: '/items', query: { purchasedFrom: '02/03/2024' } });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });
});

describe('POST /collections/:collectionId/items', () => {
  it('adds the funko with tags, price and date and returns 201 when every field is valid', async () => {
    const { owned, spiderMan, box, shelf } = await seed();

    const response = await api.inject({
      method: 'POST',
      url: itemsUrl(owned.id),
      payload: {
        funkoId: spiderMan.id,
        quantity: 2,
        condition: 'MINT_IN_BOX',
        purchasePriceCents: 1499,
        purchasedAt: '2024-03-02',
        notes: 'Birthday gift',
        tagIds: [box.id, shelf.id],
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      quantity: 2,
      condition: 'MINT_IN_BOX',
      purchasePriceCents: 1499,
      purchasedAt: '2024-03-02',
      notes: 'Birthday gift',
      tags: [{ name: 'Box 3' }, { name: 'Shelf' }],
    });
  });

  it('returns 400 with VALIDATION_ERROR when the price is past the integer range', async () => {
    const { owned, spiderMan } = await seed();

    const response = await api.inject({
      method: 'POST',
      url: itemsUrl(owned.id),
      payload: { funkoId: spiderMan.id, purchasePriceCents: PRICE_PAST_INTEGER_RANGE },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 409 with the existing item id when the funko is already in the collection', async () => {
    const { owned, spiderMan } = await seed();
    const existing = await createItem(owned.id, spiderMan.id);

    const response = await api.inject({ method: 'POST', url: itemsUrl(owned.id), payload: { funkoId: spiderMan.id } });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ code: 'CONFLICT', existingId: existing.id });
  });

  it('returns 400 when the quantity is zero or the date is malformed', async () => {
    const { owned, spiderMan } = await seed();

    const zeroQuantity = await api.inject({
      method: 'POST',
      url: itemsUrl(owned.id),
      payload: { funkoId: spiderMan.id, quantity: 0 },
    });
    const badDate = await api.inject({
      method: 'POST',
      url: itemsUrl(owned.id),
      payload: { funkoId: spiderMan.id, purchasedAt: '02/03/2024' },
    });

    expect(zeroQuantity.statusCode).toBe(400);
    expect(badDate.statusCode).toBe(400);
  });

  it('returns 404 when a tag does not exist', async () => {
    const { owned, spiderMan } = await seed();

    const response = await api.inject({
      method: 'POST',
      url: itemsUrl(owned.id),
      payload: { funkoId: spiderMan.id, tagIds: [MISSING_ID] },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: 'NOT_FOUND', message: `Tag ${MISSING_ID} not found` });
  });

  it('returns 404 when the funko does not exist', async () => {
    const { owned } = await seed();

    const response = await api.inject({ method: 'POST', url: itemsUrl(owned.id), payload: { funkoId: MISSING_ID } });

    expect(response.statusCode).toBe(404);
  });

  it('returns 404 when the collection does not exist', async () => {
    const { spiderMan } = await seed();

    const response = await api.inject({
      method: 'POST',
      url: itemsUrl(MISSING_ID),
      payload: { funkoId: spiderMan.id },
    });

    expect(response.statusCode).toBe(404);
  });
});

describe('PATCH /collections/:collectionId/items/:itemId', () => {
  it('replaces the tag set when tagIds is sent and keeps it when it is not', async () => {
    const { owned, spiderMan, box, shelf } = await seed();
    const item = await createItem(owned.id, spiderMan.id, { tagIds: [box.id] });

    const replaced = await api.inject({
      method: 'PATCH',
      url: `${itemsUrl(owned.id)}/${item.id}`,
      payload: { tagIds: [shelf.id] },
    });
    const untouched = await api.inject({
      method: 'PATCH',
      url: `${itemsUrl(owned.id)}/${item.id}`,
      payload: { notes: 'Moved shelves' },
    });

    expect(replaced.json<ItemBody>().tags).toEqual([{ id: shelf.id, name: 'Shelf' }]);
    expect(untouched.json<ItemBody>()).toMatchObject({ notes: 'Moved shelves', tags: [{ name: 'Shelf' }] });
  });

  it('returns 400 when the body tries to change the funko', async () => {
    const { owned, spiderMan, vader } = await seed();
    const item = await createItem(owned.id, spiderMan.id);

    const response = await api.inject({
      method: 'PATCH',
      url: `${itemsUrl(owned.id)}/${item.id}`,
      payload: { funkoId: vader.id },
    });

    expect(response.statusCode).toBe(400);
  });

  it('returns 404 when the item is in another collection', async () => {
    const { owned, wishlist, spiderMan } = await seed();
    const item = await createItem(wishlist.id, spiderMan.id);

    const response = await api.inject({
      method: 'PATCH',
      url: `${itemsUrl(owned.id)}/${item.id}`,
      payload: { notes: 'x' },
    });

    expect(response.statusCode).toBe(404);
  });
});

describe('POST /collections/:collectionId/items/:itemId/move', () => {
  it('moves the item and keeps its tags and notes when the target collection does not have the funko', async () => {
    const { owned, wishlist, spiderMan, box } = await seed();
    const item = await createItem(wishlist.id, spiderMan.id, { tagIds: [box.id], notes: 'Wanted' });

    const response = await api.inject({
      method: 'POST',
      url: `${itemsUrl(wishlist.id)}/${item.id}/move`,
      payload: { toCollectionId: owned.id },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      collection: { name: 'Owned' },
      notes: 'Wanted',
      tags: [{ name: 'Box 3' }],
    });
    const gone = await api.inject({ method: 'GET', url: `${itemsUrl(wishlist.id)}/${item.id}` });
    expect(gone.statusCode).toBe(404);
  });

  it('returns 409 when the funko is already in the target collection', async () => {
    const { owned, wishlist, spiderMan } = await seed();
    await createItem(owned.id, spiderMan.id);
    const item = await createItem(wishlist.id, spiderMan.id);

    const response = await api.inject({
      method: 'POST',
      url: `${itemsUrl(wishlist.id)}/${item.id}/move`,
      payload: { toCollectionId: owned.id },
    });

    expect(response.statusCode).toBe(409);
  });

  it('returns 400 when the target is the collection the item is already in', async () => {
    const { wishlist, spiderMan } = await seed();
    const item = await createItem(wishlist.id, spiderMan.id);

    const response = await api.inject({
      method: 'POST',
      url: `${itemsUrl(wishlist.id)}/${item.id}/move`,
      payload: { toCollectionId: wishlist.id },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 404 when the target collection does not exist', async () => {
    const { wishlist, spiderMan } = await seed();
    const item = await createItem(wishlist.id, spiderMan.id);

    const response = await api.inject({
      method: 'POST',
      url: `${itemsUrl(wishlist.id)}/${item.id}/move`,
      payload: { toCollectionId: MISSING_ID },
    });

    expect(response.statusCode).toBe(404);
  });
});

describe('DELETE /collections/:collectionId/items/:itemId', () => {
  it('removes the item and keeps the funko when the item is in the collection', async () => {
    const { owned, spiderMan } = await seed();
    const item = await createItem(owned.id, spiderMan.id);

    const response = await api.inject({ method: 'DELETE', url: `${itemsUrl(owned.id)}/${item.id}` });

    expect(response.statusCode).toBe(204);
    expect((await api.inject({ method: 'GET', url: `/funkos/${spiderMan.id}` })).statusCode).toBe(200);
  });

  it('returns 400 when the item id is not a positive integer', async () => {
    const { owned } = await seed();

    const response = await api.inject({ method: 'DELETE', url: `${itemsUrl(owned.id)}/${INVALID_ID}` });

    expect(response.statusCode).toBe(400);
  });

  it('returns 404 when the item is in another collection', async () => {
    const { owned, wishlist, spiderMan } = await seed();
    const item = await createItem(wishlist.id, spiderMan.id);

    const response = await api.inject({ method: 'DELETE', url: `${itemsUrl(owned.id)}/${item.id}` });

    expect(response.statusCode).toBe(404);
  });
});
