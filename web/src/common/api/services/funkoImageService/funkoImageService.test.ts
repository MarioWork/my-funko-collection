import { http, HttpResponse } from 'msw/http';
import { TEST_BASE_API_URL, server } from '@mocks/server';
import funkoImageService, { IMAGE_FILE_FIELD } from './funkoImageService';

// The first seed funko has two images, ids 1 and 2.
const FUNKO_ID = 1;
const FRONT_IMAGE_ID = 1;
const BACK_IMAGE_ID = 2;
const UNKNOWN_ID = 999;

function makeFile(name: string): File {
  return new File([new Uint8Array([1, 2, 3])], name, { type: 'image/png' });
}

describe('addFunkoImages', () => {
  it('sends every file under the "file" multipart field', async () => {
    let receivedNames: string[] = [];
    server.use(
      http.post(`${TEST_BASE_API_URL}/funkos/:funkoId/images`, async ({ request }) => {
        const form = await request.formData();

        receivedNames = form.getAll(IMAGE_FILE_FIELD).map((value) => (value instanceof File ? value.name : ''));

        return HttpResponse.json([], { status: 201 });
      }),
    );

    await funkoImageService.addFunkoImages(FUNKO_ID, [makeFile('front.png'), makeFile('back.png')]);

    expect(receivedNames).toEqual(['front.png', 'back.png']);
  });

  it('returns the stored images from the mock store', async () => {
    const result = await funkoImageService.addFunkoImages(FUNKO_ID, [makeFile('front.png')]);

    expect(result.success).toBe(true);
    expect(result.data?.[0]).toMatchObject({ position: 2, width: 2000 });
  });

  it('returns the 404 envelope for an unknown funko', async () => {
    const result = await funkoImageService.addFunkoImages(UNKNOWN_ID, [makeFile('front.png')]);

    expect(result).toMatchObject({ success: false, error: { statusCode: 404 } });
  });
});

describe('reorderFunkoImages', () => {
  it('returns the images in their new order', async () => {
    const result = await funkoImageService.reorderFunkoImages(FUNKO_ID, { imageIds: [BACK_IMAGE_ID, FRONT_IMAGE_ID] });

    expect(result.success).toBe(true);
    expect(result.data?.map(({ id, position }) => [id, position])).toEqual([
      [BACK_IMAGE_ID, 0],
      [FRONT_IMAGE_ID, 1],
    ]);
  });

  it('returns the 400 envelope when an image is left out', async () => {
    const result = await funkoImageService.reorderFunkoImages(FUNKO_ID, { imageIds: [BACK_IMAGE_ID] });

    expect(result).toMatchObject({ success: false, error: { statusCode: 400 } });
  });
});

describe('rotateFunkoImage', () => {
  it('posts the degrees and returns the image with new urls', async () => {
    const result = await funkoImageService.rotateFunkoImage(FUNKO_ID, FRONT_IMAGE_ID, { degrees: 90 });

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ id: FRONT_IMAGE_ID, width: 2667, height: 2000 });
  });

  it('returns the 404 envelope for an unknown image', async () => {
    const result = await funkoImageService.rotateFunkoImage(FUNKO_ID, UNKNOWN_ID, { degrees: 90 });

    expect(result).toMatchObject({ success: false, error: { statusCode: 404 } });
  });
});

describe('deleteFunkoImage', () => {
  it('deletes the image', async () => {
    const result = await funkoImageService.deleteFunkoImage(FUNKO_ID, FRONT_IMAGE_ID);

    expect(result.success).toBe(true);
  });

  it('returns the 404 envelope for an unknown image', async () => {
    const result = await funkoImageService.deleteFunkoImage(FUNKO_ID, UNKNOWN_ID);

    expect(result).toMatchObject({ success: false, error: { statusCode: 404, code: 'NOT_FOUND' } });
  });
});
