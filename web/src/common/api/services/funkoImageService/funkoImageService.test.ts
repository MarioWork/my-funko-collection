import { http, HttpResponse } from 'msw/http';
import { TEST_BASE_API_URL, server } from '@mocks/server';
import funkoImageService, { IMAGE_FILE_FIELD } from './funkoImageService';

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

    await funkoImageService.addFunkoImages(1, [makeFile('front.png'), makeFile('back.png')]);

    expect(receivedNames).toEqual(['front.png', 'back.png']);
  });

  it('returns the stored images from the mock store', async () => {
    const result = await funkoImageService.addFunkoImages(1, [makeFile('front.png')]);

    expect(result.success).toBe(true);
    expect(result.data?.[0]).toMatchObject({ position: 2, width: 2000 });
  });
});

describe('rotateFunkoImage', () => {
  it('posts the degrees and returns the image with new urls', async () => {
    const result = await funkoImageService.rotateFunkoImage(1, 1, { degrees: 90 });

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ id: 1, width: 2667, height: 2000 });
  });
});

describe('deleteFunkoImage', () => {
  it('returns the 404 envelope for an unknown image', async () => {
    const result = await funkoImageService.deleteFunkoImage(1, 999);

    expect(result).toMatchObject({ success: false, error: { statusCode: 404, code: 'NOT_FOUND' } });
  });
});
