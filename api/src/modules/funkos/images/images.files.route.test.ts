// Who may load a funko's image files under /uploads: everyone signed in once it is approved; a submission's only
// admins and its sender (docs/adr/0001-shared-catalogue-own-collections.md).
import { buildApp, type App } from '../../../app.ts';
import { prisma } from '../../../lib/prisma.ts';
import { resetTestDb } from '../../../testDb.ts';
import { createFunko, createUser, makeImage, type SignedInClient, signIn, toFormData } from '../../../testFixtures.ts';
import type { SubmissionStatus } from '../../submissions/submissions.type.ts';

type ImageBody = { url: string; smallUrl: string };

let app: App;
let admin: SignedInClient;
let sender: SignedInClient;
let otherMember: SignedInClient;

beforeAll(async () => {
  app = await buildApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await resetTestDb();
  admin = await signIn(app);
  sender = await signIn(app, { role: 'MEMBER' });
  otherMember = await signIn(app, { userId: (await createUser('Other member')).id });
});

// A photo on a funko in the given standing, uploaded by `uploader` (the sender while it waits, or an admin).
async function photoOn(status: SubmissionStatus, uploader: SignedInClient = sender): Promise<ImageBody> {
  const funko = await createFunko({ status: 'WAITING', submittedById: sender.userId });
  const response = await uploader.inject({
    method: 'POST',
    url: `/funkos/${funko.id}/images`,
    payload: toFormData([{ buffer: await makeImage() }]),
  });
  const [image] = response.json<ImageBody[]>();

  if (!image) throw new Error('The upload stored no image');

  await prisma.funko.update({
    where: { id: funko.id },
    data: { status, rejectionReason: status === 'REJECTED' ? 'Blurry' : null },
  });

  return image;
}

function load(client: SignedInClient, url: string) {
  return client.inject({ method: 'GET', url });
}

describe('GET /uploads/*', () => {
  it('serves a waiting submission’s photo when its sender asks', async () => {
    const image = await photoOn('WAITING');

    const response = await load(sender, image.url);

    expect(response.statusCode).toBe(200);
  });

  it('serves a waiting submission’s photo when an admin asks', async () => {
    const image = await photoOn('WAITING');

    const response = await load(admin, image.smallUrl);

    expect(response.statusCode).toBe(200);
  });

  it('returns 404 when another member asks for a waiting or rejected submission’s photo', async () => {
    const waiting = await photoOn('WAITING');
    const rejected = await photoOn('REJECTED');

    const waitingResponse = await load(otherMember, waiting.url);
    const rejectedResponse = await load(otherMember, rejected.url);

    expect([waitingResponse.statusCode, rejectedResponse.statusCode]).toEqual([404, 404]);
  });

  it('serves the sender a photo an admin added to their submission when it is still waiting', async () => {
    const image = await photoOn('WAITING', admin);

    const response = await load(sender, image.url);

    expect(response.statusCode).toBe(200);
  });

  it('serves the photo to another member when the submission is approved', async () => {
    const image = await photoOn('APPROVED');

    const response = await load(otherMember, image.url);

    expect(response.statusCode).toBe(200);
  });

  it('serves an orphaned waiting submission’s photo to admins only when its sender was deleted', async () => {
    const image = await photoOn('WAITING');
    await prisma.funko.updateMany({ where: { submittedById: sender.userId }, data: { submittedById: null } });

    const memberResponse = await load(otherMember, image.url);
    const formerSenderResponse = await load(sender, image.url);
    const adminResponse = await load(admin, image.url);

    expect([memberResponse.statusCode, formerSenderResponse.statusCode, adminResponse.statusCode]).toEqual([
      404, 404, 200,
    ]);
  });

  it('returns 404 when a member walks out of an approved funko’s folder into a submission’s with ..', async () => {
    const waiting = await photoOn('WAITING');
    const approved = await createFunko();
    const [, , , waitingFolder, fileName] = waiting.url.split('/');
    const sneakyUrl = `/uploads/funkos/${approved.id}/..%2F${waitingFolder}/${fileName}`;

    const response = await load(otherMember, sneakyUrl);

    expect(response.statusCode).toBe(404);
  });
});
