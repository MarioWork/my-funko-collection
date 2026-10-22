import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { badRequest, conflict, toFunkoModel } from '@mocks/mockResponses';
import { mockStore, nextId, nowIso, type MockFunkoRow } from '@mocks/mockStore';
import type { CreateFunko } from '@services/funkoService/funkoService.type';

export function findDuplicate(
  candidate: Pick<MockFunkoRow, 'categoryId' | 'number' | 'name' | 'isChase' | 'exclusive'>,
  selfId?: number,
) {
  return mockStore.funkos.find(
    (funko) =>
      funko.id !== selfId &&
      funko.categoryId === candidate.categoryId &&
      funko.number === candidate.number &&
      funko.name === candidate.name &&
      funko.isChase === candidate.isChase &&
      funko.exclusive === candidate.exclusive,
  );
}

export default (baseUrl: string) => [
  http.post(`${baseUrl}/funkos`, async ({ request }) => {
    await delay(MOCK_DELAY);

    const body = (await request.json()) as CreateFunko;
    const categoryExists = mockStore.categories.some((category) => category.id === body.categoryId);

    if (!categoryExists) return badRequest(`Category ${body.categoryId} does not exist`);

    const row: MockFunkoRow = {
      id: nextId(mockStore.funkos),
      name: body.name,
      number: body.number,
      type: body.type,
      categoryId: body.categoryId,
      isChase: body.isChase,
      exclusive: body.exclusive,
      barcode: body.barcode ?? null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const duplicate = findDuplicate(row);

    if (duplicate) return conflict('This funko already exists', duplicate.id);

    const sameBarcode = row.barcode ? mockStore.funkos.find((funko) => funko.barcode === row.barcode) : undefined;

    if (sameBarcode) return conflict('This barcode belongs to another funko', sameBarcode.id);

    mockStore.funkos.push(row);

    return HttpResponse.json(toFunkoModel(row), { status: 201 });
  }),
];
