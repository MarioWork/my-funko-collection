import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { conflict, toFunkoModel } from '@mocks/mockResponses';
import { nowIso } from '@mocks/mockStoreUtils';
import type { UpdateFunko } from '@services/funkoService/funkoService.type';
import { findBarcodeTwin, findDuplicate, findEditableFunko, referenceRefusal } from './funkoMockUtils';

// An admin changes any funko; a member only their own waiting submission.
export default (baseUrl: string) => [
  http.patch(`${baseUrl}/funkos/:funkoId`, async ({ params, request }) => {
    await delay(MOCK_DELAY);

    const target = findEditableFunko(String(params.funkoId));

    if ('refusal' in target) return target.refusal;

    const row = target.funko;
    const body = (await request.json()) as UpdateFunko;
    const next = { ...row, ...body, barcode: body.barcode === undefined ? row.barcode : body.barcode };
    const refusal = referenceRefusal(next);

    if (refusal) return refusal;

    const duplicate = findDuplicate(next, row.id);

    if (duplicate) return conflict('This funko already exists', duplicate.id);

    const sameBarcode = findBarcodeTwin(next, row.id);

    if (sameBarcode) return conflict('This barcode belongs to another funko', sameBarcode.id);

    Object.assign(row, next, { updatedAt: nowIso() });

    return HttpResponse.json(toFunkoModel(row));
  }),
];
