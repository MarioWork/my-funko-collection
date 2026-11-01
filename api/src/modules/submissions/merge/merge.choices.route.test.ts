// An admin merging a submission picks, field by field and image by image, what the catalogue funko keeps (issue #39):
// the original entry's values unless a field is taken from the submission; the original entry's images unless one is
// removed or one of the submission's is moved over.
import { buildApp, type App } from '../../../app.ts';
import { storedFileExists } from '../../../lib/imageStorage.ts';
import { resetTestDb } from '../../../testDb.ts';
import {
  createCategory,
  createFunko,
  createSeries,
  makeImage,
  type SignedInClient,
  signIn,
  toFormData,
} from '../../../testFixtures.ts';

let app: App;
let admin: SignedInClient;
let member: SignedInClient;

type FunkoBody = {
  name: string;
  number: string;
  type: string;
  isChase: boolean;
  exclusive: string;
  barcode: string | null;
  category: { id: number; name: string };
  series: { id: number; name: string };
  images: { id: number; url: string }[];
};

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

async function merge(funkoId: number, payload: Record<string, unknown>) {
  return admin.inject({ method: 'POST', url: `/submissions/${funkoId}/merge`, payload });
}

async function funkoOf(funkoId: number): Promise<FunkoBody> {
  const response = await admin.inject({ method: 'GET', url: `/funkos/${funkoId}` });

  return response.json<FunkoBody>();
}

async function uploadImage(client: SignedInClient, funkoId: number, background: string): Promise<{ id: number }> {
  const buffer = await makeImage({ background });
  const response = await client.inject({
    method: 'POST',
    url: `/funkos/${funkoId}/images`,
    payload: toFormData([{ buffer }]),
  });
  const [image] = response.json<{ id: number }[]>();

  if (!image) throw new Error(`Upload failed: ${response.body}`);

  return image;
}

async function waitingSubmission(overrides: Parameters<typeof createFunko>[0] = {}) {
  return createFunko({ status: 'WAITING', submittedById: member.userId, ...overrides });
}

describe('POST /submissions/:funkoId/merge with picked fields', () => {
  it('keeps every value of the original entry when nothing is picked', async () => {
    const target = await createFunko({ name: 'Thanos', number: '289', exclusive: '' });
    const submission = await waitingSubmission({ name: 'Thanos (Endgame)', number: '453', exclusive: 'SDCC' });

    const response = await merge(submission.id, { targetFunkoId: target.id });

    expect(response.statusCode).toBe(200);
    expect(await funkoOf(target.id)).toMatchObject({ name: 'Thanos', number: '289', exclusive: '' });
  });

  it('copies the text, type and chase fields onto the original entry when they are picked from the submission', async () => {
    const target = await createFunko({ name: 'Thanos', number: '289', type: 'POP', isChase: false, exclusive: '' });
    const submission = await waitingSubmission({
      name: 'Thanos (Endgame)',
      number: '453',
      type: 'POP_DELUXE',
      isChase: true,
      exclusive: 'SDCC',
    });

    const response = await merge(submission.id, {
      targetFunkoId: target.id,
      fieldsFromSubmission: ['NAME', 'TYPE', 'CHASE', 'EXCLUSIVE'],
    });

    expect(response.statusCode).toBe(200);
    expect(await funkoOf(target.id)).toMatchObject({
      name: 'Thanos (Endgame)',
      number: '289',
      type: 'POP_DELUXE',
      isChase: true,
      exclusive: 'SDCC',
    });
  });

  it('leaves the submission as its sender sent it when the original entry takes its name', async () => {
    const target = await createFunko({ name: 'Thanos' });
    const submission = await waitingSubmission({ name: 'Thanos (Endgame)' });

    await merge(submission.id, { targetFunkoId: target.id, fieldsFromSubmission: ['NAME'] });

    const response = await member.inject({ method: 'GET', url: `/funkos/${submission.id}` });
    expect(response.json()).toMatchObject({ name: 'Thanos (Endgame)', status: 'MERGED' });
  });

  it('takes the submission’s barcode, and clears the original entry’s when the submission has none', async () => {
    const withBarcode = await createFunko({ barcode: null });
    const barcodeSubmission = await waitingSubmission({ barcode: '0889698123456' });
    const clearing = await createFunko({ barcode: '0889698654321' });
    const noBarcodeSubmission = await waitingSubmission({ barcode: null });

    await merge(barcodeSubmission.id, { targetFunkoId: withBarcode.id, fieldsFromSubmission: ['BARCODE'] });
    await merge(noBarcodeSubmission.id, { targetFunkoId: clearing.id, fieldsFromSubmission: ['BARCODE'] });

    expect((await funkoOf(withBarcode.id)).barcode).toBe('0889698123456');
    expect((await funkoOf(clearing.id)).barcode).toBeNull();
  });

  it('returns 409 in words and changes nothing when the picked barcode belongs to another catalogue funko', async () => {
    const holder = await createFunko({ barcode: '0889698123456' });
    const target = await createFunko({ name: 'Thanos', barcode: null });
    const submission = await waitingSubmission({ barcode: '0889698123456' });

    const response = await merge(submission.id, { targetFunkoId: target.id, fieldsFromSubmission: ['BARCODE'] });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      code: 'CONFLICT',
      message: expect.stringContaining('barcode') as unknown,
      existingId: holder.id,
    });
    expect((await funkoOf(target.id)).barcode).toBeNull();
    const submissionResponse = await admin.inject({ method: 'GET', url: `/funkos/${submission.id}` });
    expect(submissionResponse.json()).toMatchObject({ status: 'WAITING' });
  });

  it('returns 409 in words when the picked fields would make the original entry the same as another catalogue funko', async () => {
    const category = await createCategory('Pop! Marvel');
    const other = await createFunko({ name: 'Thanos', number: '453', categoryId: category.id });
    const target = await createFunko({ name: 'Thanos', number: '289', categoryId: category.id });
    const submission = await waitingSubmission({ name: 'Thanos', number: '453', categoryId: category.id });

    const response = await merge(submission.id, { targetFunkoId: target.id, fieldsFromSubmission: ['NUMBER'] });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ existingId: other.id });
    expect((await funkoOf(target.id)).number).toBe('289');
  });

  it('returns 400 when a picked field is the same on both funkos', async () => {
    const target = await createFunko({ name: 'Thanos' });
    const submission = await waitingSubmission({ name: 'Thanos' });

    const response = await merge(submission.id, { targetFunkoId: target.id, fieldsFromSubmission: ['NAME'] });

    expect(response.statusCode).toBe(400);
    expect(response.json<{ message: string }>().message).toContain('same');
  });

  it('returns 400 when a field is picked twice or is not a catalogue field', async () => {
    const target = await createFunko({ name: 'Thanos' });
    const submission = await waitingSubmission({ name: 'Thanos copy' });

    const twice = await merge(submission.id, { targetFunkoId: target.id, fieldsFromSubmission: ['NAME', 'NAME'] });
    const unknown = await merge(submission.id, { targetFunkoId: target.id, fieldsFromSubmission: ['NOTES'] });

    expect(twice.statusCode).toBe(400);
    expect(unknown.statusCode).toBe(400);
  });
});

describe('POST /submissions/:funkoId/merge with a picked category or series', () => {
  it('moves the original entry into the submission’s category and series when both are picked and approved', async () => {
    const category = await createCategory('Pop! Star Wars');
    const series = await createSeries('The Mandalorian');
    const target = await createFunko({ name: 'Grogu' });
    const submission = await waitingSubmission({ name: 'Grogu', categoryId: category.id, seriesId: series.id });

    await merge(submission.id, { targetFunkoId: target.id, fieldsFromSubmission: ['CATEGORY', 'SERIES'] });

    expect(await funkoOf(target.id)).toMatchObject({
      category: { id: category.id, name: 'Pop! Star Wars' },
      series: { id: series.id, name: 'The Mandalorian' },
    });
  });

  it('brings the submission’s category and series into the catalogue, as approval does, when they are waiting and picked', async () => {
    const category = await createCategory('Pop! Anime', { status: 'WAITING', submittedById: member.userId });
    const series = await createSeries('Frieren', { status: 'WAITING', submittedById: member.userId });
    const target = await createFunko({ name: 'Frieren' });
    const submission = await waitingSubmission({ name: 'Frieren', categoryId: category.id, seriesId: series.id });

    await merge(submission.id, { targetFunkoId: target.id, fieldsFromSubmission: ['CATEGORY', 'SERIES'] });

    expect(await funkoOf(target.id)).toMatchObject({ category: { id: category.id }, series: { id: series.id } });
    const categoryResponse = await admin.inject({ method: 'GET', url: `/categories/${category.id}` });
    const seriesResponse = await admin.inject({ method: 'GET', url: `/series/${series.id}` });
    expect(categoryResponse.json()).toMatchObject({ status: 'APPROVED' });
    expect(seriesResponse.json()).toMatchObject({ status: 'APPROVED' });
  });

  it('uses the approved category of the same name when the catalogue already has one', async () => {
    const approved = await createCategory('Pop! Anime');
    const waiting = await createCategory('Pop! Anime', { status: 'WAITING', submittedById: member.userId });
    const target = await createFunko({ name: 'Frieren' });
    const submission = await waitingSubmission({ name: 'Frieren', categoryId: waiting.id });

    await merge(submission.id, { targetFunkoId: target.id, fieldsFromSubmission: ['CATEGORY'] });

    expect((await funkoOf(target.id)).category.id).toBe(approved.id);
  });

  it('returns 400 when the picked category is the approved one of the same name the original entry already has', async () => {
    const approved = await createCategory('Pop! Anime');
    const waiting = await createCategory('Pop! Anime', { status: 'WAITING', submittedById: member.userId });
    const target = await createFunko({ name: 'Frieren', categoryId: approved.id });
    const submission = await waitingSubmission({ name: 'Frieren copy', categoryId: waiting.id });

    const response = await merge(submission.id, { targetFunkoId: target.id, fieldsFromSubmission: ['CATEGORY'] });

    expect(response.statusCode).toBe(400);
  });

  it('keeps the original entry’s own series when the submission’s is not picked', async () => {
    const endgame = await createSeries('Endgame');
    const infinityWar = await createSeries('Infinity War');
    const target = await createFunko({ name: 'Thanos', seriesId: endgame.id });
    const submission = await waitingSubmission({ name: 'Thanos (Snap)', seriesId: infinityWar.id });

    await merge(submission.id, { targetFunkoId: target.id, fieldsFromSubmission: ['NAME'] });

    expect(await funkoOf(target.id)).toMatchObject({ name: 'Thanos (Snap)', series: { id: endgame.id } });
  });
});

describe('POST /submissions/:funkoId/merge with picked images', () => {
  it('keeps the original entry’s images and leaves the submission’s with it when none are picked', async () => {
    const target = await createFunko();
    const submission = await waitingSubmission();
    const original = await uploadImage(admin, target.id, '#aa0000');
    const sent = await uploadImage(member, submission.id, '#00aa00');

    await merge(submission.id, { targetFunkoId: target.id });

    expect((await funkoOf(target.id)).images.map(({ id }) => id)).toEqual([original.id]);
    expect((await funkoOf(submission.id)).images.map(({ id }) => id)).toEqual([sent.id]);
  });

  it('moves a submission image and its files onto the original entry, after its own, when it is picked', async () => {
    const target = await createFunko();
    const submission = await waitingSubmission();
    const original = await uploadImage(admin, target.id, '#aa0000');
    const sent = await uploadImage(member, submission.id, '#00aa00');
    const sentUrl = (await funkoOf(submission.id)).images[0]?.url ?? '';

    const response = await merge(submission.id, { targetFunkoId: target.id, imageIdsFromSubmission: [sent.id] });

    expect(response.statusCode).toBe(200);
    const targetImages = (await funkoOf(target.id)).images;
    expect(targetImages.map(({ id }) => id)).toEqual([original.id, sent.id]);
    expect(targetImages[1]?.url).toContain(`/funkos/${target.id}/`);
    expect(await storedFileExists(targetImages[1]?.url ?? '')).toBe(true);
    expect(await storedFileExists(sentUrl)).toBe(false);
    expect((await funkoOf(submission.id)).images).toEqual([]);
  });

  it('still names the member as the uploader on the Images page when their image moved', async () => {
    const target = await createFunko();
    const submission = await waitingSubmission();
    const sent = await uploadImage(member, submission.id, '#00aa00');

    await merge(submission.id, { targetFunkoId: target.id, imageIdsFromSubmission: [sent.id] });

    const response = await admin.inject({ method: 'GET', url: '/images?size=100' });
    const rows = response.json<{ data: { id: number | null; funko: { id: number } | null }[] }>().data;
    expect(rows).toContainEqual(
      expect.objectContaining({
        id: sent.id,
        funko: expect.objectContaining({ id: target.id }) as unknown,
        uploadedBy: expect.objectContaining({ id: member.userId }) as unknown,
      }),
    );
  });

  it('shows the image to every user when it moved onto a catalogue funko', async () => {
    const target = await createFunko();
    const submission = await waitingSubmission();
    const sent = await uploadImage(member, submission.id, '#00aa00');
    const otherMember = await signIn(app, { role: 'MEMBER' });

    await merge(submission.id, { targetFunkoId: target.id, imageIdsFromSubmission: [sent.id] });

    const url = (await funkoOf(target.id)).images[0]?.url ?? '';
    const response = await otherMember.inject({ method: 'GET', url });
    expect(response.statusCode).toBe(200);
  });

  it('removes an original entry image and its files when the admin unticked it', async () => {
    const target = await createFunko();
    const submission = await waitingSubmission();
    const kept = await uploadImage(admin, target.id, '#aa0000');
    const removed = await uploadImage(admin, target.id, '#0000aa');
    const removedUrl = (await funkoOf(target.id)).images[1]?.url ?? '';

    await merge(submission.id, { targetFunkoId: target.id, removedImageIds: [removed.id] });

    expect((await funkoOf(target.id)).images.map(({ id }) => id)).toEqual([kept.id]);
    expect(await storedFileExists(removedUrl)).toBe(false);
  });

  it('returns 400 and changes nothing when an image belongs to neither funko', async () => {
    const target = await createFunko();
    const submission = await waitingSubmission();
    const elsewhere = await createFunko();
    const stranger = await uploadImage(admin, elsewhere.id, '#aa0000');
    const original = await uploadImage(admin, target.id, '#00aa00');

    const fromSubmission = await merge(submission.id, {
      targetFunkoId: target.id,
      imageIdsFromSubmission: [stranger.id],
    });
    const removedFromOriginal = await merge(submission.id, {
      targetFunkoId: target.id,
      removedImageIds: [stranger.id],
    });
    const swapped = await merge(submission.id, { targetFunkoId: target.id, imageIdsFromSubmission: [original.id] });

    expect([fromSubmission.statusCode, removedFromOriginal.statusCode, swapped.statusCode]).toEqual([400, 400, 400]);
    expect((await funkoOf(elsewhere.id)).images).toHaveLength(1);
    expect((await funkoOf(target.id)).images).toHaveLength(1);
  });

  it('returns 400 when the original entry would end up with more images than a funko holds', async () => {
    const target = await createFunko();
    const submission = await waitingSubmission();
    await uploadImage(admin, target.id, '#aa0000');
    await uploadImage(admin, target.id, '#00aa00');
    const first = await uploadImage(member, submission.id, '#0000aa');
    const second = await uploadImage(member, submission.id, '#aaaa00');

    const response = await merge(submission.id, {
      targetFunkoId: target.id,
      imageIdsFromSubmission: [first.id, second.id],
    });

    expect(response.statusCode).toBe(400);
    expect((await funkoOf(submission.id)).images).toHaveLength(2);
  });

  it('leaves a picked image with the submission when the original entry already has the very same picture', async () => {
    const target = await createFunko();
    const submission = await waitingSubmission();
    const original = await uploadImage(admin, target.id, '#aa0000');
    const same = await uploadImage(member, submission.id, '#aa0000');

    const response = await merge(submission.id, { targetFunkoId: target.id, imageIdsFromSubmission: [same.id] });

    expect(response.statusCode).toBe(200);
    expect((await funkoOf(target.id)).images.map(({ id }) => id)).toEqual([original.id]);
    expect((await funkoOf(submission.id)).images.map(({ id }) => id)).toEqual([same.id]);
  });

  it('keeps the copies off the original entry when the merge is refused', async () => {
    const target = await createFunko({ barcode: null });
    await createFunko({ barcode: '0889698123456' });
    const submission = await waitingSubmission({ barcode: '0889698123456' });
    const sent = await uploadImage(member, submission.id, '#00aa00');
    const sentUrl = (await funkoOf(submission.id)).images[0]?.url ?? '';
    const copiedUrl = sentUrl.replace(`/funkos/${submission.id}/`, `/funkos/${target.id}/`);

    const response = await merge(submission.id, {
      targetFunkoId: target.id,
      fieldsFromSubmission: ['BARCODE'],
      imageIdsFromSubmission: [sent.id],
    });

    expect(response.statusCode).toBe(409);
    expect(await storedFileExists(sentUrl)).toBe(true);
    expect(await storedFileExists(copiedUrl)).toBe(false);
    expect((await funkoOf(submission.id)).images).toHaveLength(1);
  });
});
