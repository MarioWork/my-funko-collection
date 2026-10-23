import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { mockStore } from '@mocks/mockStore';

const CSV_CONTENT_TYPE = 'text/csv; charset=utf-8';
const CSV_HEADER =
  'collection,funko_id,name,number,category,series,type,is_chase,exclusive,barcode,quantity,condition,purchase_price,purchase_currency,purchased_at,tags,notes';

export default (baseUrl: string) => [
  http.get(`${baseUrl}/export`, async () => {
    await delay(MOCK_DELAY);

    return HttpResponse.json(
      {
        exportedAt: new Date().toISOString(),
        categories: mockStore.categories.map(({ id, name }) => ({ id, name })),
        funkos: mockStore.funkos,
        collections: mockStore.collections,
        tags: mockStore.tags,
        items: mockStore.items,
      },
      { headers: { 'content-disposition': 'attachment; filename="my-funko-collection.json"' } },
    );
  }),
  http.get(`${baseUrl}/export/items.csv`, async () => {
    await delay(MOCK_DELAY);

    return new HttpResponse(`${CSV_HEADER}\r\n`, {
      headers: { 'content-type': CSV_CONTENT_TYPE, 'content-disposition': 'attachment; filename="items.csv"' },
    });
  }),
];
