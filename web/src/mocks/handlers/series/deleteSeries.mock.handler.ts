import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { notFound } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';

export default (baseUrl: string) => [
  http.delete(`${baseUrl}/series/:seriesId`, async ({ params }) => {
    await delay(MOCK_DELAY);

    const index = mockStore.series.findIndex((series) => String(series.id) === params.seriesId);

    if (index === -1) return notFound('Series', String(params.seriesId));

    // Like the API's foreign key (on delete set null): its funkos simply lose the series.
    for (const funko of mockStore.funkos) {
      if (String(funko.seriesId) === params.seriesId) funko.seriesId = null;
    }

    mockStore.series.splice(index, 1);

    return new HttpResponse(null, { status: 204 });
  }),
];
