import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { notFound, toFunkoDetail, toFunkoModel } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';
import { normaliseBarcode } from '@utils/barcodeUtils';

export default (baseUrl: string) => [
  http.get(`${baseUrl}/funkos/by-barcode/:barcode`, async ({ params }) => {
    await delay(MOCK_DELAY);

    const wanted = normaliseBarcode(String(params.barcode));
    const row = mockStore.funkos.find((funko) => funko.barcode !== null && normaliseBarcode(funko.barcode) === wanted);

    return row ? HttpResponse.json(toFunkoModel(row)) : notFound('Funko', String(params.barcode));
  }),
  http.get(`${baseUrl}/funkos/:funkoId`, async ({ params }) => {
    await delay(MOCK_DELAY);

    const row = mockStore.funkos.find((funko) => String(funko.id) === params.funkoId);

    return row ? HttpResponse.json(toFunkoDetail(row)) : notFound('Funko', String(params.funkoId));
  }),
];
