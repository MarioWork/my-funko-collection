import { http } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { createMockImageUrls, MOCK_IMAGE_SIZE_BYTES } from '@mocks/mockImageUtils';
import { badRequest, created, toFunkoImageModel } from '@mocks/mockResponses';
import { findEditableFunko, recordMockAdminChange } from '@mocks/handlers/funko/funkoMockUtils';
import { mockStore } from '@mocks/mockStore';
import type { MockImageRow } from '@mocks/mockStore.type';
import { nextId, nowIso } from '@mocks/mockStoreUtils';
import { IMAGE_FILE_FIELD } from '@services/funkoImageService/funkoImageService';

const FILE_EXTENSION = /\.[^.]+$/;

function storeImage(funkoId: number, label: string): MockImageRow {
  const siblings = mockStore.images.filter((image) => image.funkoId === funkoId);
  const id = nextId(mockStore.images);
  const row: MockImageRow = {
    id,
    funkoId,
    position: siblings.length,
    sizeBytes: MOCK_IMAGE_SIZE_BYTES,
    createdAt: nowIso(),
    uploadedById: mockStore.auth.userId,
    ...createMockImageUrls(label, id),
  };

  mockStore.images.push(row);

  return row;
}

export default (baseUrl: string) => [
  http.post(`${baseUrl}/funkos/:funkoId/images`, async ({ params, request }) => {
    await delay(MOCK_DELAY);

    const target = findEditableFunko(String(params.funkoId));

    if ('refusal' in target) return target.refusal;

    const funko = target.funko;

    const form = await request.formData();
    const files = form.getAll(IMAGE_FILE_FIELD).filter((value): value is File => value instanceof File);

    if (files.length === 0) return badRequest('Send at least one file in the "file" field');

    const stored = files.map((file) => storeImage(funko.id, file.name.replace(FILE_EXTENSION, '') || funko.name));

    recordMockAdminChange(funko);

    return created(stored.map(toFunkoImageModel));
  }),
];
