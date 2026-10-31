import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { SubmissionStatusUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { canSeeMockRow, catalogueFunkos } from '@mocks/mockCatalogueUtils';
import { notFound, toFunkoDetail, toFunkoModel } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';
import { normaliseBarcode } from '@utils/barcodeUtils';

export default (baseUrl: string) => [
  // The catalogue's funko with this barcode first, else the signed-in user's own submission of it.
  http.get(`${baseUrl}/funkos/by-barcode/:barcode`, async ({ params }) => {
    await delay(MOCK_DELAY);

    const wanted = normaliseBarcode(String(params.barcode));
    const matches = catalogueFunkos().filter(
      (funko) => funko.barcode !== null && normaliseBarcode(funko.barcode) === wanted,
    );
    const row = matches.find((funko) => funko.status === SubmissionStatusUtil.APPROVED) ?? matches[0];

    return row ? HttpResponse.json(toFunkoModel(row)) : notFound('Funko', String(params.barcode));
  }),
  http.get(`${baseUrl}/funkos/:funkoId`, async ({ params }) => {
    await delay(MOCK_DELAY);

    const row = mockStore.funkos.find((funko) => String(funko.id) === params.funkoId);
    const isVisible = row !== undefined && canSeeMockRow(row);

    return row && isVisible ? HttpResponse.json(toFunkoDetail(row)) : notFound('Funko', String(params.funkoId));
  }),
];
