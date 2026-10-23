import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { notFound, toSeriesModel } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';

export default (baseUrl: string) => [
  http.get(`${baseUrl}/series/:seriesId`, async ({ params }) => {
    await delay(MOCK_DELAY);

    const row = mockStore.series.find((series) => String(series.id) === params.seriesId);

    return row ? HttpResponse.json(toSeriesModel(row)) : notFound('Series', String(params.seriesId));
  }),
];
