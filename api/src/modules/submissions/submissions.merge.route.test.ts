// An admin merges a submission into a funko already in the catalogue (docs/GLOSSARY.md "Merge"): the sender's items
// move onto that funko, a clash in one collection becomes one item, and the submission reads as merged.
import { buildApp, type App } from '../../app.ts';
import { resetTestDb } from '../../testDb.ts';
import {
  createCollection,
  createFunko,
  createItem,
  createTag,
  createUser,
  defaultCollectionId,
  deleteUser,
  type SignedInClient,
  signIn,
} from '../../testFixtures.ts';

let app: App;
let admin: SignedInClient;
let member: SignedInClient;

type ItemBody = {
  id: number;
  collection: { id: number };
  quantity: number;
  condition: string | null;
  purchasePriceCents: number | null;
  notes: string | null;
  funko: { id: number };
  tags: { id: number; name: string }[];
};
type ListBody<Row> = { data: Row[]; totalResultNumber: number };

beforeAll(async () => {
  app = await buildApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await resetTestDb();
  admin = await signIn(app);
  member = await signIn(app, { role: 'MEMBER' });
});

async function merge(client: SignedInClient, funkoId: number, payload: Record<string, unknown>) {
  return client.inject({ method: 'POST', url: `/submissions/${funkoId}/merge`, payload });
}

async function itemsOf(client: SignedInClient): Promise<ItemBody[]> {
  const response = await client.inject({ method: 'GET', url: '/items?size=100' });

  return response.json<ListBody<ItemBody>>().data;
}

describe('POST /submissions/:funkoId/merge', () => {
  it('moves the sender’s items onto the catalogue funko and marks the submission merged into it', async () => {
    const target = await createFunko({ name: 'Thanos' });
    const submission = await createFunko({ name: 'Thanos copy', status: 'WAITING', submittedById: member.userId });
    const collectionId = await defaultCollectionId(member.userId);
    await createItem(collectionId, submission.id, { quantity: 2 });

    const response = await merge(admin, submission.id, { targetFunkoId: target.id });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      id: submission.id,
      status: 'MERGED',
      reviewedAt: expect.any(String) as unknown,
      mergedInto: { id: target.id, name: 'Thanos' },
    });
    const items = await itemsOf(member);
    expect(items.map((item) => [item.collection.id, item.funko.id, item.quantity])).toEqual([
      [collectionId, target.id, 2],
    ]);
  });

  it('makes one item of a clash in a collection: quantities added, notes and tags joined, the older item’s other fields kept', async () => {
    const target = await createFunko({ name: 'Thanos' });
    const submission = await createFunko({ status: 'WAITING', submittedById: member.userId });
    const collectionId = await defaultCollectionId(member.userId);
    const box1 = await createTag('Box 1', member.userId);
    const box2 = await createTag('Box 2', member.userId);
    const older = await createItem(collectionId, target.id, {
      quantity: 1,
      condition: 'MINT_IN_BOX',
      purchasePriceCents: 1500,
      notes: 'From the shop',
      tagIds: [box1.id],
    });
    await createItem(collectionId, submission.id, {
      quantity: 2,
      condition: 'OUT_OF_BOX',
      purchasePriceCents: 900,
      notes: 'From a friend',
      tagIds: [box1.id, box2.id],
    });

    await merge(admin, submission.id, { targetFunkoId: target.id });

    const items = await itemsOf(member);
    expect(items).toEqual([
      expect.objectContaining({
        id: older.id,
        funko: expect.objectContaining({ id: target.id }) as unknown,
        quantity: 3,
        condition: 'MINT_IN_BOX',
        purchasePriceCents: 1500,
        notes: 'From the shop\n\nFrom a friend',
        tags: [
          { id: box1.id, name: 'Box 1' },
          { id: box2.id, name: 'Box 2' },
        ],
      }),
    ]);
  });

  it('keeps the submission’s item as the one when it is the older of the two', async () => {
    const target = await createFunko();
    const submission = await createFunko({ status: 'WAITING', submittedById: member.userId });
    const collectionId = await defaultCollectionId(member.userId);
    const older = await createItem(collectionId, submission.id, { condition: 'BOX_DAMAGED' });
    await createItem(collectionId, target.id, { condition: 'MINT_IN_BOX', notes: 'Newer' });

    await merge(admin, submission.id, { targetFunkoId: target.id });

    const items = await itemsOf(member);
    expect(items.map((item) => [item.id, item.funko.id, item.quantity, item.condition, item.notes])).toEqual([
      [older.id, target.id, 2, 'BOX_DAMAGED', 'Newer'],
    ]);
  });

  it('leaves the items in other collections apart when only one collection clashes', async () => {
    const target = await createFunko();
    const submission = await createFunko({ status: 'WAITING', submittedById: member.userId });
    const owned = await defaultCollectionId(member.userId);
    const wishlist = await createCollection({ name: 'Wishlist', userId: member.userId });
    await createItem(owned, target.id);
    await createItem(owned, submission.id);
    await createItem(wishlist.id, submission.id);

    await merge(admin, submission.id, { targetFunkoId: target.id });

    const items = await itemsOf(member);
    expect(items.map((item) => [item.collection.id, item.funko.id, item.quantity]).sort()).toEqual(
      [
        [owned, target.id, 2],
        [wishlist.id, target.id, 1],
      ].sort(),
    );
  });

  it('returns 409 and moves nothing when the submission is not waiting', async () => {
    const target = await createFunko();
    const rejected = await createFunko({ status: 'REJECTED', submittedById: member.userId });
    await createItem(await defaultCollectionId(member.userId), rejected.id);

    const response = await merge(admin, rejected.id, { targetFunkoId: target.id });

    expect(response.statusCode).toBe(409);
    expect((await itemsOf(member)).map((item) => item.funko.id)).toEqual([rejected.id]);
  });

  it('returns 400 when the target is another waiting submission, not a catalogue funko', async () => {
    const otherSubmission = await createFunko({ status: 'WAITING', submittedById: member.userId });
    const submission = await createFunko({ status: 'WAITING', submittedById: member.userId });

    const response = await merge(admin, submission.id, { targetFunkoId: otherSubmission.id });

    expect(response.statusCode).toBe(400);
  });

  it('returns 400 when the target does not exist', async () => {
    const submission = await createFunko({ status: 'WAITING', submittedById: member.userId });

    const response = await merge(admin, submission.id, { targetFunkoId: 999999 });

    expect(response.statusCode).toBe(400);
  });

  it('returns 400 when the target is the submission itself', async () => {
    const submission = await createFunko({ status: 'WAITING', submittedById: member.userId });

    const response = await merge(admin, submission.id, { targetFunkoId: submission.id });

    expect(response.statusCode).toBe(400);
  });

  it('returns 400 when the body has no target', async () => {
    const submission = await createFunko({ status: 'WAITING', submittedById: member.userId });

    const response = await merge(admin, submission.id, {});

    expect(response.statusCode).toBe(400);
  });

  it('returns 404 when there is no such submission', async () => {
    const target = await createFunko();

    const response = await merge(admin, 999999, { targetFunkoId: target.id });

    expect(response.statusCode).toBe(404);
  });

  it('returns 403 ADMIN_ONLY when a member tries it', async () => {
    const target = await createFunko();
    const submission = await createFunko({ status: 'WAITING', submittedById: member.userId });

    const response = await merge(member, submission.id, { targetFunkoId: target.id });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ code: 'ADMIN_ONLY' });
  });

  it('merges an orphan submission when its sender was deleted', async () => {
    const leaving = await createUser('Leaving');
    const orphan = await createFunko({ status: 'WAITING', submittedById: leaving.id });
    const target = await createFunko();
    await deleteUser(leaving.id);

    const response = await merge(admin, orphan.id, { targetFunkoId: target.id });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'MERGED', mergedInto: { id: target.id } });
  });
});

describe('after a merge', () => {
  async function mergedSubmission() {
    const target = await createFunko({ name: 'Thanos' });
    const submission = await createFunko({ name: 'Purple guy', status: 'WAITING', submittedById: member.userId });

    await merge(admin, submission.id, { targetFunkoId: target.id });

    return { target, submission };
  }

  it('shows the submission as merged on the sender’s list, linking to the catalogue funko', async () => {
    const { target } = await mergedSubmission();

    const response = await member.inject({ method: 'GET', url: '/submissions' });

    expect(response.json<ListBody<unknown>>().data).toEqual([
      expect.objectContaining({ name: 'Purple guy', status: 'MERGED', mergedInto: { id: target.id, name: 'Thanos' } }),
    ]);
  });

  it('says what it was merged into when the sender opens the submission', async () => {
    const { target, submission } = await mergedSubmission();

    const response = await member.inject({ method: 'GET', url: `/funkos/${submission.id}` });

    expect(response.json()).toMatchObject({ status: 'MERGED', mergedInto: { id: target.id, name: 'Thanos' } });
  });

  it('lists it under the admins’ done reviews', async () => {
    const { submission } = await mergedSubmission();

    const response = await admin.inject({ method: 'GET', url: '/submissions/review?state=DONE' });

    expect(response.json<ListBody<{ id: number; status: string }>>().data).toEqual([
      expect.objectContaining({ id: submission.id, status: 'MERGED' }),
    ]);
  });

  it('tells the sender, pointing at the catalogue funko', async () => {
    const { target } = await mergedSubmission();

    const response = await member.inject({ method: 'GET', url: '/notifications' });

    expect(response.json<ListBody<unknown>>().data).toEqual([
      expect.objectContaining({ kind: 'SUBMISSION_MERGED', funkoId: target.id, funkoName: 'Thanos', reason: null }),
    ]);
  });

  it('returns 403 ADMIN_ONLY when the sender tries to change the merged submission', async () => {
    const { submission } = await mergedSubmission();

    const response = await member.inject({ method: 'PATCH', url: `/funkos/${submission.id}`, payload: { name: 'X' } });

    expect(response.statusCode).toBe(403);
  });
});
