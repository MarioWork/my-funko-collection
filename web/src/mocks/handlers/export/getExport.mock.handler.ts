import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { readableCategories, readableFunkos } from '@mocks/mockCatalogueUtils';
import { mockStore } from '@mocks/mockStore';
import { nowIso } from '@mocks/mockStoreUtils';
import { attachment, CSV_CONTENT_TYPE, CSV_LINE_BREAK } from './funkosExportMockUtils';

const FULL_EXPORT_FILE_NAME = 'my-funko-collection.json';
const ITEMS_CSV_FILE_NAME = 'items.csv';
// The empty items.csv carries only its header; it has no image_urls column, unlike the funkos export.
const ITEMS_CSV_HEADER =
  'collection,funko_id,name,number,category,series,type,is_chase,exclusive,barcode,quantity,condition,purchase_price,purchase_currency,purchased_at,tags,notes';

export default (baseUrl: string) => [
  http.get(`${baseUrl}/export`, async () => {
    await delay(MOCK_DELAY);

    return HttpResponse.json(
      {
        exportedAt: nowIso(),
        categories: readableCategories().map(({ id, name }) => ({ id, name })),
        funkos: readableFunkos().map(({ status: _status, submittedById: _submittedById, ...funko }) => funko),
        collections: mockStore.collections,
        tags: mockStore.tags,
        items: mockStore.items,
      },
      { headers: { 'content-disposition': attachment(FULL_EXPORT_FILE_NAME) } },
    );
  }),
  http.get(`${baseUrl}/export/items.csv`, async () => {
    await delay(MOCK_DELAY);

    return new HttpResponse(`${ITEMS_CSV_HEADER}${CSV_LINE_BREAK}`, {
      headers: { 'content-type': CSV_CONTENT_TYPE, 'content-disposition': attachment(ITEMS_CSV_FILE_NAME) },
    });
  }),
];
