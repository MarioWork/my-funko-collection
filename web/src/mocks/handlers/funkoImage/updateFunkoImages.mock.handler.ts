import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { createMockImageUrls } from '@mocks/mockImageUtils';
import { badRequest, notFound } from '@mocks/mockResponses';
import { mockStore, nextId } from '@mocks/mockStore';
import type { ReorderImages, RotateImage } from '@services/funkoImageService/funkoImageService.type';

// Turns that swap the picture's width and height.
const QUARTER_TURN_DEGREES: number[] = [90, 270];

export default (baseUrl: string) => [
  http.patch(`${baseUrl}/funkos/:funkoId/images/order`, async ({ params, request }) => {
    await delay(MOCK_DELAY);

    const images = mockStore.images.filter((image) => String(image.funkoId) === params.funkoId);
    const { imageIds } = (await request.json()) as ReorderImages;
    const isSameSet = images.length === imageIds.length && images.every((image) => imageIds.includes(image.id));

    if (!isSameSet) return badRequest('imageIds must list every image of this funko exactly once');

    for (const image of images) image.position = imageIds.indexOf(image.id);

    return HttpResponse.json(
      images.sort((first, second) => first.position - second.position).map(({ funkoId: _funkoId, ...image }) => image),
    );
  }),
  http.post(`${baseUrl}/funkos/:funkoId/images/:imageId/rotate`, async ({ params, request }) => {
    await delay(MOCK_DELAY);

    const image = mockStore.images.find(
      (candidate) => String(candidate.id) === params.imageId && String(candidate.funkoId) === params.funkoId,
    );

    if (!image) return notFound('Image', String(params.imageId));

    const { degrees } = (await request.json()) as RotateImage;
    const isQuarterTurn = QUARTER_TURN_DEGREES.includes(degrees);
    const rotatedSize = isQuarterTurn ? { width: image.height, height: image.width } : {};

    // New URLs, as the API does: variant files are immutable, so a changed picture needs a new key.
    Object.assign(image, createMockImageUrls(`r${degrees}`, nextId(mockStore.images) + image.id), rotatedSize);

    const { funkoId: _funkoId, ...response } = image;

    return HttpResponse.json(response);
  }),
  http.delete(`${baseUrl}/funkos/:funkoId/images/:imageId`, async ({ params }) => {
    await delay(MOCK_DELAY);

    const index = mockStore.images.findIndex(
      (image) => String(image.id) === params.imageId && String(image.funkoId) === params.funkoId,
    );

    if (index === -1) return notFound('Image', String(params.imageId));

    mockStore.images.splice(index, 1);

    return new HttpResponse(null, { status: 204 });
  }),
];
