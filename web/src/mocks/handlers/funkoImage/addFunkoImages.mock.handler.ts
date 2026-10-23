import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { createMockImageUrls, MOCK_IMAGE_SIZE_BYTES } from '@mocks/mockImageUtils';
import { badRequest, notFound } from '@mocks/mockResponses';
import { mockStore, nextId, nowIso, type MockImageRow } from '@mocks/mockStore';
import { IMAGE_FILE_FIELD } from '@services/funkoImageService/funkoImageService';
import type { ImageFromUrl } from '@services/funkoImageService/funkoImageService.type';

export function storeImage(funkoId: number, label: string): MockImageRow {
  const siblings = mockStore.images.filter((image) => image.funkoId === funkoId);
  const id = nextId(mockStore.images);
  const row: MockImageRow = {
    id,
    funkoId,
    position: siblings.length,
    sizeBytes: MOCK_IMAGE_SIZE_BYTES,
    createdAt: nowIso(),
    ...createMockImageUrls(label, id),
  };

  mockStore.images.push(row);

  return row;
}

const withoutFunkoId = ({ funkoId: _funkoId, ...image }: MockImageRow) => image;

export default (baseUrl: string) => [
  http.post(`${baseUrl}/funkos/:funkoId/images`, async ({ params, request }) => {
    await delay(MOCK_DELAY);

    const funko = mockStore.funkos.find((candidate) => String(candidate.id) === params.funkoId);

    if (!funko) return notFound('Funko', String(params.funkoId));

    const form = await request.formData();
    const files = form.getAll(IMAGE_FILE_FIELD).filter((value): value is File => value instanceof File);

    if (files.length === 0) return badRequest('Send at least one file in the "file" field');

    const stored = files.map((file) => storeImage(funko.id, file.name.replace(/\.[^.]+$/, '') || funko.name));

    return HttpResponse.json(stored.map(withoutFunkoId), { status: 201 });
  }),
  http.post(`${baseUrl}/funkos/:funkoId/images/from-url`, async ({ params, request }) => {
    await delay(MOCK_DELAY);

    const funko = mockStore.funkos.find((candidate) => String(candidate.id) === params.funkoId);

    if (!funko) return notFound('Funko', String(params.funkoId));

    const body = (await request.json()) as ImageFromUrl;

    return HttpResponse.json(withoutFunkoId(storeImage(funko.id, new URL(body.url).hostname)), { status: 201 });
  }),
];
