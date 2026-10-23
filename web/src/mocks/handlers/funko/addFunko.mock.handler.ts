import { http } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { badRequest, conflict, created, toFunkoModel } from '@mocks/mockResponses';
import { mockStore, nextId, nowIso, type MockFunkoRow } from '@mocks/mockStore';
import type { CreateFunko } from '@services/funkoService/funkoService.type';
import { findDuplicate } from './funkoMockUtils';

export default (baseUrl: string) => [
  http.post(`${baseUrl}/funkos`, async ({ request }) => {
    await delay(MOCK_DELAY);

    const body = (await request.json()) as CreateFunko;
    const categoryExists = mockStore.categories.some((category) => category.id === body.categoryId);

    if (!categoryExists) return badRequest(`Category ${body.categoryId} does not exist`);

    const isSeriesMissing =
      body.seriesId !== null &&
      body.seriesId !== undefined &&
      !mockStore.series.some((series) => series.id === body.seriesId);

    if (isSeriesMissing) return badRequest(`Series ${body.seriesId} does not exist`);

    const row: MockFunkoRow = {
      id: nextId(mockStore.funkos),
      name: body.name,
      number: body.number,
      type: body.type,
      categoryId: body.categoryId,
      seriesId: body.seriesId ?? null,
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

    return created(toFunkoModel(row));
  }),
];
