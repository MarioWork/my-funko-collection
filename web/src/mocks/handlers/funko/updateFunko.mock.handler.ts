import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { conflict, notFound, toFunkoModel } from '@mocks/mockResponses';
import { mockStore, nowIso } from '@mocks/mockStore';
import type { UpdateFunko } from '@services/funkoService/funkoService.type';
import { findDuplicate } from './funkoMockUtils';

export default (baseUrl: string) => [
  http.patch(`${baseUrl}/funkos/:funkoId`, async ({ params, request }) => {
    await delay(MOCK_DELAY);

    const row = mockStore.funkos.find((funko) => String(funko.id) === params.funkoId);

    if (!row) return notFound('Funko', String(params.funkoId));

    const body = (await request.json()) as UpdateFunko;
    const next = { ...row, ...body, barcode: body.barcode === undefined ? row.barcode : body.barcode };
    const duplicate = findDuplicate(next, row.id);

    if (duplicate) return conflict('This funko already exists', duplicate.id);

    Object.assign(row, next, { updatedAt: nowIso() });

    return HttpResponse.json(toFunkoModel(row));
  }),
];
